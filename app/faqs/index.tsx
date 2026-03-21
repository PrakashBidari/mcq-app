// app/faqs/index.tsx
// import BottomTabBar from "@/components/BottomTabBar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// FAQ categories
const faqCategories = [
  { id: "all", name: "All", icon: "apps-outline" },
  { id: "general", name: "General", icon: "information-circle-outline" },
  { id: "account", name: "Account", icon: "person-outline" },
  { id: "courses", name: "Courses", icon: "book-outline" },
  { id: "quiz", name: "Quiz", icon: "help-circle-outline" },
  { id: "payment", name: "Payment", icon: "card-outline" },
  { id: "technical", name: "Technical", icon: "settings-outline" },
];

// FAQ data
const faqData = [
  {
    id: 1,
    category: "general",
    question: "What is this learning platform about?",
    answer:
      "This is a comprehensive learning platform that combines courses, interactive quizzes, and educational content. You can learn at your own pace, test your knowledge with MCQ quizzes, and track your progress through achievements and statistics.",
  },
  {
    id: 2,
    category: "general",
    question: "How do I get started?",
    answer:
      "Simply browse our course catalog, select a course that interests you, and start learning! You can also take quizzes to test your knowledge in various categories. Create an account to track your progress and earn achievements.",
  },
  {
    id: 3,
    category: "account",
    question: "How do I create an account?",
    answer:
      "You can create an account by tapping the 'Sign Up' button on the login screen. Fill in your details including name, email, and password. You'll receive a verification email to activate your account.",
  },
  {
    id: 4,
    category: "account",
    question: "I forgot my password. What should I do?",
    answer:
      "On the login screen, tap 'Forgot Password'. Enter your registered email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
  },
  {
    id: 5,
    category: "account",
    question: "Can I change my email address?",
    answer:
      "Yes! Go to Settings → Account Settings → Email. Enter your new email address and verify it through the confirmation email we'll send you.",
  },
  {
    id: 6,
    category: "account",
    question: "How do I delete my account?",
    answer:
      "Go to Settings → Account Settings → Delete Account. Note that this action is permanent and will remove all your progress, achievements, and data. We'll send a confirmation email before proceeding.",
  },
  {
    id: 7,
    category: "courses",
    question: "How many courses can I take at once?",
    answer:
      "You can enroll in unlimited courses! However, we recommend focusing on 2-3 courses at a time for better learning outcomes and completion rates.",
  },
  {
    id: 8,
    category: "courses",
    question: "Can I download courses for offline viewing?",
    answer:
      "Yes! Premium users can download course materials for offline access. Simply tap the download icon on any course lesson. Downloaded content is available for 30 days.",
  },
  {
    id: 9,
    category: "courses",
    question: "Do I get a certificate after completing a course?",
    answer:
      "Yes! Upon completing all lessons and passing the final assessment with 70% or higher, you'll receive a digital certificate. You can download and share it on LinkedIn or other platforms.",
  },
  {
    id: 10,
    category: "courses",
    question: "How long do I have access to a course?",
    answer:
      "Once enrolled, you have lifetime access to the course content. You can revisit lessons anytime, even after completion.",
  },
  {
    id: 11,
    category: "quiz",
    question: "How do quizzes work?",
    answer:
      "Quizzes are multiple-choice questions that test your knowledge. Select a category, choose the number of questions, and start the quiz. You'll see your score and detailed explanations after completing it.",
  },
  {
    id: 12,
    category: "quiz",
    question: "Can I retake a quiz?",
    answer:
      "Absolutely! You can retake any quiz as many times as you want. Each attempt helps reinforce your learning and improve your score.",
  },
  {
    id: 13,
    category: "quiz",
    question: "What happens if I close the app during a quiz?",
    answer:
      "Your progress is automatically saved. When you return, you can choose to continue from where you left off or start a new quiz.",
  },
  {
    id: 14,
    category: "quiz",
    question: "How is my quiz score calculated?",
    answer:
      "Your score is calculated as (Correct Answers / Total Questions) × 100. You'll also see a grade (A+, A, B, C, F) based on your percentage score.",
  },
  {
    id: 15,
    category: "payment",
    question: "Is there a free trial?",
    answer:
      "Yes! All new users get a 7-day free trial of our Premium plan. No credit card required. Cancel anytime during the trial period.",
  },
  {
    id: 16,
    category: "payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various regional payment methods. All transactions are secure and encrypted.",
  },
  {
    id: 17,
    category: "payment",
    question: "Can I get a refund?",
    answer:
      "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your subscription, contact support within 30 days of purchase for a full refund.",
  },
  {
    id: 18,
    category: "payment",
    question: "How do I cancel my subscription?",
    answer:
      "Go to Settings → Subscription → Cancel Subscription. Your access will continue until the end of your billing period. You can resubscribe anytime.",
  },
  {
    id: 19,
    category: "technical",
    question: "What devices are supported?",
    answer:
      "Our app works on iOS (iPhone, iPad) and Android smartphones and tablets. You can also access your account on our web platform from any browser.",
  },
  {
    id: 20,
    category: "technical",
    question: "The app is running slowly. What should I do?",
    answer:
      "Try these steps: 1) Close and restart the app, 2) Clear app cache in Settings, 3) Ensure you have the latest app version, 4) Check your internet connection. If issues persist, contact support.",
  },
  {
    id: 21,
    category: "technical",
    question: "I'm having trouble logging in.",
    answer:
      "First, verify you're using the correct email and password. Try resetting your password. Ensure you have a stable internet connection. If you recently changed your password, use the new one.",
  },
  {
    id: 22,
    category: "technical",
    question: "How do I update the app?",
    answer:
      "Go to the App Store (iOS) or Google Play Store (Android), search for our app, and tap 'Update' if available. We recommend enabling automatic updates in your device settings.",
  },
  {
    id: 23,
    category: "general",
    question: "Can I track my learning progress?",
    answer:
      "Yes! Your profile shows detailed statistics including courses completed, hours learned, quiz scores, and achievements earned. You can also view your learning streak and progress charts.",
  },
  {
    id: 24,
    category: "general",
    question: "How do achievements work?",
    answer:
      "Achievements are badges you earn by completing specific milestones like finishing courses, maintaining learning streaks, or scoring high in quizzes. Check your profile to see all available achievements and your progress.",
  },
];

