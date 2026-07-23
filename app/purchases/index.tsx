// app/purchases/index.tsx
import AppBottomTabBar from "@/components/AppBottomTabBar";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { formatYen } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PurchasedSet {
  id: number;
  question_set_id: number;
  question_set_name: string | null;
  category_name: string | null;
  price_paid: number;
  currency: string;
  purchased_at: string;
}

export default function MyPurchasesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();

  const [purchases, setPurchases] = useState<PurchasedSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPurchases = useCallback(async (): Promise<boolean> => {
    if (!token) {
      setPurchases([]);
      setIsLoading(false);
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/purchases/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setPurchases(data.data);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchPurchases();
    }, [fetchPurchases]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases();
    setRefreshing(false);
  };

  const handleRecheck = async () => {
    setIsLoading(true);
    const succeeded = await fetchPurchases();
    Alert.alert("", succeeded ? t("purchases.recheckSuccess") : t("purchases.recheckFailed"));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("purchases.title")}</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("purchases.loadingPurchases")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("purchases.subtitle")}
          </Text>

          {purchases.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("purchases.empty")}
              </Text>
            </View>
          ) : (
            purchases.map((purchase) => (
              <View
                key={purchase.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                </View>
                <View style={styles.flex1}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {purchase.question_set_name ?? "-"}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    {purchase.category_name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                    {t("purchases.purchasedOn", {
                      date: new Date(purchase.purchased_at).toLocaleDateString(),
                    })}
                  </Text>
                </View>
                <Text style={styles.cardPrice}>{formatYen(purchase.price_paid)}</Text>
              </View>
            ))
          )}

          <TouchableOpacity onPress={handleRecheck} style={styles.recheckBtn}>
            <Ionicons name="refresh" size={18} color="#7c3aed" />
            <Text style={styles.recheckText}>{t("purchases.recheckButton")}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <AppBottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
  flex1: { flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  cardIconWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSubtitle: { fontSize: 12, marginTop: 2 },
  cardMeta: { fontSize: 11, marginTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: "800", color: "#7c3aed" },
  recheckBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3e8ff",
    marginTop: 8,
  },
  recheckText: { color: "#7c3aed", fontWeight: "700", fontSize: 14 },
});
