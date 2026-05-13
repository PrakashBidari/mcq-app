import BookCard from "@/components/BookCard";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
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
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";

const { width: SW } = Dimensions.get("window");

const AVATAR_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#ef4444",
  "#ea580c",
  "#0891b2",
  "#7c3aed",
];
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

const CAT_COLORS: Record<string, string[]> = {
  Design: ["#f472b6", "#ec4899"],
  Development: ["#60a5fa", "#2563eb"],
  Business: ["#34d399", "#059669"],
  Marketing: ["#f87171", "#dc2626"],
  Photography: ["#fb923c", "#ea580c"],
  Music: ["#38bdf8", "#0891b2"],
};
const CAT_ICONS: Record<string, string> = {
  Design: "color-palette-outline",
  Development: "code-slash-outline",
  Business: "briefcase-outline",
  Marketing: "megaphone-outline",
  Photography: "camera-outline",
  Music: "musical-notes-outline",
};

function CategoryItem({
  cat,
  index,
  onPress,
}: {
  cat: any;
  index: number;
  onPress: () => void;
}) {
  const colors = CAT_COLORS[cat.name] ?? [cat.color ?? "#7c3aed", "#4f46e5"];
  const icon = (CAT_ICONS[cat.name] ?? cat.icon ?? "grid-outline") as any;
  return (
    <Animatable.View animation="fadeInUp" delay={index * 60} duration={400}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.catItem}
      >
        <LinearGradient
          colors={colors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.catCircle}
        >
          <Ionicons name={icon} size={24} color="#fff" />
        </LinearGradient>
        <Text style={styles.catLabel} numberOfLines={1}>
          {cat.name}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
}

function BlogCard({
  blog,
  index,
  onPress,
}: {
  blog: any;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animatable.View animation="fadeInUp" delay={index * 55} duration={400}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.blogCard}
      >
        <View style={styles.blogImgWrap}>
          <Image
            source={{ uri: blog.image }}
            style={styles.blogCardImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(10,4,30,0.6)"]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        <View style={styles.blogCardBody}>
          <Text style={styles.blogCardTitle} numberOfLines={2}>
            {blog.title}
          </Text>
          <Text style={styles.blogCardExcerpt} numberOfLines={2}>
            {blog.excerpt}
          </Text>
          <View style={styles.blogCardMeta}>
            <View style={styles.blogMetaItem}>
              <Ionicons name="time-outline" size={12} color="#a89ec0" />
              <Text style={styles.blogCardMetaTxt}>{blog.readTime}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.blogMetaItem}>
              <Ionicons name="heart-outline" size={12} color="#a89ec0" />
              <Text style={styles.blogCardMetaTxt}>{blog.likes}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={styles.blogArrow}>
                <Ionicons name="arrow-forward" size={13} color="#7c3aed" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );
}

