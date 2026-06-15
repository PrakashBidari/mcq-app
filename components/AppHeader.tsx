// components/AppHeader.tsx
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/constants";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AVATAR_COLORS = ["#7c3aed", "#2563eb", "#059669", "#ef4444", "#ea580c", "#0891b2"];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = (name ?? "U")[0].toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getAvatarColor(name ?? "U"),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.5)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "900" }}>
        {letter}
      </Text>
    </View>
  );
}

type Props = {
  title?: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
};

export default function AppHeader({ title, subtitle, searchValue, onSearchChange, searchPlaceholder }: Props) {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Learner";
  const hasSearch = onSearchChange !== undefined;

  useFocusEffect(
    useCallback(() => {
      const fetchProfileImage = async () => {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          if (!token) return;
          const res = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && data.data.profile_image)
            setProfileImage(data.data.profile_image);
        } catch {}
      };
      fetchProfileImage();
    }, []),
  );

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#6d28d9", "#7c3aed", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Top row: greeting + avatar */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hiTxt}>
              {user ? `Hi ${displayName} 👋` : (title ?? "Welcome, Ikigai Connect")}
            </Text>
            {subtitle ? <Text style={styles.subTxt}>{subtitle}</Text> : null}
          </View>
          {user ? (
            <TouchableOpacity onPress={() => router.push("/profile")}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImg} />
              ) : (
                <Avatar name={displayName} size={36} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginIconBtn}
            >
              <Ionicons name="person-circle-outline" size={38} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search bar (same style as Home) */}
        {hasSearch && (
          <View style={[styles.searchBar, isDark && { backgroundColor: colors.inputBg }]}>
            <Ionicons name="search-outline" size={16} color={isDark ? "#64748b" : "#9ca3af"} />
            <TextInput
              placeholder={searchPlaceholder ?? "Search…"}
              placeholderTextColor={isDark ? "#64748b" : "#9ca3af"}
              style={[styles.searchInput, { color: isDark ? colors.text : "#1e0f4e" }]}
              value={searchValue}
              onChangeText={onSearchChange}
              returnKeyType="search"
            />
            {(searchValue?.length ?? 0) > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange?.("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={isDark ? "#64748b" : "#9ca3af"} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    overflow: "hidden",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    zIndex: 10,
  },
  blob1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -55,
    right: -45,
  },
  blob2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 8,
    left: -28,
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  hiTxt: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  subTxt: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  profileImg: {
    width: 46,
    height: 46,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  loginIconBtn: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 7,
    fontSize: 13,
    color: "#1e0f4e",
  },
});
