import BookCard from "@/components/BookCard";
import { API_URL } from "@/config/constants";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
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

// ─── Avatar with initials ─────────────────────────────────────────────────────
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
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const letter = (name ?? "U")[0].toUpperCase();
  const bg = getAvatarColor(name ?? "U");
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2.5,
        borderColor: "rgba(255,255,255,0.5)",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "900" }}>
        {letter}
      </Text>
    </View>
  );
}

// ─── Category Chip (circle icon style) ───────────────────────────────────────
const CAT_COLORS: Record<string, string[]> = {
  Design: ["#f472b6", "#ec4899"],
  Development: ["#60a5fa", "#2563eb"],
  Business: ["#34d399", "#059669"],
  Marketing: ["#f87171", "#dc2626"],
  Photography: ["#fb923c", "#ea580c"],
  Music: ["#38bdf8", "#0891b2"],
};

// ─── Book Card ────────────────────────────────────────────────────────────────
// function BookCard({
//   book,
//   index,
//   onPress,
// }: {
//   book: any;
//   index: number;
//   onPress: () => void;
// }) {
//   const diffColor =
//     book.difficulty === "Beginner"
//       ? "#10b981"
//       : book.difficulty === "Advanced"
//         ? "#ef4444"
//         : "#f59e0b";
//   return (
//     <Animatable.View animation="fadeInRight" delay={index * 60} duration={400}>
//       <TouchableOpacity
//         activeOpacity={0.92}
//         onPress={onPress}
//         style={styles.bookCard}
//       >
//         {/* Cover */}
//         <View style={styles.bookImageWrap}>
//           <Image
//             source={{ uri: book.cover }}
//             style={styles.bookImage}
//             resizeMode="cover"
//           />
//           <LinearGradient
//             colors={["transparent", "rgba(10,4,30,0.82)"]}
//             style={StyleSheet.absoluteFillObject}
//           />
//           {/* Top badges */}
//           <View style={styles.ratingBadge}>
//             <Ionicons name="star" size={11} color="#f59e0b" />
//             <Text style={styles.ratingTxt}>
//               {parseFloat(book.rating).toFixed(1)}
//             </Text>
//           </View>
//           {book.difficulty ? (
//             <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
//               <Text style={styles.diffBadgeTxt}>{book.difficulty}</Text>
//             </View>
//           ) : null}
//           {/* Category on image bottom */}
//           <View style={styles.bookCatOnImg}>
//             <Text style={styles.bookCatOnImgTxt}>{book.category}</Text>
//           </View>
//         </View>
//         {/* Info */}
//         <View style={styles.bookInfo}>
//           <Text style={styles.bookTitle} numberOfLines={1}>
//             {book.title}
//           </Text>
//           <View style={styles.bookAuthorRow}>
//             <View style={styles.bookAuthorDot} />
//             <Text style={styles.bookAuthor} numberOfLines={1}>
//               {book.author}
//             </Text>
//           </View>
//           <View style={styles.bookFootRow}>
//             <View style={styles.bookDurationPill}>
//               <Ionicons name="time-outline" size={11} color="#7c3aed" />
//               <Text style={styles.bookDurationTxt}>{book.duration}</Text>
//             </View>
//             <View style={styles.bookStudentsPill}>
//               <Ionicons name="people-outline" size={11} color="#059669" />
//               <Text style={styles.bookStudentsTxt}>{book.students ?? "—"}</Text>
//             </View>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </Animatable.View>
//   );
// }

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
          <Ionicons name={icon} size={26} color="#fff" />
        </LinearGradient>
        <Text style={styles.catLabel} numberOfLines={1}>
          {cat.name}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
}

// ─── Blog Card ────────────────────────────────────────────────────────────────
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
        {/* Left: fixed size image */}
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
          {/* <View style={styles.blogCatBadge}>
            <Text style={styles.blogCatTxt}>{blog.category}</Text>
          </View> */}
        </View>

        {/* Right: body */}
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