export default function FAQsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Filter FAQs based on search and category
  const filteredFaqs = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">FAQs</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search questions..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-base text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 8, // Reduced from 12 to 8
          gap: 8,
        }}
        style={{ maxHeight: 50 }} // Add this to constrain height
      >
        {faqCategories.map((category) => {
          const count =
            category.id === "all"
              ? faqData.length
              : faqData.filter((faq) => faq.category === category.id).length;

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              className={`flex-row items-center px-4 py-1.5 rounded-xl ${
                // Changed py-2 to py-1.5
                selectedCategory === category.id
                  ? "bg-purple-600"
                  : "bg-gray-50"
              }`}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={18}
                color={selectedCategory === category.id ? "#fff" : "#6b7280"}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  selectedCategory === category.id
                    ? "text-white"
                    : "text-gray-600"
                }`}
              >
                {category.name}
              </Text>
              <View
                className={`ml-2 px-2 py-0.5 rounded-full min-w-[20px] items-center ${
                  selectedCategory === category.id
                    ? "bg-purple-500"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAQ List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-500 text-sm mb-4">
          {filteredFaqs.length} question{filteredFaqs.length !== 1 ? "s" : ""}{" "}
          found
        </Text>

        {filteredFaqs.length > 0 ? (
          <View className="gap-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;

              return (
                <TouchableOpacity
                  key={faq.id}
                  activeOpacity={0.8}
                  onPress={() => toggleFaq(faq.id)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-gray-900 font-bold text-base leading-5">
                          {faq.question}
                        </Text>
                      </View>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          isExpanded ? "bg-purple-50" : "bg-gray-50"
                        }`}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={isExpanded ? "#7c3aed" : "#9ca3af"}
                        />
                      </View>
                    </View>

                    {isExpanded && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <Text className="text-gray-700 text-sm leading-6">
                          {faq.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="help-circle-outline" size={40} color="#9ca3af" />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2">
              No questions found
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Try adjusting your search or filters
            </Text>
          </View>
        )}

        {/* Still have questions section */}
        <View className="mt-8 bg-purple-50 rounded-2xl p-6 border border-purple-100">
          <View className="items-center">
            <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubble-ellipses" size={32} color="#7c3aed" />
            </View>
            <Text className="text-gray-900 font-bold text-lg mb-2 text-center">
              Still have questions?
            </Text>
            <Text className="text-gray-600 text-sm text-center mb-4">
              Can not find the answer you are looking for? Our support team is
              here to help.
            </Text>
            <TouchableOpacity className="bg-purple-600 px-6 py-3 rounded-xl flex-row items-center">
              <Ionicons name="mail" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* <BottomTabBar /> */}
    </SafeAreaView>
  );
}