function AchievementCard({ item, index }: { item: any; index: number }) {
  return (
    <Animatable.View animation="fadeInRight" delay={index * 60} duration={400}>
      <View style={[styles.achieveCard, { shadowColor: item.color }]}>
        <View
          style={[
            styles.achieveIconBox,
            { backgroundColor: item.color + "18" },
          ]}
        >
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <Text style={styles.achieveTitle}>{item.title}</Text>
        <Text style={styles.achieveDesc}>{item.description}</Text>
        <View style={styles.achieveBarBg}>
          <View
            style={[
              styles.achieveBarFill,
              {
                width: `${item.progress}%` as any,
                backgroundColor: item.color,
              },
            ]}
          />
        </View>
        <Text style={[styles.achievePct, { color: item.color }]}>
          {item.progress}%
        </Text>
      </View>
    </Animatable.View>
  );
}

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);
  useFocusEffect(
    useCallback(() => {
      fetchProfileImage();
    }, []),
  );

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setShowSearchResults(true);
    setIsSearching(true);
    searchDebounce.current = setTimeout(() => {
      fetchSearchResults(searchQuery.trim());
    }, 400);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery]);

  const fetchSearchResults = async (q: string) => {
    try {
      const res = await fetch(
        `${API_URL}/search/question-sets?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (data.success) setSearchResults(data.data);
    } catch {
    } finally {
      setIsSearching(false);
    }
  };

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

  const fetchAll = () => {
    setLoading(true);
    const p1 = fetch(`${API_URL}/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
    const p2 = fetch(`${API_URL}/books`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAllBooks(d.data);
      })
      .catch(() => {});
    const p3 = fetch(`${API_URL}/blogs`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBlogs(d.data.slice(0, 5));
      })
      .catch(() => {});
    Promise.all([p1, p2, p3]).finally(() => setLoading(false));
  };

  const startQuestionSetQuiz = async (setId: number) => {
    setQuizLoading(true);
    try {
      const res = await fetch(`${API_URL}/question-set/${setId}`);
      const data = await res.json();
      if (data.success && data.data.questions.length > 0) {
        closeSearch();
        router.push({
          pathname: "/quiz/play",
          params: {
            questions: JSON.stringify(data.data.questions),
            total: data.data.questions.length,
          },
        });
      } else Alert.alert("Error", "No questions available");
    } catch {
      Alert.alert("Error", "Failed to load questions");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSearchSetAction = (set: any) => {
    if (set.is_paid) {
      setSelectedSet(set);
      setShowPaymentModal(true);
    } else startQuestionSetQuiz(set.id);
  };

  const handlePayment = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      Alert.alert("Error", "Enter valid card number");
      return;
    }
    if (!cardHolder) {
      Alert.alert("Error", "Enter card holder name");
      return;
    }
    if (!expiryDate || expiryDate.length < 5) {
      Alert.alert("Error", "Enter valid expiry date");
      return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert("Error", "Enter valid CVV");
      return;
    }
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setShowPaymentModal(false);
      Alert.alert("Success!", "Payment successful!", [
        {
          text: "Start Quiz",
          onPress: () => {
            if (selectedSet) startQuestionSetQuiz(selectedSet.id);
          },
        },
      ]);
      setCardNumber("");
      setCardHolder("");
      setExpiryDate("");
      setCvv("");
    }, 2000);
  };

  const formatCardNumber = (text: string) => {
    const c = text.replace(/\s/g, "");
    setCardNumber(c.match(/.{1,4}/g)?.join(" ") || c);
  };
  const formatExpiryDate = (text: string) => {
    const c = text.replace(/\D/g, "");
    setExpiryDate(
      c.length >= 2 ? c.substring(0, 2) + "/" + c.substring(2, 4) : c,
    );
  };

  const closeSearch = () => {
    setShowSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Learner";

  const heroSlides = [
    {
      id: 1,
      title: "Master Your\nSkills Today",
      subtitle: "Learn from world-class instructors",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
      type: "learning",
    },
    {
      id: 2,
      title: "Test Your\nKnowledge",
      subtitle: "Challenge yourself with smart quizzes",
      image:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800",
      type: "quiz",
    },
    {
      id: 3,
      title: "Achieve\nExcellence",
      subtitle: "Get certified and grow your career",
      image:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
      type: "learning",
    },
  ];
  const achievements = [
    {
      id: 1,
      title: "Quick Learner",
      description: "Complete 5 courses",
      progress: 80,
      icon: "rocket-outline",
      color: "#7c3aed",
    },
    {
      id: 2,
      title: "Quiz Master",
      description: "Score 90% in 10 quizzes",
      progress: 60,
      icon: "trophy-outline",
      color: "#f59e0b",
    },
    {
      id: 3,
      title: "Bookworm",
      description: "Read 20 books",
      progress: 45,
      icon: "book-outline",
      color: "#059669",
    },
    {
      id: 4,
      title: "Streak Champion",
      description: "30 day streak",
      progress: 70,
      icon: "flame-outline",
      color: "#ef4444",
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAll();
    await new Promise((r) => setTimeout(r, 900));
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
      <StatusBar barStyle="light-content" />

      {/* ═══ STICKY COMPACT HEADER ════════════ */}
      <LinearGradient
        colors={["#6d28d9", "#7c3aed", "#8b5cf6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hiTxt}>Hi {displayName} 👋</Text>
            <Text style={styles.subTxt}>Let's Start Learning</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImg} />
            ) : (
              <Avatar name={displayName} size={36} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            placeholder="Search question sets..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={closeSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={16} color="#7c3aed" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ═══ CONTENT AREA + SEARCH OVERLAY ═══ */}
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7c3aed"]}
              tintColor="#7c3aed"
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.body}>
            {/* Hero Swiper */}
            <Animatable.View
              animation="fadeIn"
              duration={600}
              style={styles.swiperSec}
            >
              <View style={styles.swiperWrap}>
                <Swiper
                  autoplay
                  autoplayTimeout={4.5}
                  loop
                  showsPagination
                  paginationStyle={{ bottom: 12 }}
                  dotStyle={styles.dot}
                  activeDotStyle={styles.activeDot}
                >
                  {heroSlides.map((slide) => (
                    <View key={slide.id} style={styles.slide}>
                      <ImageBackground
                        source={{ uri: slide.image }}
                        style={{ flex: 1 }}
                        resizeMode="cover"
                      >
                        <LinearGradient
                          colors={[
                            "rgba(109,40,217,0.18)",
                            "rgba(15,5,40,0.88)",
                          ]}
                          style={styles.slideGrad}
                        >
                          <View style={styles.slideBadge}>
                            <Text style={styles.slideBadgeTxt}>
                              {slide.type === "quiz"
                                ? "🎯  QUIZ"
                                : "📚  LEARNING"}
                            </Text>
                          </View>
                          <Text style={styles.slideTitle}>{slide.title}</Text>
                          <Text style={styles.slideSub}>{slide.subtitle}</Text>
                          <TouchableOpacity
                            style={styles.slideBtn}
                            onPress={() =>
                              slide.type === "quiz"
                                ? router.push("/(tabs)/quiz")
                                : router.push("/(tabs)/study")
                            }
                          >
                            <Text style={styles.slideBtnTxt}>
                              {slide.type === "quiz" ? "Start Quiz" : "Explore"}
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={14}
                              color="#7c3aed"
                            />
                          </TouchableOpacity>
                        </LinearGradient>
                      </ImageBackground>
                    </View>
                  ))}
                </Swiper>
              </View>
            </Animatable.View>

            {/* Categories */}
            <Animatable.View
              animation="fadeInUp"
              delay={110}
              duration={500}
              style={styles.sec}
            >
              <View style={styles.secHdr}>
                <Text style={styles.secTitle}>Categories</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/study")}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View
                  style={{
                    height: 100,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color="#7c3aed" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft: 20,
                    paddingRight: 8,
                    gap: 14,
                  }}
                >
                  {categories.map((cat: any, i: number) => (
                    <CategoryItem
                      key={cat.id}
                      cat={cat}
                      index={i}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/study",
                          params: {
                            categoryId: cat.id,
                            categoryName: cat.name,
                          },
                        })
                      }
                    />
                  ))}
                </ScrollView>
              )}
            </Animatable.View>

            {/* Ad Banner */}
            <Animatable.View
              animation="fadeInUp"
              delay={185}
              duration={500}
              style={styles.adSec}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => router.push("/(tabs)/study")}
              >
                <View style={styles.adBanner}>
                  <View style={styles.adBlob1} />
                  <View style={styles.adBlob2} />
                  <View style={styles.adIconStack}>
                    <View style={styles.adIconTop}>
                      <Ionicons name="book-outline" size={20} color="#7c3aed" />
                    </View>
                    <View style={styles.adIconBottom}>
                      <Ionicons
                        name="library-outline"
                        size={20}
                        color="#059669"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 14 }}>
                    <View style={styles.adTag}>
                      <Text style={styles.adTagTxt}>📖 STUDY LIBRARY</Text>
                    </View>
                    <Text style={styles.adTitle}>
                      Unlock 100+{"\n"}Premium Books
                    </Text>
                    <Text style={styles.adSub}>
                      Design, Dev, Business & more
                    </Text>
                  </View>
                  <View style={styles.adCta}>
                    <LinearGradient
                      colors={["#7c3aed", "#6d28d9"]}
                      style={styles.adCtaBtn}
                    >
                      <Text style={styles.adCtaTxt}>Browse</Text>
                      <Ionicons name="arrow-forward" size={12} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            </Animatable.View>

            {/* This Week */}
            <Animatable.View
              animation="fadeInUp"
              delay={80}
              duration={500}
              style={styles.sec}
            >
              <View style={styles.secHdr}>
                <Text style={styles.secTitle}>This week</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/study")}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View
                  style={{
                    height: 180,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color="#7c3aed" />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingLeft: 20,
                    paddingRight: 8,
                    marginBottom: -24,
                    gap: 16,
                  }}
                >
                  {allBooks.slice(0, 8).map((book: any, index: number) => (
                    <View key={book.id || index} style={{ width: 172 }}>
                      <BookCard
                        book={book}
                        index={index}
                        categories={categories}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </Animatable.View>

            {/* Achievements */}
            <Animatable.View
              animation="fadeInUp"
              delay={140}
              duration={500}
              style={styles.sec}
            >
              <View style={styles.secHdr}>
                <Text style={styles.secTitle}>Achievements</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>View all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: 20,
                  paddingRight: 8,
                  gap: 14,
                }}
              >
                {achievements.map((a, i) => (
                  <AchievementCard key={a.id} item={a} index={i} />
                ))}
              </ScrollView>
            </Animatable.View>

            {/* Quiz Banner */}
            <Animatable.View
              animation="fadeInUp"
              delay={170}
              duration={500}
              style={styles.bannerSec}
            >
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => router.push("/(tabs)/quiz")}
              >
                <View style={styles.quizBanner}>
                  <ImageBackground
                    source={{
                      uri: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                    }}
                    style={{ width: "100%" }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={[
                        "rgba(109,40,217,0.88)",
                        "rgba(124,58,237,0.97)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.quizGrad}
                    >
                      <View style={styles.qDecor1} />
                      <View style={styles.qDecor2} />
                      <View style={{ flex: 1, marginRight: 18 }}>
                        <View style={styles.quizTag}>
                          <Text style={styles.quizTagTxt}>🎯 CHALLENGE</Text>
                        </View>
                        <Text style={styles.quizTitle}>
                          Test Your{"\n"}Knowledge
                        </Text>
                        <Text style={styles.quizSub}>
                          Smart MCQ quizzes across all topics
                        </Text>
                        <View style={styles.quizBtn}>
                          <Ionicons
                            name="play-circle"
                            size={15}
                            color="#7c3aed"
                          />
                          <Text style={styles.quizBtnTxt}>Start Quiz</Text>
                        </View>
                      </View>
                      <View style={styles.quizIconOuter}>
                        <View style={styles.quizIconInner}>
                          <Ionicons
                            name="help-circle-outline"
                            size={34}
                            color="#fff"
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            </Animatable.View>

            {/* Latest Articles */}
            <Animatable.View
              animation="fadeInUp"
              delay={200}
              duration={500}
              style={styles.sec}
            >
              <View style={styles.secHdr}>
                <Text style={styles.secTitle}>Latest Articles</Text>
                <TouchableOpacity onPress={() => router.push("/blog")}>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View
                  style={{
                    height: 120,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator color="#7c3aed" />
                </View>
              ) : blogs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color="#c4b8e8"
                  />
                  <Text style={styles.emptyTxt}>No articles yet</Text>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 20, gap: 14 }}>
                  {blogs.map((blog: any, i: number) => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      index={i}
                      onPress={() =>
                        router.push({
                          pathname: "/blog/[slug]",
                          params: {
                            slug: blog.slug,
                            blog: JSON.stringify(blog),
                          },
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </Animatable.View>
          </View>
        </ScrollView>

        {/* ═══ SEARCH OVERLAY — absolute View, NOT Modal ═══
            This is why typing keeps working: the TextInput in the header
            never loses focus because we never open a Modal */}
        {showSearchResults && (
          <>
            <TouchableOpacity
              style={styles.searchBackdrop}
              activeOpacity={1}
              onPress={closeSearch}
            />
            <View style={styles.searchResultsPanel}>
              <View style={styles.searchResultsHeader}>
                <Text style={styles.searchResultsTitle}>
                  {isSearching ? "Searching..." : `"${searchQuery}"`}
                </Text>
                <TouchableOpacity onPress={closeSearch}>
                  <Ionicons name="close" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {isSearching && (
                <View style={styles.searchLoadingBox}>
                  <ActivityIndicator color="#7c3aed" size="small" />
                </View>
              )}
              {!isSearching && searchResults.length === 0 && (
                <View style={styles.searchEmptyBox}>
                  <Ionicons name="search-outline" size={28} color="#c4b8e8" />
                  <Text style={styles.searchEmptyText}>
                    No question sets found
                  </Text>
                </View>
              )}
              {!isSearching && searchResults.length > 0 && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {searchResults.map((set: any, index: number) => (
                    <TouchableOpacity
                      key={set.id}
                      onPress={() => handleSearchSetAction(set)}
                      style={[
                        styles.searchResultItem,
                        index < searchResults.length - 1 &&
                          styles.searchResultBorder,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultIcon}>
                        <Ionicons
                          name="help-circle-outline"
                          size={20}
                          color="#7c3aed"
                        />
                      </View>
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName} numberOfLines={1}>
                          {set.name}
                        </Text>
                        <View style={styles.searchResultMeta}>
                          <Ionicons
                            name="folder-outline"
                            size={11}
                            color="#9ca3af"
                          />
                          <Text style={styles.searchResultCategory}>
                            {set.category}
                          </Text>
                          <Text style={styles.searchResultDot}>·</Text>
                          <Text style={styles.searchResultCategory}>
                            {set.questions_count} Qs
                          </Text>
                        </View>
                      </View>
                      <View style={styles.searchResultRight}>
                        {set.is_paid ? (
                          <>
                            <View style={styles.paidBadge}>
                              <Text style={styles.paidBadgeText}>
                                ${set.price?.toFixed(2)}
                              </Text>
                            </View>
                            <View style={styles.buyBtn}>
                              <Ionicons
                                name="cart-outline"
                                size={13}
                                color="#fff"
                              />
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.freeBadge}>
                              <Text style={styles.freeBadgeText}>FREE</Text>
                            </View>
                            <View style={styles.playBtn}>
                              {quizLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Ionicons name="play" size={13} color="#fff" />
                              )}
                            </View>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        )}
      </View>

      {/* ═══ PAYMENT MODAL ═════════════════════ */}
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
            <View style={styles.paymentHeader}>
              <View style={styles.paymentHeaderTop}>
                <Text style={styles.paymentTitle}>Complete Payment</Text>
                <TouchableOpacity
                  onPress={() => setShowPaymentModal(false)}
                  style={styles.paymentCloseBtn}
                >
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
              {selectedSet && (
                <View style={styles.paymentSetInfo}>
                  <Text style={styles.paymentSetName}>{selectedSet.name}</Text>
                  <View style={styles.paymentPriceRow}>
                    <Text style={styles.paymentPriceLabel}>Total Amount:</Text>
                    <Text style={styles.paymentPriceValue}>
                      ${selectedSet.price?.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.paymentFormScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Number</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="card-outline" size={18} color="#9ca3af" />
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
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Card Holder Name</Text>
                <View style={styles.formInputContainer}>
                  <Ionicons name="person-outline" size={18} color="#9ca3af" />
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
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Expiry Date</Text>
                  <View style={styles.formInputContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
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
                      size={18}
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
              <View style={styles.securityNotice}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
                <Text style={styles.securityText}>
                  Your payment information is secure and encrypted
                </Text>
              </View>
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
                    <Ionicons name="lock-closed" size={18} color="#fff" />
                    <Text style={styles.payButtonText}>
                      Pay ${selectedSet?.price?.toFixed(2)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  searchInput: { flex: 1, marginLeft: 7, fontSize: 13, color: "#1e0f4e" },
  filterBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  body: { backgroundColor: "#F5F3FF" },

  // Search overlay
  searchBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 20,
  },
  searchResultsPanel: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 20,
    overflow: "hidden",
    zIndex: 21,
  },
  searchResultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchResultsTitle: { color: "#374151", fontSize: 13, fontWeight: "600" },
  searchLoadingBox: { paddingVertical: 22, alignItems: "center" },
  searchEmptyBox: { paddingVertical: 22, alignItems: "center", gap: 6 },
  searchEmptyText: { color: "#9ca3af", fontSize: 13 },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchResultBorder: { borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  searchResultIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  searchResultMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  searchResultCategory: { color: "#9ca3af", fontSize: 11 },
  searchResultDot: { color: "#d1d5db", fontSize: 11 },
  searchResultRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  freeBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeBadgeText: { color: "#059669", fontSize: 10, fontWeight: "700" },
  paidBadge: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: { color: "#7c3aed", fontSize: 10, fontWeight: "700" },
  playBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },

  swiperSec: { paddingHorizontal: 18, paddingTop: 20, marginBottom: 6 },
  swiperWrap: { height: 196, borderRadius: 18, overflow: "hidden" },
  slide: { flex: 1 },
  slideGrad: { flex: 1, justifyContent: "flex-end", padding: 16 },
  slideBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  slideBadgeTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  slideTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  slideSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  slideBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },
  slideBtnTxt: { color: "#7c3aed", fontWeight: "900", fontSize: 12 },
  dot: {
    backgroundColor: "rgba(255,255,255,0.35)",
    width: 5,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 16,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  sec: { paddingTop: 20, marginBottom: 6 },
  secHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  secTitle: {
    color: "#1e0f4e",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  seeAll: { color: "#f59e0b", fontSize: 13, fontWeight: "800" },

  catItem: { alignItems: "center", width: 68 },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  catLabel: {
    color: "#1e0f4ec0",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  achieveCard: {
    width: 165,
    height: 168,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#ede8ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 2,
  },
  achieveIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  achieveTitle: {
    color: "#1e0f4e",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  achieveDesc: { color: "#8070a8", fontSize: 11, marginBottom: 9 },
  achieveBarBg: {
    backgroundColor: "#ede8ff",
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  achieveBarFill: { height: "100%", borderRadius: 3 },
  achievePct: { fontSize: 11, fontWeight: "800" },

  bannerSec: { paddingHorizontal: 18, paddingTop: 22, marginBottom: 6 },
  quizBanner: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  quizGrad: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  qDecor1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -52,
    right: -18,
  },
  qDecor2: {
    position: "absolute",
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -22,
    right: 52,
  },
  quizTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  quizTagTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  quizTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  quizSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  quizBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  quizBtnTxt: { color: "#7c3aed", fontWeight: "900", fontSize: 12 },
  quizIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  quizIconInner: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  blogCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#7c3aed3e",
    height: 108,
  },
  blogImgWrap: { width: 100, height: 108, position: "relative", flexShrink: 0 },
  blogCardImg: { width: 100, height: 108 },
  blogCardBody: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 9,
    justifyContent: "space-between",
  },
  blogCardTitle: {
    color: "#1e0f4ed1",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    marginBottom: 2,
  },
  blogCardExcerpt: { color: "#8070a8", fontSize: 11, lineHeight: 15, flex: 1 },
  blogCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  blogMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  blogCardMetaTxt: { color: "#a89ec0", fontSize: 10, fontWeight: "500" },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#c4b8e8",
    marginHorizontal: 1,
  },
  blogArrow: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#ede8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  adSec: { paddingHorizontal: 18, paddingTop: 14, marginBottom: 6 },
  adBanner: {
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#ede8ff",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  adBlob1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ede8ff",
    top: -40,
    right: -22,
  },
  adBlob2: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#dcfce7",
    bottom: -22,
    left: 50,
  },
  adIconStack: { gap: 6 },
  adIconTop: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#ede8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  adIconBottom: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  adTag: {
    backgroundColor: "#f5f3ff",
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 5,
  },
  adTagTxt: {
    color: "#7c3aed",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  adTitle: {
    color: "#1e0f4e",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
    marginBottom: 3,
    letterSpacing: -0.1,
  },
  adSub: { color: "#8070a8", fontSize: 11, fontWeight: "600" },
  adCta: { marginLeft: 3 },
  adCtaBtn: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  adCtaTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },

  emptyBox: { alignItems: "center", paddingVertical: 24 },
  emptyTxt: { color: "#8070a8", fontSize: 13, fontWeight: "600", marginTop: 5 },

  paymentModalOverlay: { flex: 1, justifyContent: "flex-end" },
  paymentModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  paymentModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
  },
  paymentHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
  },
  paymentHeaderTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  paymentTitle: { fontSize: 19, fontWeight: "700", color: "#111827" },
  paymentCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSetInfo: { backgroundColor: "#f9fafb", padding: 11, borderRadius: 11 },
  paymentSetName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 7,
  },
  paymentPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentPriceLabel: { fontSize: 13, color: "#6b7280" },
  paymentPriceValue: { fontSize: 20, fontWeight: "900", color: "#7c3aed" },
  paymentFormScroll: { padding: 22 },
  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  formInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  formInput: { flex: 1, fontSize: 14, color: "#111827", marginLeft: 9 },
  formRow: { flexDirection: "row", marginHorizontal: -6 },
  formGroupHalf: { flex: 1, marginHorizontal: 6 },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    padding: 11,
    borderRadius: 11,
    marginBottom: 18,
  },
  securityText: { flex: 1, fontSize: 11, color: "#065f46", marginLeft: 7 },
  payButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 13,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 7,
  },
});