// ─── Achievement Card ─────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    fetchAll();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileImage();
    }, []),
  );

  const fetchProfileImage = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.profile_image) {
        setProfileImage(data.data.profile_image);
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
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

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Learner";

  const onRefresh = async () => {
    setRefreshing(true);
    fetchAll();
    await new Promise((r) => setTimeout(r, 900));
    setRefreshing(false);
  };

  const goToBook = (book: any) => {
    router.push({
      pathname: "/book/[id]",
      params: {
        id: String(book.id),
        title: book.title,
        author: book.author,
        cover: book.cover,
        description: book.description ?? "",
        rating: String(book.rating),
        pages: String(book.pages ?? ""),
        duration: book.duration ?? "",
        category: book.category ?? "",
        difficulty: book.difficulty ?? "",
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
      <StatusBar barStyle="light-content" />

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
      >
        {/* ═══ PURPLE HEADER ════════════════════════ */}
        <LinearGradient
          colors={["#6d28d9", "#7c3aed", "#8b5cf6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 18 }]}
        >
          {/* Subtle blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {/* Top row: greeting + avatar */}
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hiTxt}>Hi {displayName},</Text>
              <Text style={styles.subTxt}>Let's Start Learning</Text>
            </View>

            {/* Avatar with profile image or initials */}
            <TouchableOpacity onPress={() => router.push("/profile")}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#d6d1df",
                  }}
                />
              ) : (
                <Avatar name={displayName} size={46} />
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              placeholder="Search for Topics, Courses"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={18} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ═══ WHITE BODY ════════════════════════════ */}
        <View style={styles.body}>
          {/* ── Hero Swiper ──────────────────────── */}
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
                        colors={["rgba(109,40,217,0.18)", "rgba(15,5,40,0.88)"]}
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

          {/* ── Categories ───────────────────────── */}
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
                        params: { categoryId: cat.id, categoryName: cat.name },
                      })
                    }
                  />
                ))}
              </ScrollView>
            )}
          </Animatable.View>

          {/* ── Ad Banner — Study Library ──────────── */}
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
                {/* Decorative blobs */}
                <View style={styles.adBlob1} />
                <View style={styles.adBlob2} />
                {/* Left icon column */}
                <View style={styles.adIconStack}>
                  <View style={styles.adIconTop}>
                    <Ionicons name="book-outline" size={22} color="#7c3aed" />
                  </View>
                  <View style={styles.adIconBottom}>
                    <Ionicons
                      name="library-outline"
                      size={22}
                      color="#059669"
                    />
                  </View>
                </View>
                {/* Text */}
                <View style={{ flex: 1, marginHorizontal: 16 }}>
                  <View style={styles.adTag}>
                    <Text style={styles.adTagTxt}>📖 STUDY LIBRARY</Text>
                  </View>
                  <Text style={styles.adTitle}>
                    Unlock 100+{"\n"}Premium Books
                  </Text>
                  <Text style={styles.adSub}>Design, Dev, Business & more</Text>
                </View>
                {/* CTA */}
                <View style={styles.adCta}>
                  <LinearGradient
                    colors={["#7c3aed", "#6d28d9"]}
                    style={styles.adCtaBtn}
                  >
                    <Text style={styles.adCtaTxt}>Browse</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </LinearGradient>
                </View>
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* ── This Week (Popular Books) ─────────── */}
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

          {/* ── Achievements ─────────────────────── */}
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

          {/* ── Quiz Banner ─────── */}
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
                    colors={["rgba(109,40,217,0.88)", "rgba(124,58,237,0.97)"]}
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
                          size={16}
                          color="#7c3aed"
                        />
                        <Text style={styles.quizBtnTxt}>Start Quiz</Text>
                      </View>
                    </View>
                    <View style={styles.quizIconOuter}>
                      <View style={styles.quizIconInner}>
                        <Ionicons
                          name="help-circle-outline"
                          size={38}
                          color="#fff"
                        />
                      </View>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </View>
            </TouchableOpacity>
          </Animatable.View>

          {/* ── Latest Articles (dynamic) ─────────── */}
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
                        params: { slug: blog.slug, blog: JSON.stringify(blog) },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </Animatable.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 26,
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -50,
  },
  blob2: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 20,
    left: -30,
  },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  hiTxt: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  subTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 3,
  },
  searchBar: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: "#1e0f4e" },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Body ──
  body: { backgroundColor: "#F5F3FF" },

  // ── Swiper ──
  swiperSec: { paddingHorizontal: 20, paddingTop: 26, marginBottom: 8 },
  swiperWrap: { height: 210, borderRadius: 22, overflow: "hidden" },
  slide: { flex: 1 },
  slideGrad: { flex: 1, justifyContent: "flex-end", padding: 20 },
  slideBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  slideBadgeTxt: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  slideTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
    marginBottom: 5,
    letterSpacing: -0.4,
  },
  slideSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 18,
    marginBottom: 16,
  },
  slideBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  slideBtnTxt: { color: "#7c3aed", fontWeight: "900", fontSize: 14 },
  dot: {
    backgroundColor: "rgba(255,255,255,0.35)",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 20,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },

  // ── Sections ──
  sec: { paddingTop: 24, marginBottom: 8 },
  secHdr: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  secTitle: {
    color: "#1e0f4e",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  seeAll: { color: "#f59e0b", fontSize: 16, fontWeight: "800" },

  // ── Book card ──
  bookCard: {
    width: 172,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    elevation: 2,
    marginBottom: 2,
  },
  bookImageWrap: { position: "relative", height: 148 },
  bookImage: { width: "100%", height: "100%" },
  ratingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,4,30,0.68)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  ratingTxt: { color: "#f59e0b", fontSize: 12, fontWeight: "800" },
  diffBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "800" },
  bookCatOnImg: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(124,58,237,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookCatOnImgTxt: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  bookInfo: { padding: 13, paddingTop: 12 },
  bookTitle: {
    color: "#1e0f4e",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 7,
  },
  bookAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  bookAuthorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7c3aed",
  },
  bookAuthor: { color: "#8070a8", fontSize: 14, fontWeight: "600", flex: 1 },
  bookFootRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bookDurationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ede8ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookDurationTxt: { color: "#7c3aed", fontSize: 11, fontWeight: "700" },
  bookStudentsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookStudentsTxt: { color: "#059669", fontSize: 11, fontWeight: "700" },

  // ── Category ──
  catItem: { alignItems: "center", width: 80 },
  catCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  catLabel: {
    color: "#1e0f4ec0",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── Achievements ──
  achieveCard: {
    width: 180,
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ede8ff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 2,
  },
  achieveIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  achieveTitle: {
    color: "#1e0f4e",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
  },
  achieveDesc: { color: "#8070a8", fontSize: 14, marginBottom: 12 },
  achieveBarBg: {
    backgroundColor: "#ede8ff",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  achieveBarFill: { height: "100%", borderRadius: 3 },
  achievePct: { fontSize: 12, fontWeight: "800" },

  // ── Quiz Banner ──
  bannerSec: { paddingHorizontal: 20, paddingTop: 28, marginBottom: 8 },
  quizBanner: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  quizGrad: {
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  qDecor1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -60,
    right: -20,
  },
  qDecor2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    right: 60,
  },
  quizTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  quizTagTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  quizTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  quizSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    lineHeight: 18,
    marginBottom: 18,
  },
  quizBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  quizBtnTxt: { color: "#7c3aed", fontWeight: "900", fontSize: 14 },
  quizIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  quizIconInner: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Blog cards ──
  blogCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#7c3aed3e",
    // shadowColor: "#7c3aed",
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.1,
    // shadowRadius: 14,
    // elevation: 5,
    height: 124,
  },
  blogImgWrap: {
    width: 116,
    height: 124,
    position: "relative",
    flexShrink: 0,
  },
  blogCardImg: {
    width: 116,
    height: 124,
  },
  blogCatBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#7c3aed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  blogCatTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  blogCardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 13,
    paddingRight: 12,
    justifyContent: "space-between",
  },
  blogCardTitle: {
    color: "#1e0f4ed1",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 4,
  },
  blogCardExcerpt: {
    color: "#8070a8",
    fontSize: 14,
    lineHeight: 17,
    flex: 1,
  },
  blogCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  blogMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  blogCardMetaTxt: { color: "#a89ec0", fontSize: 11, fontWeight: "500" },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#c4b8e8",
    marginHorizontal: 1,
  },
  blogArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#ede8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Ad Banner ──
  adSec: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 8 },
  adBanner: {
    backgroundColor: "#fff",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#ede8ff",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  adBlob1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#ede8ff",
    top: -50,
    right: -30,
  },
  adBlob2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#dcfce7",
    bottom: -30,
    left: 60,
  },
  adIconStack: { gap: 8 },
  adIconTop: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ede8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  adIconBottom: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  adTag: {
    backgroundColor: "#f5f3ff",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  adTagTxt: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  adTitle: {
    color: "#1e0f4e",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  adSub: { color: "#8070a8", fontSize: 14, fontWeight: "600" },
  adCta: { marginLeft: 4 },
  adCtaBtn: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  adCtaTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },

  // ── Empty ──
  emptyBox: { alignItems: "center", paddingVertical: 30 },
  emptyTxt: { color: "#8070a8", fontSize: 16, fontWeight: "600", marginTop: 8 },
});
