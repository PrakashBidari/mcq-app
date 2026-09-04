// app/(tabs)/quiz.tsx
import AppHeader from "@/components/AppHeader";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { quizStore } from "@/utils/quizStore";
import { formatYen } from "@/utils/currency";
import {
  buyItem,
  onPurchaseFailed,
  onPurchaseUnlocked,
  PURCHASE_CANCELLED_CODE,
} from "@/utils/purchases";
import BookmarkToast from "@/components/BookmarkToast";
import { BookmarkItem, useBookmarks } from "@/hooks/useBookmarks";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string | null;
  question_sets_count: number;
  free_sets_count?: number;
  paid_sets_count?: number;
  packages_count?: number;
  has_children?: boolean;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions_count: number;
  is_paid?: boolean;
  price?: number | null;
  price_tier?: string | null;
  trial_enabled?: boolean;
  trial_type?: "attempts" | "days" | null;
  trial_value?: number | null;
  is_owned?: boolean;
  trial_available?: boolean;
}

interface QuestionSetPackage {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  price: number | null;
  price_tier: string | null;
  trial_enabled?: boolean;
  trial_type?: "attempts" | "days" | null;
  trial_value?: number | null;
  question_sets_count: number;
  is_owned: boolean;
  trial_available?: boolean;
}

interface PackageQuestionSet {
  id: number;
  name: string;
  description: string | null;
  questions_count: number;
}

// Generalized paywall target - either a standalone question set or a package.
interface PayTarget {
  purchaseType: "question_set" | "package";
  targetId: number;
  name?: string;
  price: number;
  price_tier: string | null;
  ios_product_id: string | null;
  android_product_id: string | null;
}

const CAT_ICONS: Record<string, string> = {
  Design: "color-palette-outline",
  Development: "code-slash-outline",
  Business: "briefcase-outline",
  Marketing: "megaphone-outline",
  Photography: "camera-outline",
  Music: "musical-notes-outline",
};

function getCatIcon(name: string, fallback?: string | null): string {
  return CAT_ICONS[name] ?? fallback ?? "grid-outline";
}

// Module-level, session-lifetime cache (stale-while-revalidate): switching
// category/subcategory shows the last-known data for it instantly instead of a
// blank/loading screen, then silently refreshes from the network. Combined with
// the request-id guards in each fetch* function below, this also fixes a real bug
// where quickly switching categories (e.g. SSW -> JLPT) could briefly show the
// previous category's question sets under the new category's header, because the
// old fetch's response could still land and overwrite state after the newer one.
let categoriesCache: Category[] | null = null;
const subcategoriesCache = new Map<number, Category[]>();
const questionSetsCache = new Map<number, { sets: QuestionSet[]; total: number; totalFree: number }>();
const packagesCache = new Map<number, QuestionSetPackage[]>();

