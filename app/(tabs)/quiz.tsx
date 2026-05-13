// app/(tabs)/quiz.tsx
import { API_URL } from "@/config/constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
  free_sets_count?: number; // ← add
  paid_sets_count?: number; // ← add
  min_price?: number;
  has_paid_sets?: boolean;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  questions_count: number;
  price: number | null;
  is_paid: boolean; // ← from API
  is_free: boolean; // ← derived from is_paid
}

export default function QuizScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [selectedCategoryForPayment, setSelectedCategoryForPayment] =
    useState<Category | null>(null);

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [numberOfQuestions, setNumberOfQuestions] = useState("10");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalQuestionsInCategory, setTotalQuestionsInCategory] = useState(0);

  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // const fetchCategories = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(`${API_URL}/categories`);
  //     const data = await response.json();
  //     if (data.success) {
  //       const categoriesWithPricing = data.data.map(
  //         (cat: Category, index: number) => ({
  //           ...cat,
  //           min_price: index % 2 === 0 ? 0 : (index + 1) * 3.99,
  //           has_paid_sets: index % 2 !== 0,
  //         }),
  //       );

  //       setCategories(categoriesWithPricing);
  //     } else Alert.alert("Error", "Failed to load categories");
  //   } catch (error) {
  //     console.error("Error fetching categories:", error);
  //     Alert.alert("Error", "Something went wrong");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data); // ← use raw API data directly
      } else Alert.alert("Error", "Failed to load categories");
    } catch (error) {
      console.error("Error fetching categories:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // const fetchQuestionSets = async (categoryId: number) => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(
  //       `${API_URL}/categories/${categoryId}/question-sets`,
  //     );
  //     const data = await response.json();
  //     if (data.success) {
  //       // Add dummy pricing (you'll get this from API later)
  //       const setsWithPrice = data.data.question_sets.map(
  //         (set: QuestionSet, index: number) => ({
  //           ...set,
  //           price: index % 3 === 0 ? 0 : (index + 1) * 5.99, // Dummy prices
  //           is_free: index % 3 === 0, // Every 3rd set is free
  //         }),
  //       );
  //       setQuestionSets(setsWithPrice);
  //       const total = setsWithPrice.reduce(
  //         (sum: number, set: QuestionSet) => sum + set.questions_count,
  //         0,
  //       );
  //       setTotalQuestionsInCategory(total);
  //     } else {
  //       Alert.alert("Error", "Failed to load question sets");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching question sets:", error);
  //     Alert.alert("Error", "Something went wrong");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchQuestionSets = async (categoryId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/categories/${categoryId}/question-sets`,
      );
      const data = await response.json();
      if (data.success) {
        const sets = data.data.question_sets.map((set: any) => ({
          ...set,
          is_paid: set.is_paid ?? false, // ← from API
          price: set.price ?? 0, // ← from API
          is_free: !set.is_paid, // ← derived
        }));
        setQuestionSets(sets);
        const total = sets.reduce(
          (sum: number, set: QuestionSet) => sum + set.questions_count,
          0,
        );
        setTotalQuestionsInCategory(total);
      } else {
        Alert.alert("Error", "Failed to load question sets");
      }
    } catch (error) {
      console.error("Error fetching question sets:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedCategory) await fetchQuestionSets(selectedCategory.id);
    else await fetchCategories();
    setRefreshing(false);
  };

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    await fetchQuestionSets(category.id);
  };

  const openFullCategoryModal = () => {
    const maxQ = totalQuestionsInCategory;
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: numQuestions }),
        },
      );
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data),
            total: data.data.length,
          },
        });
      } else {
        Alert.alert("Error", "No questions available");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      Alert.alert("Error", "Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryAction = (category: Category) => {
    if (!category.has_paid_sets) {
      handleCategorySelect(category);
    } else {
      setSelectedCategoryForPayment(category);
      setShowPaymentModal(true);
    }
  };

  const handleSetAction = async (set: QuestionSet) => {
    if (set.is_free) {
      // Start quiz directly if free
      startQuestionSetQuiz(set.id);
    } else {
      // Show payment modal if paid
      setSelectedSet(set);
      setShowPaymentModal(true);
    }
  };

  const startQuestionSetQuiz = async (setId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/question-set/${setId}`);
      const data = await response.json();
      if (data.success && data.data.questions.length > 0) {
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data.questions),
            total: data.data.questions.length,
          },
        });
      } else {
        Alert.alert("Error", "No questions available in this set");
      }
    } catch (error) {
      console.error("Error fetching question set:", error);
      Alert.alert("Error", "Failed to load question set");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    // Validation
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert("Error", "Please enter a valid card number");
      return;
    }
    if (!cardHolder) {
      Alert.alert("Error", "Please enter card holder name");
      return;
    }
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert("Error", "Please enter valid expiry date (MM/YY)");
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert("Error", "Please enter valid CVV");
      return;
    }

    setPaymentLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      setPaymentLoading(false);
      setShowPaymentModal(false);
      Alert.alert(
        "Success!",
        "Payment successful! You can now access this question set.",
        [
          {
            text: "Start Quiz",
            onPress: () => {
              if (selectedSet) {
                startQuestionSetQuiz(selectedSet.id);
              } else if (selectedCategoryForPayment) {
                handleCategorySelect(selectedCategoryForPayment);
              }
            },
          },
        ],
      );
      // Clear form
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
    }, 2000);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      setExpiryDate(cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4));
    } else {
      setExpiryDate(cleaned);
    }
  };

  // ─── Loading screen ───
  if (isLoading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  // ─── Category List ───
  if (!selectedCategory) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={["#7c3aed", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <Text style={styles.gradientLabel}>QUIZ TIME</Text>
          <Text style={styles.gradientTitle}>Choose Category</Text>
          <Text style={styles.gradientSubtitle}>
            Select a category to start your quiz
          </Text>
        </LinearGradient>

        <Modal
          visible={showPaymentModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.paymentModalOverlay}>
            <TouchableOpacity
              style={styles.paymentModalBackdrop}
              activeOpacity={1}
              onPress={() => setShowPaymentModal(false)}
            />

            <View style={styles.paymentModalContent}>
              {/* Header */}
              <View style={styles.paymentHeader}>
                <View style={styles.paymentHeaderTop}>
                  <Text style={styles.paymentTitle}>Complete Payment</Text>
                  <TouchableOpacity
                    onPress={() => setShowPaymentModal(false)}
                    style={styles.paymentCloseBtn}
                  >
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                {selectedSet && (
                  <View style={styles.paymentSetInfo}>
                    <Text style={styles.paymentSetName}>
                      {selectedSet.name}
                    </Text>
                    <View style={styles.paymentPriceRow}>
                      <Text style={styles.paymentPriceLabel}>
                        Total Amount:
                      </Text>
                      <Text style={styles.paymentPriceValue}>
                        ${selectedSet.price.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
                {selectedCategoryForPayment && !selectedSet && (
                  <View style={styles.paymentSetInfo}>
                    <Text style={styles.paymentSetName}>
                      {selectedCategoryForPayment.name}
                    </Text>
                    <View style={styles.paymentPriceRow}>
                      <Text style={styles.paymentPriceLabel}>
                        Total Amount:
                      </Text>
                      <Text style={styles.paymentPriceValue}>
                        ${selectedCategoryForPayment.min_price?.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.paymentFormScroll}
              >
                {/* Payment Methods */}
                <View style={styles.paymentMethods}>
                  <TouchableOpacity style={styles.paymentMethodActive}>
                    <Ionicons name="card-outline" size={24} color="#7c3aed" />
                    <Text style={styles.paymentMethodText}>Credit Card</Text>
                    <View style={styles.paymentMethodCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#7c3aed"
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Card Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Card Number</Text>
                  <View style={styles.formInputContainer}>
                    <Ionicons name="card-outline" size={20} color="#9ca3af" />
                    <TextInput
                      value={cardNumber}
                      onChangeText={formatCardNumber}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="numeric"
                      maxLength={19}
                      style={styles.formInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Card Holder */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Card Holder Name</Text>
                  <View style={styles.formInputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" />
                    <TextInput
                      value={cardHolder}
                      onChangeText={setCardHolder}
                      placeholder="John Doe"
                      autoCapitalize="words"
                      style={styles.formInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Expiry & CVV */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={styles.formLabel}>Expiry Date</Text>
                    <View style={styles.formInputContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#9ca3af"
                      />
                      <TextInput
                        value={expiryDate}
                        onChangeText={formatExpiryDate}
                        placeholder="MM/YY"
                        keyboardType="numeric"
                        maxLength={5}
                        style={styles.formInput}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={styles.formLabel}>CVV</Text>
                    <View style={styles.formInputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#9ca3af"
                      />
                      <TextInput
                        value={cvv}
                        onChangeText={setCvv}
                        placeholder="123"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                        style={styles.formInput}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                </View>

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Ionicons name="shield-checkmark" size={20} color="#059669" />
                  <Text style={styles.securityText}>
                    Your payment information is secure and encrypted
                  </Text>
                </View>

                {/* Pay Button */}
                <TouchableOpacity
                  onPress={handlePayment}
                  disabled={paymentLoading}
                  style={[
                    styles.payButton,
                    { opacity: paymentLoading ? 0.6 : 1 },
                  ]}
                >
                  {paymentLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={20} color="#fff" />
                      <Text style={styles.payButtonText}>
                        Pay $
                        {selectedSet
                          ? selectedSet.price.toFixed(2)
                          : selectedCategoryForPayment?.min_price?.toFixed(2)}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

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
            {categories.map((category) => {
              const icon = category.icon || "help-circle";
              return (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.8}
                  onPress={() => handleCategorySelect(category)}
                  style={styles.categoryCard}
                >
                  <View style={styles.categoryCardRow}>
                    {/* Sets Count Badge */}
                    <View style={styles.categoryCountBadge}>
                      {(category.free_sets_count ?? 0) > 0 && (
                        <Text style={styles.categoryFreeCountText}>
                          {category.free_sets_count} Free
                        </Text>
                      )}
                      {(category.free_sets_count ?? 0) > 0 &&
                        (category.paid_sets_count ?? 0) > 0 && (
                          <Text style={styles.categoryCountDivider}>·</Text>
                        )}
                      {(category.paid_sets_count ?? 0) > 0 && (
                        <Text style={styles.categoryPaidCountText}>
                          {category.paid_sets_count} Paid
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.categoryIconBox,
                        { backgroundColor: category.color + "15" },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={32}
                        color={category.color}
                      />
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <View style={styles.categoryMeta}>
                        <Ionicons
                          name="folder-outline"
                          size={16}
                          color="#6b7280"
                        />
                        <Text style={styles.categoryMetaText}>
                          {category.question_sets_count} question sets
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation(); // ✅ IMPORTANT FIX
                        handleCategoryAction(category);
                      }}
                      style={[
                        styles.categoryStartButton,
                        {
                          backgroundColor: category.has_paid_sets
                            ? "#7c3aed"
                            : category.color + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          category.has_paid_sets
                            ? "cart-outline"
                            : "play-circle-outline"
                        }
                        size={18}
                        color={category.has_paid_sets ? "#fff" : category.color}
                      />
                      <Text
                        style={[
                          styles.categoryStartText,
                          {
                            color: category.has_paid_sets
                              ? "#fff"
                              : category.color,
                          },
                        ]}
                      >
                        {category.has_paid_sets ? "Buy" : "Start"}
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

  // ─── Question Sets View ───
  const categoryIcon = selectedCategory.icon || "help-circle";

  return (
    <View style={styles.container}>
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
          <Text style={styles.backButtonText}>Back to Categories</Text>
        </TouchableOpacity>

        <View style={styles.gradientCategoryRow}>
          <View style={styles.gradientCategoryIcon}>
            <Ionicons name={categoryIcon as any} size={24} color="white" />
          </View>
          <View>
            <Text style={styles.gradientLabel}>CATEGORY</Text>
            <Text style={styles.gradientTitle}>{selectedCategory.name}</Text>
          </View>
        </View>
        <Text style={styles.gradientSubtitle}>
          {questionSets.length} question sets • {totalQuestionsInCategory} total
          questions
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
        {/* Full Category Quiz Card */}
        <View style={styles.fullQuizSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openFullCategoryModal}
            style={[
              styles.fullQuizCard,
              { borderColor: selectedCategory.color },
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
                <Text style={styles.fullQuizTitle}>Full Category Quiz</Text>
                <Text style={styles.fullQuizSubtitle}>
                  Random questions from all sets
                </Text>
              </View>
            </View>

            <View style={styles.fullQuizMeta}>
              <Ionicons name="help-circle-outline" size={16} color="#6b7280" />
              <Text style={styles.fullQuizMetaText}>
                {totalQuestionsInCategory} questions available
              </Text>
            </View>

            <View
              style={[
                styles.fullQuizStartButton,
                { backgroundColor: selectedCategory.color },
              ]}
            >
              <Ionicons name="play-circle" size={20} color="white" />
              <Text style={styles.fullQuizStartText}>Start Full Quiz</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Question Sets */}
        <Text style={styles.sectionTitle}>Question Sets</Text>

        <View>
          {questionSets.map((set) => (
            <View key={set.id} style={styles.setCard}>
              <View style={styles.setCardInner}>
                {/* Price Badge */}
                {set.is_free ? (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                ) : (
                  <View style={styles.priceBadge}>
                    <Ionicons name="cash-outline" size={14} color="#7c3aed" />
                    <Text style={styles.priceText}>
                      ${set.price.toFixed(2)}
                    </Text>
                  </View>
                )}

                <Text style={styles.setName}>{set.name}</Text>
                {set.description && (
                  <Text style={styles.setDesc}>{set.description}</Text>
                )}
                <View style={styles.setMeta}>
                  <Ionicons
                    name="help-circle-outline"
                    size={14}
                    color="#6b7280"
                  />
                  <Text style={styles.setMetaText}>
                    {set.questions_count} questions
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleSetAction(set)}
                  style={[
                    styles.setStartButton,
                    {
                      backgroundColor: set.is_free
                        ? selectedCategory.color + "15"
                        : "#7c3aed",
                    },
                  ]}
                >
                  <Ionicons
                    name={set.is_free ? "play-circle-outline" : "cart-outline"}
                    size={18}
                    color={set.is_free ? selectedCategory.color : "#fff"}
                  />
                  <Text
                    style={[
                      styles.setStartText,
                      { color: set.is_free ? selectedCategory.color : "#fff" },
                    ]}
                  >
                    {set.is_free ? "Start This Set" : "Buy Set"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ─── Question Count Modal ─── */}
      <Modal
        visible={showQuestionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
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
              <Text style={styles.modalTitle}>How many questions?</Text>
              <Text style={styles.modalSubtitle}>
                Max: {totalQuestionsInCategory} questions available
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
                  if (num <= totalQuestionsInCategory)
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
                  if (num < totalQuestionsInCategory)
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
                const isDisabled = num > totalQuestionsInCategory;
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
                            ? "#f3f4f6"
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
                              ? "#9ca3af"
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
                <Text style={styles.modalStartText}>Start Quiz</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQuestionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Payment Modal ─── */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalOverlay}>
          <TouchableOpacity
            style={styles.paymentModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPaymentModal(false)}
          />

          <View style={styles.paymentModalContent}>
            {/* Header */}
            <View style={styles.paymentHeader}>
              <View style={styles.paymentHeaderTop}>
                <Text style={styles.paymentTitle}>Complete Payment</Text>
                <TouchableOpacity
                  onPress={() => setShowPaymentModal(false)}
                  style={styles.paymentCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {selectedSet && (
                <View style={styles.paymentSetInfo}>
                  <Text style={styles.paymentSetName}>{selectedSet.name}</Text>
                  <View style={styles.paymentPriceRow}>
                    <Text style={styles.paymentPriceLabel}>Total Amount:</Text>
                    <Text style={styles.paymentPriceValue}>
                      ${selectedSet.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
              {selectedCategoryForPayment && !selectedSet && (
                <View style={styles.paymentSetInfo}>
                  <Text style={styles.paymentSetName}>
                    {selectedCategoryForPayment.name}
                  </Text>
                  <View style={styles.paymentPriceRow}>
                    <Text style={styles.paymentPriceLabel}>Total Amount:</Text>
                    <Text style={styles.paymentPriceValue}>
                      ${selectedCategoryForPayment.min_price?.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.paymentFormScroll}
            >
              {/* Payment Methods */}
              <View style={styles.paymentMethods}>
                <TouchableOpacity style={styles.paymentMethodActive}>
                  <Ionicons name="card-outline" size={24} color="#7c3aed" />
                  <Text style={styles.paymentMethodText}>Credit Card</Text>
                  <View style={styles.paymentMethodCheck}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#7c3aed"
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Card Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Number</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="card-outline" size={20} color="#9ca3af" />
                  <TextInput
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={19}
                    style={styles.formInput}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Card Holder */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Holder Name</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    value={cardHolder}
                    onChangeText={setCardHolder}
                    placeholder="John Doe"
                    autoCapitalize="words"
                    style={styles.formInput}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Expiry & CVV */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Expiry Date</Text>
                  <View style={styles.formInputContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#9ca3af"
                    />
                    <TextInput
                      value={expiryDate}
                      onChangeText={formatExpiryDate}
                      placeholder="MM/YY"
                      keyboardType="numeric"
                      maxLength={5}
                      style={styles.formInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>CVV</Text>
                  <View style={styles.formInputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9ca3af"
                    />
                    <TextInput
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                      style={styles.formInput}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <Ionicons name="shield-checkmark" size={20} color="#059669" />
                <Text style={styles.securityText}>
                  Your payment information is secure and encrypted
                </Text>
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                onPress={handlePayment}
                disabled={paymentLoading}
                style={[
                  styles.payButton,
                  { opacity: paymentLoading ? 0.6 : 1 },
                ]}
              >
                {paymentLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.payButtonText}>
                      Pay $
                      {selectedSet
                        ? selectedSet.price.toFixed(2)
                        : selectedCategoryForPayment?.min_price?.toFixed(2)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
  gradientTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 4,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  categoryIconBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
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
  setCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  setCardInner: {
    padding: 16,
  },

  // ── NEW: Price Badges ──
  freeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },

  setName: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
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

  // ── NEW: Payment Modal ──
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
    maxHeight: "90%",
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
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  paymentCloseBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSetInfo: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
  },
  paymentSetName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  paymentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentPriceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  paymentPriceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#7c3aed",
  },
  paymentFormScroll: {
    padding: 24,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  paymentMethodActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#7c3aed",
    marginLeft: 12,
  },
  paymentMethodCheck: {
    width: 24,
    height: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  formInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  formInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  formRow: {
    flexDirection: "row",
    marginHorizontal: -8,
  },
  formGroupHalf: {
    flex: 1,
    marginHorizontal: 8,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#065f46",
    marginLeft: 8,
  },
  payButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
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

  categoryPriceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryPriceText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },

  categoryFreeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  categoryFreeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
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
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryFreeCountText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryPaidCountText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryCountDivider: {
    color: "#9ca3af",
    fontSize: 12,
    marginHorizontal: 4,
  },
});
