import blogsData from "@/assets/data/blogs.json";
import BookCard from "@/components/BookCard";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-swiper";

// Map category names → icon & accent color
const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  Design: { icon: "color-palette-outline", color: "#7c3aed" },
  Development: { icon: "code-slash-outline", color: "#2563eb" },
  Business: { icon: "briefcase-outline", color: "#059669" },
  Marketing: { icon: "megaphone-outline", color: "#dc2626" },
  Photography: { icon: "camera-outline", color: "#ea580c" },
  Music: { icon: "musical-notes-outline", color: "#0891b2" },
};
const DEFAULT_META = { icon: "grid-outline", color: "#6b7280" };

export default function Index() {
  const { colors } = useTheme();
  const router = useRouter();

  const allBooks = [
    {
      id: 1,
      title: "The Design of Everyday Things",
      author: "Don Norman",
      cover:
        "https://images.unsplash.com/photo-1589998059171-988d887df646?w=400",
      rating: 4.8,
      pages: 368,
      duration: "12h 30m",
      categoryId: 1,
      category: "Design",
      difficulty: "Intermediate",
      students: 12400,
    },
    {
      id: 2,
      title: "Refactoring UI",
      author: "Adam Wathan & Steve Schoger",
      cover: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400",
      rating: 4.9,
      pages: 250,
      duration: "8h 45m",
      categoryId: 1,
      category: "Design",
      difficulty: "Beginner",
      students: 18200,
    },
    {
      id: 3,
      title: "Design Systems Handbook",
      author: "Marco Suarez",
      cover:
        "https://images.unsplash.com/photo-1610465299996-30f240ac2b1c?w=400",
      rating: 4.7,
      pages: 420,
      duration: "15h 20m",
      categoryId: 1,
      category: "Design",
      difficulty: "Advanced",
      students: 9800,
    },
    {
      id: 4,
      title: "Clean Code",
      author: "Robert C. Martin",
      cover:
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400",
      rating: 4.9,
      pages: 464,
      duration: "16h 30m",
      categoryId: 2,
      category: "Development",
      difficulty: "Intermediate",
      students: 25600,
    },
  ];

  // ── Derive unique categories from allBooks, take only 2 ──
  const topCategories = Object.values(
    allBooks.reduce((acc: Record<number, any>, book) => {
      if (!acc[book.categoryId]) {
        acc[book.categoryId] = {
          id: book.categoryId,
          name: book.category,
          count: 1,
          ...(CATEGORY_META[book.category] ?? DEFAULT_META),
        };
      } else {
        acc[book.categoryId].count++;
      }
      return acc;
    }, {}),
  ).slice(0, 2);

  const heroSlides = [
    {
      id: 1,
      title: "Master Your Skills",
      subtitle: "Learn from the best courses",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800",
      type: "learning",
    },
    {
      id: 2,
      title: "Test Your Knowledge",
      subtitle: "Challenge yourself with quizzes",
      image:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800",
      type: "quiz",
    },
    {
      id: 3,
      title: "Achieve Excellence",
      subtitle: "Get certified and grow",
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
      description: "30 days learning streak",
      progress: 70,
      icon: "flame-outline",
      color: "#dc2626",
    },
  ];

  const latestBlogs = blogsData
    .sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() -
        new Date(a.publishedDate).getTime(),
    )
    .slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.flex1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.flex1}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.nameText}>Alex Martinez</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.notifButton}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#374151"
                />
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarWrapper}>
                <View style={styles.avatarImageWrapper}>
                  <Image
                    source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                    style={styles.avatarImage}
                  />
                </View>
                <View style={styles.onlineDot} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search courses, books, quizzes..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="options-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Hero Carousel ─── */}
        <View style={styles.heroCarousel}>
          <Swiper
            autoplay
            autoplayTimeout={5}
            loop
            showsPagination
            paginationStyle={styles.heroPagination}
            dotStyle={styles.heroDot}
            activeDotStyle={styles.heroActiveDot}
          >
            {heroSlides.map((slide) => (
              <View key={slide.id} style={styles.heroSlideWrapper}>
                <View style={styles.heroSlideInner}>
                  <ImageBackground
                    source={{ uri: slide.image }}
                    style={styles.flex1}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
                      style={styles.heroGradient}
                    >
                      <View style={styles.heroContent}>
                        <View style={styles.heroBadge}>
                          <Text style={styles.heroBadgeText}>
                            {slide.type === "quiz"
                              ? "🎯 Quiz Mode"
                              : "📚 Learning Path"}
                          </Text>
                        </View>
                        <Text style={styles.heroTitle}>{slide.title}</Text>
                        <Text style={styles.heroSubtitle}>
                          {slide.subtitle}
                        </Text>
                        <TouchableOpacity
                          style={styles.heroButton}
                          onPress={() =>
                            slide.type === "quiz"
                              ? router.push("/(tabs)/quiz")
                              : router.push("/(tabs)/study")
                          }
                        >
                          <Text style={styles.heroButtonText}>
                            {slide.type === "quiz" ? "Start Now" : "Explore"}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color="#7c3aed"
                          />
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </View>
            ))}
          </Swiper>
        </View>

        {/* ─── Top Categories (2, derived from books) ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/study")}
            >
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            {topCategories.map((cat: any, index: number) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.85}
                style={[
                  styles.categoryCardWrapper,
                  index === 0
                    ? styles.categoryCardLeft
                    : styles.categoryCardRight,
                ]}
                // ── Navigate to study, passing categoryId + name so the list pre-filters ──
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/study",
                    params: { categoryId: cat.id, categoryName: cat.name },
                  })
                }
              >
                <LinearGradient
                  colors={[cat.color, cat.color + "cc"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.categoryCard,
                    {
                      shadowColor: cat.color,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 6,
                    },
                  ]}
                >
                  {/* Top-right arrow pill */}
                  <View style={styles.categoryArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>

                  {/* Icon */}
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name={cat.icon as any} size={28} color="white" />
                  </View>

                  {/* Name + count */}
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>
                    {cat.count} {cat.count === 1 ? "book" : "books"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ─── Popular Courses Slider ─── */}
        <View style={styles.sectionNoHPad}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Courses</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/(tabs)/study")}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View style={styles.coursesSwiper}>
            <Swiper
              autoplay
              autoplayTimeout={5}
              loop
              showsPagination
              horizontal
              removeClippedSubviews={false}
              paginationStyle={styles.coursesPagination}
              dotStyle={styles.coursesDot}
              activeDotStyle={styles.coursesActiveDot}
            >
              {Array.from(
                { length: Math.ceil(allBooks.length / 2) },
                (_, i) => (
                  <View key={i} style={styles.coursesSlide}>
                    {allBooks.slice(i * 2, i * 2 + 2).map((book, idx) => (
                      <View key={book.id || idx} style={styles.flex1}>
                        <BookCard book={book} index={i * 2 + idx} />
                      </View>
                    ))}
                  </View>
                ),
              )}
            </Swiper>
          </View>
        </View>

        {/* ─── Achievements ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Achievements</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsScroll}
            contentContainerStyle={styles.achievementsScrollContent}
          >
            {achievements.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.achievementCard,
                  {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: a.color + "15" },
                  ]}
                >
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text style={styles.achievementTitle}>{a.title}</Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${a.progress}%` as any,
                        backgroundColor: a.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>{a.progress}% Complete</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ─── Quiz CTA ─── */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/quiz")}
          >
            <View style={styles.quizBannerWrapper}>
              <ImageBackground
                source={{
                  uri: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                }}
                style={styles.quizBannerBg}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={["rgba(124,58,237,0.95)", "rgba(37,99,235,0.95)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quizGradient}
                >
                  <View style={styles.quizContent}>
                    <View style={styles.quizTextBlock}>
                      <View style={styles.quizBadge}>
                        <Text style={styles.quizBadgeText}>
                          🎯 TRENDING NOW
                        </Text>
                      </View>
                      <Text style={styles.quizTitle}>Test Your Knowledge</Text>
                      <Text style={styles.quizSubtitle}>
                        Challenge yourself with MCQ quizzes
                      </Text>
                      <TouchableOpacity style={styles.quizButton}>
                        <Ionicons
                          name="play-circle"
                          size={18}
                          color="#7c3aed"
                        />
                        <Text style={styles.quizButtonText}>Start Quiz</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.quizIconBox}>
                      <Ionicons
                        name="help-circle-outline"
                        size={40}
                        color="white"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Blog ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest from Blog</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push("/blog")}
            >
              <Text style={styles.seeAllText}>See More</Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid2col}>
            {latestBlogs.map((blog, index) => (
              <View
                key={blog.id}
                style={[
                  styles.grid2colItem,
                  index % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight,
                  index < latestBlogs.length - 2 ? styles.gridItemBottom : null,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/blog/${blog.slug}`)}
                  style={[
                    styles.blogCard,
                    {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    },
                  ]}
                >
                  <View style={styles.blogImageWrapper}>
                    <Image
                      source={{ uri: blog.image }}
                      style={styles.blogImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.blogBody}>
                    <View style={styles.blogCategoryBadge}>
                      <Text style={styles.blogCategoryText}>
                        {blog.category}
                      </Text>
                    </View>
                    <Text style={styles.blogTitle} numberOfLines={2}>
                      {blog.title}
                    </Text>
                    <Text style={styles.blogExcerpt} numberOfLines={2}>
                      {blog.excerpt}
                    </Text>
                    <View style={styles.blogMeta}>
                      <Text style={styles.blogMetaText}>{blog.readTime}</Text>
                      <Text style={styles.blogMetaText}>
                        {blog.publishedDate}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const GRID_GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeText: { color: "#6b7280", fontSize: 14, fontWeight: "500" },
  nameText: { color: "#111827", fontSize: 24, fontWeight: "700", marginTop: 4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  notifButton: {
    width: 44,
    height: 44,
    backgroundColor: "#f9fafb",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#7c3aed",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: { color: "#ffffff", fontSize: 11, fontWeight: "700" },
  avatarWrapper: { position: "relative" },
  avatarImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatarImage: { width: 44, height: 44 },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#22c55e",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  searchBar: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: "#111827" },
  searchButton: {
    width: 36,
    height: 36,
    backgroundColor: "#7c3aed",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  heroCarousel: { height: 260, marginBottom: 24 },
  heroSlideWrapper: { flex: 1, paddingHorizontal: 24 },
  heroSlideInner: { flex: 1, borderRadius: 24, overflow: "hidden" },
  heroGradient: { flex: 1, justifyContent: "flex-end", padding: 24 },
  heroContent: { marginBottom: 8 },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  heroBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  heroTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 16,
  },
  heroButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  heroButtonText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 14,
    marginRight: 8,
  },
  heroPagination: { bottom: 15 },
  heroDot: {
    backgroundColor: "rgba(255,255,255,.3)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  heroActiveDot: {
    backgroundColor: "#fff",
    width: 24,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },

  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionNoHPad: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  seeAllButton: { flexDirection: "row", alignItems: "center" },
  seeAllText: {
    color: "#7c3aed",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 4,
  },

  // ── 2 dynamic category cards ──
  categoryRow: { flexDirection: "row" },
  categoryCardWrapper: { flex: 1 },
  categoryCardLeft: { marginRight: GRID_GAP / 2 },
  categoryCardRight: { marginLeft: GRID_GAP / 2 },
  categoryCard: { borderRadius: 20, padding: 20, minHeight: 148 },
  categoryArrow: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  categoryName: {
    fontWeight: "700",
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 4,
  },
  categoryCount: { color: "rgba(255,255,255,0.75)", fontSize: 12 },

  coursesSwiper: { height: 260 },
  coursesSlide: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    width: "100%",
  },
  coursesPagination: { bottom: -10 },
  coursesDot: {
    backgroundColor: "rgba(0,0,0,.15)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },
  coursesActiveDot: {
    backgroundColor: "#7c3aed",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
  },

  achievementsScroll: { marginHorizontal: -24 },
  achievementsScrollContent: { paddingHorizontal: 24 },
  achievementCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    width: 200,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  achievementTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  achievementDesc: { color: "#6b7280", fontSize: 12, marginBottom: 12 },
  progressBar: {
    backgroundColor: "#f3f4f6",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { color: "#9ca3af", fontSize: 12, marginTop: 8 },

  quizBannerWrapper: { borderRadius: 16, overflow: "hidden" },
  quizBannerBg: { width: "100%" },
  quizGradient: { padding: 24 },
  quizContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quizTextBlock: { flex: 1, marginRight: 16 },
  quizBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  quizBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  quizTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  quizSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginBottom: 16,
  },
  quizButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  quizButtonText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 8,
  },
  quizIconBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  grid2col: { flexDirection: "row", flexWrap: "wrap" },
  grid2colItem: { width: "50%" },
  gridItemLeft: { paddingRight: GRID_GAP / 2 },
  gridItemRight: { paddingLeft: GRID_GAP / 2 },
  gridItemBottom: { marginBottom: GRID_GAP },

  blogCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  blogImageWrapper: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  blogImage: { width: "100%", height: 128 },
  blogBody: { padding: 12 },
  blogCategoryBadge: {
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  blogCategoryText: { color: "#7c3aed", fontSize: 12, fontWeight: "600" },
  blogTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 8,
  },
  blogExcerpt: {
    color: "#4b5563",
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  blogMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f9fafb",
  },
  blogMetaText: { color: "#9ca3af", fontSize: 12 },
});