export default function QuizScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { token, isAuthenticated } = useAuth();

  const { isBookmarked, toggleBookmark, reload: reloadBookmarks } = useBookmarks();
  const [removeTarget, setRemoveTarget] = useState<BookmarkItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastId, setToastId] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastId((n) => n + 1);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  };
  useFocusEffect(useCallback(() => { reloadBookmarks(); }, []));

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Subcategory drill-down (only shown for categories with has_children=true)
  const [viewingSubcategoriesOf, setViewingSubcategoriesOf] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [browseTab, setBrowseTab] = useState<"single" | "package">("single");
  const [packages, setPackages] = useState<QuestionSetPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<QuestionSetPackage | null>(null);
  const [packageQuestionSets, setPackageQuestionSets] = useState<PackageQuestionSet[]>([]);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState("10");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalQuestionsInCategory, setTotalQuestionsInCategory] = useState(0);
  // Question total across only the FREE, standalone sets - what the "Free Question Set
  // Quiz" card is actually allowed to draw from (see getRandomQuestionsFromCategory).
  const [totalFreeQuestionsInCategory, setTotalFreeQuestionsInCategory] = useState(0);

  // Purchase flow state - purchasingId is a question_set id OR a package id depending on payTarget.purchaseType
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [priceTiers, setPriceTiers] = useState<
    Record<string, { ios_product_id: string; android_product_id: string }>
  >({});

  // Each bumped before its own fetch starts, and checked after the response lands -
  // if another call to the same fetch* function has started in the meantime, this
  // is a stale/superseded response and must not overwrite state.
  const categoriesRequestId = useRef(0);
  const subcategoriesRequestId = useRef(0);
  const questionSetsRequestId = useRef(0);
  const packagesRequestId = useRef(0);

  // Blocks a second quiz-start while one is already in flight - the post-purchase
  // "Start Quiz" prompt, the card's own onPress, and a fast double-tap can otherwise
  // all fire startQuestionSetQuiz at once.
  const startingQuizRef = useRef(false);

  // is_owned/trial_available are baked into the cached responses per-user - drop
  // them on login/logout so a different (or now-anonymous) user never briefly sees
  // someone else's ownership/trial state from cache.
  useEffect(() => {
    questionSetsCache.clear();
    packagesCache.clear();
  }, [isAuthenticated]);

  useEffect(() => {
    fetch(`${API_URL}/price-tiers`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const map: Record<string, { ios_product_id: string; android_product_id: string }> = {};
        for (const tier of data.data.tiers) {
          map[tier.tier] = {
            ios_product_id: tier.ios_product_id,
            android_product_id: tier.android_product_id,
          };
        }
        setPriceTiers(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const unsubUnlock = onPurchaseUnlocked(({ purchaseType, targetId }) => {
      setPurchasingId(null);
      setPayTarget(null);
      if (selectedCategory) {
        fetchQuestionSets(selectedCategory.id);
        fetchPackages(selectedCategory.id);
      }
      if (purchaseType === "package") {
        Alert.alert(t("quiz.purchaseSuccessTitle"), t("quiz.purchaseSuccess"), [
          { text: "OK", onPress: () => openPackage(targetId) },
        ]);
      } else {
        Alert.alert(t("quiz.purchaseSuccessTitle"), t("quiz.purchaseSuccess"), [
          { text: t("quiz.startQuiz"), onPress: () => startQuestionSetQuiz(targetId) },
        ]);
      }
    });
    const unsubFail = onPurchaseFailed((_productId, code) => {
      setPurchasingId(null);
      if (code !== PURCHASE_CANCELLED_CODE) {
        Alert.alert(t("common.error"), t("quiz.purchaseFailed"));
      }
    });
    return () => {
      unsubUnlock();
      unsubFail();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const cached = categoriesCache;
    if (cached) setCategories(cached);
    else setIsLoading(true);

    const requestId = ++categoriesRequestId.current;
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (categoriesRequestId.current !== requestId) return; // superseded

      if (data.success) {
        categoriesCache = data.data;
        setCategories(data.data); // ← use raw API data directly
      } else if (!cached) {
        Alert.alert(t("common.error"), t("quiz.errorCategories"));
      }
    } catch {
      if (categoriesRequestId.current === requestId && !cached) {
        Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
      }
    } finally {
      if (categoriesRequestId.current === requestId) setIsLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    const cached = subcategoriesCache.get(categoryId);
    if (cached) setSubcategories(cached);
    else {
      setSubcategories([]); // don't show the previous category's subcategories
      setIsLoading(true);
    }

    const requestId = ++subcategoriesRequestId.current;
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}/subcategories`);
      const data = await response.json();
      if (subcategoriesRequestId.current !== requestId) return; // superseded

      if (data.success) {
        subcategoriesCache.set(categoryId, data.data.subcategories);
        setSubcategories(data.data.subcategories);
      } else if (!cached) {
        Alert.alert(t("common.error"), t("quiz.errorCategories"));
      }
    } catch {
      if (subcategoriesRequestId.current === requestId && !cached) {
        Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
      }
    } finally {
      if (subcategoriesRequestId.current === requestId) setIsLoading(false);
    }
  };

  const fetchPackages = async (categoryId: number) => {
    const cached = packagesCache.get(categoryId);
    setPackages(cached ?? []); // never leave the previous category's packages showing

    const requestId = ++packagesRequestId.current;
    try {
      const response = await fetch(`${API_URL}/categories/${categoryId}/packages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (packagesRequestId.current !== requestId) return; // superseded

      if (data.success) {
        packagesCache.set(categoryId, data.data.packages);
        setPackages(data.data.packages);
      }
    } catch {
      // non-fatal - the Package tab will just show empty
    }
  };

  const openPackage = async (packageId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/packages/${packageId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (data.success) {
        setSelectedPackage(data.data.package);
        setPackageQuestionSets(data.data.question_sets);
      } else {
        Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestionSets = async (categoryId: number) => {
    const cached = questionSetsCache.get(categoryId);
    if (cached) {
      setQuestionSets(cached.sets);
      setTotalQuestionsInCategory(cached.total);
      setTotalFreeQuestionsInCategory(cached.totalFree);
    } else {
      // No cached data for this category yet - clear the previous category's sets
      // instead of leaving them visible (dimmed) under the loading overlay.
      setQuestionSets([]);
      setTotalQuestionsInCategory(0);
      setTotalFreeQuestionsInCategory(0);
      setIsLoading(true);
    }

    const requestId = ++questionSetsRequestId.current;
    try {
      const response = await fetch(
        `${API_URL}/categories/${categoryId}/question-sets`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
      );
      const data = await response.json();
      if (questionSetsRequestId.current !== requestId) return; // superseded by a newer category selection

      if (data.success) {
        const sets = data.data.question_sets;
        const total = sets.reduce(
          (sum: number, set: QuestionSet) => sum + set.questions_count,
          0,
        );
        const totalFree = sets
          .filter((set: QuestionSet) => !set.is_paid)
          .reduce((sum: number, set: QuestionSet) => sum + set.questions_count, 0);
        questionSetsCache.set(categoryId, { sets, total, totalFree });
        setQuestionSets(sets);
        setTotalQuestionsInCategory(total);
        setTotalFreeQuestionsInCategory(totalFree);
      } else if (!cached) {
        Alert.alert(t("common.error"), t("quiz.errorSets"));
      }
    } catch {
      if (questionSetsRequestId.current === requestId && !cached) {
        Alert.alert(t("common.error"), t("quiz.errorSomethingWrong"));
      }
    } finally {
      if (questionSetsRequestId.current === requestId) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory) {
      await fetchQuestionSets(selectedCategory.id);
      await fetchPackages(selectedCategory.id);
    } else if (viewingSubcategoriesOf) {
      await fetchSubcategories(viewingSubcategoriesOf.id);
    } else {
      await fetchCategories();
    }
    setRefreshing(false);
  };

  const handleCategorySelect = async (category: Category) => {
    if (category.has_children) {
      setViewingSubcategoriesOf(category);
      await fetchSubcategories(category.id);
      return;
    }
    setBrowseTab("single");
    setSelectedPackage(null);
    setPackageQuestionSets([]);
    setSelectedCategory(category);
    await fetchQuestionSets(category.id);
    await fetchPackages(category.id);
  };

  const handleSubcategorySelect = async (subcategory: Category) => {
    setBrowseTab("single");
    setSelectedPackage(null);
    setPackageQuestionSets([]);
    setSelectedCategory(subcategory);
    await fetchQuestionSets(subcategory.id);
    await fetchPackages(subcategory.id);
  };

  const openFullCategoryModal = () => {
    const maxQ = totalFreeQuestionsInCategory;
    setNumberOfQuestions(Math.min(10, maxQ).toString());
    setShowQuestionModal(true);
  };

  const startFullCategoryQuiz = async () => {
    if (!selectedCategory) return;
    const numQuestions = parseInt(numberOfQuestions) || 10;
    setShowQuestionModal(false);
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/categories/${selectedCategory.id}/random-questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ count: numQuestions }),
        },
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        quizStore.setQuestions(data.data);
        quizStore.setQuestionSetId(null);
        quizStore.setCategoryId(selectedCategory.id);
        quizStore.setStartedAt(Date.now());
        router.push({
          pathname: "/quiz/play",
          params: { total: data.data.length },
        });
      } else {
        Alert.alert(t("common.error"), t("quiz.errorNoQuestions"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorLoadQuestions"));
    } finally {
      setIsLoading(false);
    }
  };

  const startQuestionSetQuiz = async (setId: number) => {
    if (startingQuizRef.current) return;
    startingQuizRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/question-set/${setId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();

      if (response.status === 403 && data.reason === "purchase_required") {
        const set = questionSets.find((s) => s.id === setId);
        const tier = data.data?.price_tier;
        if (!tier) {
          // No direct price tier (e.g. packaged/wallet-only content) - direct the
          // user to the wallet/subscription screen instead of a dead-end paywall.
          Alert.alert(t("common.error"), t("quiz.purchaseUnavailable"), [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("wallet.title", { defaultValue: "Get Access" }), onPress: () => router.push("/purchases") },
          ]);
          return;
        }
        setPayTarget({
          purchaseType: "question_set",
          targetId: setId,
          name: set?.name,
          price: tier.amount,
          price_tier: tier.tier_key,
          ios_product_id: tier.ios_product_id,
          android_product_id: tier.android_product_id,
        });
        return;
      }

      if (data.success && data.data.questions.length > 0) {
        quizStore.setQuestions(data.data.questions);
        quizStore.setQuestionSetId(setId);
        quizStore.setCategoryId(selectedCategory?.id ?? null);
        quizStore.setStartedAt(Date.now());
        router.push({
          pathname: "/quiz/play",
          params: {
            total: data.data.questions.length,
            timeLimit: data.data.set?.time_limit ?? 0,
          },
        });
      } else {
        Alert.alert(t("common.error"), t("quiz.errorNoQuestionsSet"));
      }
    } catch {
      Alert.alert(t("common.error"), t("quiz.errorLoadSet"));
    } finally {
      setIsLoading(false);
      startingQuizRef.current = false;
    }
  };

  const handleBuyPress = (set: QuestionSet) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    const tierIds = set.price_tier ? priceTiers[set.price_tier] : undefined;
    setPayTarget({
      purchaseType: "question_set",
      targetId: set.id,
      name: set.name,
      price: set.price ?? 0,
      price_tier: set.price_tier ?? null,
      ios_product_id: tierIds?.ios_product_id ?? null,
      android_product_id: tierIds?.android_product_id ?? null,
    });
  };

  const handleBuyPackagePress = (pkg: QuestionSetPackage) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    const tierIds = pkg.price_tier ? priceTiers[pkg.price_tier] : undefined;
    setPayTarget({
      purchaseType: "package",
      targetId: pkg.id,
      name: pkg.name,
      price: pkg.price ?? 0,
      price_tier: pkg.price_tier ?? null,
      ios_product_id: tierIds?.ios_product_id ?? null,
      android_product_id: tierIds?.android_product_id ?? null,
    });
  };

  const confirmPurchase = async () => {
    if (!payTarget || !payTarget.price_tier) {
      Alert.alert(t("common.error"), t("quiz.purchaseUnavailable"));
      setPayTarget(null);
      return;
    }
    setPurchasingId(payTarget.targetId);
    try {
      await buyItem({
        purchaseType: payTarget.purchaseType,
        targetId: payTarget.targetId,
        priceTier: payTarget.price_tier,
        iosProductId: payTarget.ios_product_id,
        androidProductId: payTarget.android_product_id,
      });
    } catch (error) {
      setPurchasingId(null);
      // A cancelled / already-handled purchase must just let the user try again
      // with no scary alert. Only surface a real, unexpected failure.
      const code = error instanceof Error ? error.message : "";
      if (code === "purchase_already_pending" || code === PURCHASE_CANCELLED_CODE) {
        return;
      }
      Alert.alert(t("common.error"), t("quiz.purchaseFailed"));
    }
  };

  // ─── Loading screen ───
  if (isLoading && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>{t("quiz.loadingCategories")}</Text>
      </View>
    );
  }

  // ─── Category List ───
  if (!selectedCategory && !viewingSubcategoriesOf) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader
          title="MCQ"
          subtitle={t("quiz.subtitle")}
          searchValue={categorySearch}
          onSearchChange={setCategorySearch}
          searchPlaceholder={t("quiz.searchPlaceholder")}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7c3aed"]}
              tintColor="#7c3aed"
            />
          }
        >
          <View>
            {categories
              .filter((c) =>
                categorySearch.trim().length === 0 ||
                c.name.toLowerCase().includes(categorySearch.toLowerCase()),
              )
              .map((category) => {
              const icon = getCatIcon(category.name, category.icon);
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                  style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: category.color, borderLeftWidth: 4 }]}
                >
                  <View style={styles.categoryCardRow}>
                    <View
                      style={[
                        styles.categoryIconBox,
                        { backgroundColor: category.color + "18", borderWidth: 2, borderColor: category.color + "40" },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={34}
                        color={category.color}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                      <View style={styles.categoryMeta}>
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color={isDark ? "#64748b" : "#6b7280"}
                        />
                        <Text style={[styles.categoryMetaText, { color: colors.textSecondary }]}>
                          {category.question_sets_count} {t("quiz.questionSets")}
                        </Text>
                      </View>
                      {!!category.paid_sets_count && (
                        <View style={styles.categoryCountBadge}>
                          {!!category.free_sets_count && (
                            <Text style={styles.categoryFreeCountText}>
                              {category.free_sets_count} {t("quiz.free")}
                            </Text>
                          )}
                          <Text style={styles.categoryPaidCountText}>
                            {category.paid_sets_count} {t("quiz.paid")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCategorySelect(category);
                      }}
                      style={[
                        styles.categoryStartButton,
                        { backgroundColor: category.color + "15" },
                      ]}
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color={category.color}
                      />
                      <Text
                        style={[
                          styles.categoryStartText,
                          { color: category.color },
                        ]}
                      >
                        {t("quiz.start")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Subcategory List (only for categories with has_children=true) ───
  if (!selectedCategory && viewingSubcategoriesOf) {
    const parent = viewingSubcategoriesOf;
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[parent.color, parent.color + "dd"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <TouchableOpacity onPress={() => setViewingSubcategoriesOf(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>{t("quiz.backToCategories")}</Text>
          </TouchableOpacity>
          <View style={styles.gradientCategoryRow}>
            <View style={styles.gradientCategoryIcon}>
              <Ionicons name={getCatIcon(parent.name, parent.icon) as any} size={24} color="white" />
            </View>
            <View style={styles.gradientCategoryTextWrap}>
              <Text style={styles.gradientLabel}>{t("quiz.categoryLabel")}</Text>
              <Text style={styles.gradientTitle}>{parent.name}</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7c3aed"]} tintColor="#7c3aed" />
          }
        >
          <View>
            {subcategories.map((sub) => {
              const icon = getCatIcon(sub.name, sub.icon);
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.8}
                  onPress={() => handleSubcategorySelect(sub)}
                  style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: sub.color, borderLeftWidth: 4 }]}
                >
                  <View style={styles.categoryCardRow}>
                    <View style={[styles.categoryIconBox, { backgroundColor: sub.color + "18", borderWidth: 2, borderColor: sub.color + "40" }]}>
                      <Ionicons name={icon as any} size={34} color={sub.color} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{sub.name}</Text>
                      <View style={styles.categoryMeta}>
                        <Ionicons name="folder-outline" size={16} color={isDark ? "#64748b" : "#6b7280"} />
                        <Text style={[styles.categoryMetaText, { color: colors.textSecondary }]}>
                          {sub.question_sets_count} {t("quiz.questionSets")}
                        </Text>
                      </View>
                      {!!sub.packages_count && (
                        <View style={styles.categoryMeta}>
                          <Ionicons name="albums-outline" size={16} color={isDark ? "#64748b" : "#6b7280"} />
                          <Text style={[styles.categoryMetaText, { color: colors.textSecondary }]}>
                            {sub.packages_count} {t("quiz.packages")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Question Sets View ───
  if (!selectedCategory) return null;
  const categoryIcon = getCatIcon(selectedCategory.name, selectedCategory.icon);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[selectedCategory.color, selectedCategory.color + "dd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>
            {viewingSubcategoriesOf
              ? t("quiz.backToParent", { name: viewingSubcategoriesOf.name })
              : t("quiz.backToCategories")}
          </Text>
        </TouchableOpacity>

        {/* Breadcrumb: show the parent category (e.g. JLPT) above the subcategory
            title (e.g. Design) so it's clear which top-level category this belongs to. */}
        {viewingSubcategoriesOf && (
          <Text style={styles.gradientBreadcrumb}>{viewingSubcategoriesOf.name}</Text>
        )}

        <View style={styles.gradientCategoryRow}>
          <View style={styles.gradientCategoryIcon}>
            <Ionicons name={categoryIcon as any} size={24} color="white" />
          </View>
          <View style={styles.gradientCategoryTextWrap}>
            <Text style={styles.gradientLabel}>{t("quiz.categoryLabel")}</Text>
            <Text style={styles.gradientTitle}>{selectedCategory.name}</Text>
          </View>
        </View>
        <Text style={styles.gradientSubtitle}>
          {questionSets.length} {t("quiz.questionSets")} • {totalQuestionsInCategory} {t("quiz.totalQuestions")}
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
      >
        {/* Single Sets / Packages tab switcher - placed above the quiz card so
            packages for this category are visible immediately, not scrolled past. */}
        {packages.length > 0 && (
          <View style={styles.browseTabRow}>
            <TouchableOpacity
              onPress={() => setBrowseTab("single")}
              style={[
                styles.browseTabBtn,
                { marginRight: 8 },
                browseTab === "single" && { backgroundColor: selectedCategory.color },
              ]}
            >
              <Text
                style={[
                  styles.browseTabText,
                  { color: browseTab === "single" ? "#fff" : selectedCategory.color },
                ]}
              >
                {t("quiz.singleSetsTab")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBrowseTab("package")}
              style={[
                styles.browseTabBtn,
                browseTab === "package" && { backgroundColor: selectedCategory.color },
              ]}
            >
              <Text
                style={[
                  styles.browseTabText,
                  { color: browseTab === "package" ? "#fff" : selectedCategory.color },
                ]}
              >
                {t("quiz.packagesTab")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Free Question Set Quiz Card - only draws from free, standalone sets */}
        {browseTab === "single" && totalFreeQuestionsInCategory > 0 && (
          <View style={styles.fullQuizSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={openFullCategoryModal}
              style={[
                styles.fullQuizCard,
                { borderColor: selectedCategory.color, backgroundColor: colors.card },
              ]}
            >
              <View style={styles.fullQuizCardTop}>
                <View
                  style={[
                    styles.fullQuizIcon,
                    { backgroundColor: selectedCategory.color + "15" },
                  ]}
                >
                  <Ionicons
                    name="flash"
                    size={28}
                    color={selectedCategory.color}
                  />
                </View>
                <View style={styles.fullQuizText}>
                  <Text style={[styles.fullQuizTitle, { color: colors.text }]}>{t("quiz.fullCategoryQuiz")}</Text>
                  <Text style={[styles.fullQuizSubtitle, { color: colors.textSecondary }]}>
                    {t("quiz.randomQuestions")}
                  </Text>
                </View>
              </View>

              <View style={styles.fullQuizMeta}>
                <Ionicons name="help-circle-outline" size={16} color={isDark ? "#64748b" : "#6b7280"} />
                <Text style={[styles.fullQuizMetaText, { color: colors.textSecondary }]}>
                  {totalFreeQuestionsInCategory} {t("quiz.questionsAvailable")}
                </Text>
              </View>

              <View
                style={[
                  styles.fullQuizStartButton,
                  { backgroundColor: selectedCategory.color },
                ]}
              >
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.fullQuizStartText}>{t("quiz.startFullQuiz")}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {browseTab === "package" ? (
          selectedPackage ? (
            <>
              {/* ─── Package Detail ─── */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedPackage(null);
                  setPackageQuestionSets([]);
                }}
                style={styles.packageBackRow}
              >
                <Ionicons name="arrow-back" size={18} color={selectedCategory.color} />
                <Text style={[styles.packageBackText, { color: selectedCategory.color }]}>
                  {t("quiz.backToPackages")}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedPackage.name}</Text>
              {selectedPackage.description && (
                <Text style={[styles.setDesc, { color: colors.textSecondary, marginBottom: 16 }]}>
                  {selectedPackage.description}
                </Text>
              )}
              <View>
                {packageQuestionSets.map((qs) => (
                  <View
                    key={qs.id}
                    style={[
                      styles.setCard,
                      { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: selectedCategory.color, borderTopWidth: 3 },
                    ]}
                  >
                    <View style={styles.setCardInner}>
                      <Text style={[styles.setName, { color: colors.text }]}>{qs.name}</Text>
                      {qs.description && (
                        <Text style={[styles.setDesc, { color: colors.textSecondary }]}>{qs.description}</Text>
                      )}
                      <View style={styles.setMeta}>
                        <Ionicons name="help-circle-outline" size={14} color={isDark ? "#64748b" : "#6b7280"} />
                        <Text style={[styles.setMetaText, { color: colors.textSecondary }]}>
                          {qs.questions_count} questions
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => startQuestionSetQuiz(qs.id)}
                        style={[
                          styles.setStartButton,
                          { backgroundColor: selectedCategory.color + "15" },
                        ]}
                      >
                        <Ionicons name="play-circle-outline" size={18} color={selectedCategory.color} />
                        <Text style={[styles.setStartText, { color: selectedCategory.color }]}>
                          {t("quiz.startThisSet")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* ─── Package List ─── */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("quiz.packagesSection")}</Text>
              <View>
                {packages.length === 0 ? (
                  <Text style={[styles.setDesc, { color: colors.textSecondary }]}>{t("quiz.noPackages")}</Text>
                ) : (
                  packages.map((pkg) => {
                    const pkgNeedsPay = pkg.is_paid && !pkg.is_owned;
                    const pkgTrialAvailable = pkgNeedsPay && pkg.trial_available;
                    return (
                    <TouchableOpacity
                      key={pkg.id}
                      activeOpacity={0.8}
                      onPress={() => (pkgNeedsPay ? handleBuyPackagePress(pkg) : openPackage(pkg.id))}
                      disabled={purchasingId === pkg.id}
                      style={[
                        styles.setCard,
                        { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: selectedCategory.color, borderTopWidth: 3 },
                      ]}
                    >
                      <View style={styles.setCardInner}>
                        <View style={styles.setNameRow}>
                          <Text style={[styles.setName, { color: colors.text, flex: 1 }]}>{pkg.name}</Text>
                          {pkg.is_paid ? (
                            pkg.is_owned ? (
                              <View style={styles.freeBadge}>
                                <Text style={styles.freeBadgeText}>{t("quiz.owned")}</Text>
                              </View>
                            ) : (
                              <View style={styles.priceBadge}>
                                <Ionicons name="pricetag" size={12} color="#7c3aed" />
                                <Text style={styles.priceText}>{formatYen(pkg.price ?? 0)}</Text>
                              </View>
                            )
                          ) : (
                            <View style={styles.freeBadge}>
                              <Text style={styles.freeBadgeText}>{t("quiz.free")}</Text>
                            </View>
                          )}
                        </View>
                        {pkg.description && (
                          <Text style={[styles.setDesc, { color: colors.textSecondary }]}>{pkg.description}</Text>
                        )}
                        <View style={styles.setMeta}>
                          <Ionicons name="layers-outline" size={14} color={isDark ? "#64748b" : "#6b7280"} />
                          <Text style={[styles.setMetaText, { color: colors.textSecondary }]}>
                            {pkg.question_sets_count} {t("quiz.questionSets")}
                          </Text>
                        </View>
                        <View style={styles.setCardActions}>
                          {pkgTrialAvailable && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                openPackage(pkg.id);
                              }}
                              disabled={purchasingId === pkg.id}
                              style={[
                                styles.setStartButton,
                                styles.trialButton,
                                { flex: 1, marginRight: 8, opacity: purchasingId === pkg.id ? 0.6 : 1 },
                              ]}
                            >
                              <Ionicons name="gift-outline" size={18} color="#10b981" />
                              <Text style={[styles.setStartText, styles.trialButtonText]}>
                                {t("quiz.freeTrialButton")}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <View
                            style={[
                              styles.setStartButton,
                              { flex: 1, backgroundColor: selectedCategory.color + "15", opacity: purchasingId === pkg.id ? 0.6 : 1 },
                            ]}
                          >
                            {purchasingId === pkg.id ? (
                              <ActivityIndicator size="small" color={selectedCategory.color} />
                            ) : (
                              <>
                                <Ionicons
                                  name={pkgNeedsPay ? "card-outline" : "folder-open-outline"}
                                  size={18}
                                  color={selectedCategory.color}
                                />
                                <Text style={[styles.setStartText, { color: selectedCategory.color }]}>
                                  {pkgNeedsPay
                                    ? t("quiz.payButton", { price: formatYen(pkg.price ?? 0) })
                                    : t("quiz.viewPackage")}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </>
          )
        ) : (
          <>
            {/* Question Sets */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("quiz.questionSetsSection")}</Text>

            <View>
              {questionSets.map((set) => (
                <View key={set.id} style={[styles.setCard, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: selectedCategory.color, borderTopWidth: 3 }]}>
              <View style={styles.setCardInner}>
                <View style={styles.setNameRow}>
                  <Text style={[styles.setName, { color: colors.text, flex: 1 }]}>{set.name}</Text>
                  {set.is_paid ? (
                    set.is_owned ? (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>{t("quiz.owned")}</Text>
                      </View>
                    ) : (
                      <View style={styles.priceBadge}>
                        <Ionicons name="pricetag" size={12} color="#7c3aed" />
                        <Text style={styles.priceText}>{formatYen(set.price ?? 0)}</Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>{t("quiz.free")}</Text>
                    </View>
                  )}
                </View>
                {set.description && (
                  <Text style={[styles.setDesc, { color: colors.textSecondary }]}>{set.description}</Text>
                )}
                <View style={styles.setMeta}>
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color={isDark ? "#64748b" : "#6b7280"}
                  />
                  <Text style={[styles.setMetaText, { color: colors.textSecondary }]}>
                    {set.questions_count} questions
                  </Text>
                </View>

                <View style={styles.setCardActions}>
                  {set.is_paid && !set.is_owned && set.trial_available && (
                    <TouchableOpacity
                      onPress={() => startQuestionSetQuiz(set.id)}
                      disabled={purchasingId === set.id}
                      style={[
                        styles.setStartButton,
                        styles.trialButton,
                        { flex: 1, marginRight: 8, opacity: purchasingId === set.id ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons name="gift-outline" size={18} color="#10b981" />
                      <Text style={[styles.setStartText, styles.trialButtonText]}>
                        {t("quiz.freeTrialButton")}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      set.is_paid && !set.is_owned
                        ? handleBuyPress(set)
                        : startQuestionSetQuiz(set.id)
                    }
                    disabled={purchasingId === set.id}
                    style={[
                      styles.setStartButton,
                      {
                        flex: 1,
                        marginRight: 8,
                        backgroundColor: selectedCategory.color + "15",
                        opacity: purchasingId === set.id ? 0.6 : 1,
                      },
                    ]}
                  >
                    {purchasingId === set.id ? (
                      <ActivityIndicator size="small" color={selectedCategory.color} />
                    ) : (
                      <>
                        <Ionicons
                          name={set.is_paid && !set.is_owned ? "card-outline" : "play-circle-outline"}
                          size={18}
                          color={selectedCategory.color}
                        />
                        <Text
                          style={[
                            styles.setStartText,
                            { color: selectedCategory.color },
                          ]}
                        >
                          {set.is_paid && !set.is_owned
                            ? t("quiz.payButton", { price: formatYen(set.price ?? 0) })
                            : t("quiz.startThisSet")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const item: BookmarkItem = {
                        type: "quiz",
                        id: String(set.id),
                        title: set.name,
                        subtitle: selectedCategory.name,
                        meta: `${set.questions_count} questions`,
                        data: { ...set, categoryId: selectedCategory.id, categoryName: selectedCategory.name, categoryColor: selectedCategory.color },
                        savedAt: Date.now(),
                      };
                      if (isBookmarked("quiz", set.id)) {
                        setRemoveTarget(item);
                      } else {
                        toggleBookmark(item);
                        triggerToast();
                      }
                    }}
                    style={[
                      styles.setBookmarkBtn,
                      {
                        backgroundColor: isBookmarked("quiz", set.id)
                          ? "#ef4444"
                          : "#f3f4f6",
                      },
                    ]}
                  >
                    <Ionicons
                      name={isBookmarked("quiz", set.id) ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={isBookmarked("quiz", set.id) ? "#fff" : "#667eea"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── Question Count Modal ─── */}
      <Modal
        visible={showQuestionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons
                  name="help-circle"
                  size={32}
                  color={selectedCategory.color}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("quiz.howManyQuestions")}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {t("quiz.max")} {totalFreeQuestionsInCategory} {t("quiz.questionsAvailable")}
              </Text>
            </View>

            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num > 1) setNumberOfQuestions((num - 1).toString());
                }}
                style={[
                  styles.stepperButton,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={selectedCategory.color}
                />
              </TouchableOpacity>

              <TextInput
                value={numberOfQuestions}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  if (num <= totalFreeQuestionsInCategory)
                    setNumberOfQuestions(text);
                }}
                keyboardType="numeric"
                style={[
                  styles.stepperInput,
                  {
                    backgroundColor: selectedCategory.color + "10",
                    color: selectedCategory.color,
                  },
                ]}
                maxLength={3}
              />

              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(numberOfQuestions) || 0;
                  if (num < totalFreeQuestionsInCategory)
                    setNumberOfQuestions((num + 1).toString());
                }}
                style={[
                  styles.stepperButton,
                  { backgroundColor: selectedCategory.color + "15" },
                ]}
              >
                <Ionicons name="add" size={24} color={selectedCategory.color} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickSelect}>
              {[5, 10, 15, 20].map((num, index) => {
                const isDisabled = num > totalFreeQuestionsInCategory;
                const isSelected = numberOfQuestions === num.toString();
                return (
                  <TouchableOpacity
                    key={num}
                    onPress={() =>
                      !isDisabled && setNumberOfQuestions(num.toString())
                    }
                    disabled={isDisabled}
                    style={[
                      styles.quickSelectItem,
                      index < 3 && styles.quickSelectItemMR,
                      {
                        backgroundColor: isSelected
                          ? selectedCategory.color
                          : isDisabled
                            ? (isDark ? "#1e1e30" : "#f3f4f6")
                            : selectedCategory.color + "15",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickSelectText,
                        {
                          color: isSelected
                            ? "#fff"
                            : isDisabled
                              ? (isDark ? "#4b5563" : "#9ca3af")
                              : selectedCategory.color,
                        },
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={startFullCategoryQuiz}
              disabled={isLoading}
              style={[
                styles.modalStartButton,
                {
                  backgroundColor: selectedCategory.color,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalStartText}>{t("quiz.startQuiz")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQuestionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>{t("quiz.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BookmarkToast key={toastId} visible={showToast} />

      {/* ─── Purchase Confirmation Modal ─── */}
      <Modal
        visible={!!payTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setPayTarget(null)}
      >
        <View style={styles.paymentModalOverlay}>
          <TouchableOpacity
            style={styles.paymentModalBackdrop}
            activeOpacity={1}
            onPress={() => setPayTarget(null)}
          />
          <View style={styles.paymentModalContent}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentHeaderTop}>
                <Text style={styles.paymentTitle}>{t("quiz.purchaseRequiredTitle")}</Text>
                <TouchableOpacity
                  onPress={() => setPayTarget(null)}
                  style={styles.paymentCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.comingSoonBody}>
              <View style={styles.comingSoonIconWrap}>
                <Ionicons name="lock-closed" size={36} color="#7c3aed" />
              </View>
              {!!payTarget?.name && (
                <Text style={styles.comingSoonTitle}>{payTarget.name}</Text>
              )}
              <Text style={styles.comingSoonSubtitle}>{formatYen(payTarget?.price ?? 0)}</Text>
              <Text style={styles.comingSoonMsg}>{t("quiz.purchaseRequiredMessage")}</Text>
              <TouchableOpacity
                onPress={confirmPurchase}
                disabled={purchasingId !== null}
                style={[styles.comingSoonPlayBtn, { opacity: purchasingId !== null ? 0.6 : 1 }]}
              >
                {purchasingId !== null ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color="#fff" />
                    <Text style={styles.comingSoonPlayText}>
                      {t("quiz.payButton", { price: formatYen(payTarget?.price ?? 0) })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPayTarget(null)}
                style={styles.comingSoonCancelBtn}
              >
                <Text style={styles.comingSoonCancelText}>{t("quiz.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Login Required Modal ─── */}
      <Modal
        visible={showLoginPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loginModalSheet}>
            <View style={styles.loginModalIconWrap}>
              <Ionicons name="lock-closed" size={32} color="#7c3aed" />
            </View>
            <Text style={styles.loginModalTitle}>{t("quiz.loginRequiredForPurchase")}</Text>
            <Text style={styles.loginModalMsg}>{t("quiz.loginRequiredForPurchaseMessage")}</Text>
            <TouchableOpacity
              onPress={() => {
                setShowLoginPrompt(false);
                router.push("/(auth)/login");
              }}
              style={styles.loginModalBtn}
            >
              <Ionicons name="log-in-outline" size={18} color="#fff" />
              <Text style={styles.loginModalBtnText}>{t("auth.login.signIn")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowLoginPrompt(false)}
              style={styles.loginModalCancel}
            >
              <Text style={styles.loginModalCancelText}>{t("quiz.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Remove Bookmark Modal ─── */}
      <Modal
        visible={!!removeTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveTarget(null)}
      >
        <View style={styles.removeModalOverlay}>
          <TouchableOpacity
            style={styles.removeModalBackdrop}
            activeOpacity={1}
            onPress={() => setRemoveTarget(null)}
          />
          <Animatable.View
            animation="slideInUp"
            duration={280}
            style={[styles.removeModalSheet, { backgroundColor: colors.card }]}
          >
            <View style={styles.removeModalHandle} />
            <View style={styles.removeModalIconWrap}>
              <Ionicons name="bookmark" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.removeModalTitle, { color: colors.text }]}>
              Remove Bookmark
            </Text>
            <Text
              style={[styles.removeModalItemName, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              "{removeTarget?.title}"
            </Text>
            <Text style={[styles.removeModalDesc, { color: colors.textSecondary }]}>
              This item will be removed from your saved bookmarks. You can bookmark it again at any time.
            </Text>
            <TouchableOpacity
              onPress={async () => {
                if (removeTarget) {
                  await toggleBookmark(removeTarget);
                  setRemoveTarget(null);
                }
              }}
              style={styles.removeBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.removeBtnText}>Remove Bookmark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRemoveTarget(null)}
              style={[styles.keepBtn, { backgroundColor: isDark ? "#1e1e30" : "#f3f4f6" }]}
            >
              <Text style={[styles.keepBtnText, { color: colors.textSecondary }]}>Keep it</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  // ... (keep all existing styles) ...
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  flex1: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#4b5563",
    marginTop: 16,
    fontSize: 16,
  },
  gradientHeader: {
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  gradientLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
  },
  gradientBreadcrumb: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  gradientTitle: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 4,
    flexShrink: 1,
  },
  gradientSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  gradientCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  // Bounds the label+title column to the row's remaining width so a long
  // category/subcategory name wraps instead of overflowing past the screen edge.
  gradientCategoryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  gradientCategoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  categoryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  categoryIconBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryName: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
    flexWrap: "wrap",
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryMetaText: {
    color: "#4b5563",
    fontSize: 14,
    marginLeft: 4,
  },
  fullQuizSection: {
    marginBottom: 24,
  },
  fullQuizCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 7,
  },
  fullQuizCardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fullQuizIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fullQuizText: {
    flex: 1,
    marginLeft: 12,
  },
  fullQuizTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 4,
  },
  fullQuizSubtitle: {
    color: "#4b5563",
    fontSize: 14,
  },
  fullQuizMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fullQuizMetaText: {
    color: "#4b5563",
    fontSize: 14,
    marginLeft: 4,
  },
  fullQuizStartButton: {
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullQuizStartText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 16,
  },

  // ── Single Sets / Packages Tab Switcher ──
  browseTabRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  browseTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  browseTabText: {
    fontWeight: "700",
    fontSize: 14,
  },
  packageBackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  packageBackText: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },

  setCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  setCardInner: {
    padding: 16,
  },

  // ── Price / Free / Owned Badges ──
  freeBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  freeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  priceBadge: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  priceText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },

  setNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  setName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.1,
  },
  setDesc: {
    color: "#4b5563",
    fontSize: 14,
    marginBottom: 8,
  },
  setMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  setMetaText: {
    color: "#4b5563",
    fontSize: 12,
    marginLeft: 4,
  },
  setCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  setStartButton: {
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  setStartText: {
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
  trialButton: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  trialButtonText: {
    color: "#10b981",
  },
  setBookmarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Question Modal (existing) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 36,
    fontWeight: "900",
    paddingVertical: 12,
    borderRadius: 16,
    marginHorizontal: 12,
  },
  quickSelect: {
    flexDirection: "row",
    marginBottom: 24,
  },
  quickSelectItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickSelectItemMR: {
    marginRight: 8,
  },
  quickSelectText: {
    fontWeight: "700",
    fontSize: 14,
  },
  modalStartButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalStartText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalCancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Payment / Coming Soon Modal ──
  paymentModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  paymentModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  paymentModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  paymentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  paymentHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  paymentCloseBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonBody: {
    padding: 28,
    alignItems: "center",
  },
  comingSoonIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  comingSoonSubtitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7c3aed",
    textAlign: "center",
    marginBottom: 12,
  },
  comingSoonMsg: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  comingSoonPlayBtn: {
    backgroundColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  comingSoonPlayText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  comingSoonCancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  comingSoonCancelText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  categoryStartButton: {
    marginTop: 12,
    transform: [{ translateY: 18 }],
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryStartText: {
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 8,
  },

  categoryCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  categoryFreeCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  categoryPaidCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  loginModalSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  loginModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  loginModalMsg: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  loginModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  loginModalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginModalCancel: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  loginModalCancelText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // ── Remove Bookmark Modal ──
  removeModalOverlay: { flex: 1, justifyContent: "flex-end" },
  removeModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  removeModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: "center",
  },
  removeModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 24,
  },
  removeModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  removeModalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  removeModalItemName: { fontSize: 14, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
  removeModalDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    gap: 8,
    marginBottom: 10,
  },
  removeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  keepBtn: { paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center" },
  keepBtnText: { fontSize: 16, fontWeight: "600" },
});
