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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-swiper";

export default function Index() {
  // const colors = useColors();
  const { colors } = useTheme();

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

  const categories = [
    {
      id: 1,
      name: "Design",
      icon: "color-palette-outline",
      courses: 24,
      color: "#7c3aed",
    },
    {
      id: 2,
      name: "Development",
      icon: "code-slash-outline",
      courses: 35,
      color: "#2563eb",
    },
    {
      id: 3,
      name: "Business",
      icon: "briefcase-outline",
      courses: 18,
      color: "#059669",
    },
    {
      id: 4,
      name: "Marketing",
      icon: "megaphone-outline",
      courses: 22,
      color: "#dc2626",
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

  const learningStats = [
    {
      id: 1,
      label: "Courses Enrolled",
      value: "12",
      icon: "book-outline",
      change: "+2",
      color: "#7c3aed",
    },
    {
      id: 2,
      label: "Hours Learned",
      value: "148",
      icon: "time-outline",
      change: "+12",
      color: "#2563eb",
    },
    {
      id: 3,
      label: "Quizzes Passed",
      value: "45",
      icon: "checkmark-circle-outline",
      change: "+8",
      color: "#059669",
    },
    {
      id: 4,
      label: "Certificates",
      value: "8",
      icon: "trophy-outline",
      change: "+1",
      color: "#f59e0b",
    },
  ];

  const blogs = [
    {
      id: 1,
      title: "10 Tips for Effective Learning",
      excerpt: "Discover proven strategies to enhance your learning",
      image:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
      author: "Sarah Johnson",
      date: "Feb 10, 2026",
      readTime: "5 min",
      category: "Education",
    },
    {
      id: 2,
      title: "Future of Online Education",
      excerpt: "How technology transforms learning worldwide",
      image:
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400",
      author: "Mike Chen",
      date: "Feb 8, 2026",
      readTime: "7 min",
      category: "Trends",
    },
    {
      id: 3,
      title: "Future of Online Education",
      excerpt: "How technology transforms learning worldwide",
      image:
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400",
      author: "Mike Chen",
      date: "Feb 8, 2026",
      readTime: "7 min",
      category: "Trends",
    },
    {
      id: 4,
      title: "Future of Online Education",
      excerpt: "How technology transforms learning worldwide",
      image:
        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400",
      author: "Mike Chen",
      date: "Feb 8, 2026",
      readTime: "7 min",
      category: "Trends",
    },
  ];

  // Inside the component, get the latest 2 blogs:
  const latestBlogs = blogsData
    .sort(
      (a, b) =>
        new Date(b.publishedDate).getTime() -
        new Date(a.publishedDate).getTime(),
    )
    .slice(0, 4);

  const router = useRouter();

  return (
    <View
      className="flex-1 bg-red-500"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View
          className="bg-white px-6 pt-14 pb-4"
          // style={{ backgroundColor: colors.card }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-gray-500 text-sm font-medium">
                Welcome back
              </Text>
              <Text className="text-gray-900 text-2xl font-bold mt-1">
                Alex Martinez
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity className="relative w-11 h-11 bg-gray-50 rounded-full items-center justify-center">
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#374151"
                />
                <View className="absolute -top-1 -right-1 bg-purple-600 w-5 h-5 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">3</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity className="relative">
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                  className="w-11 h-11 rounded-full"
                />
                <View className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className="bg-gray-50 rounded-xl flex-row items-center px-4 py-3">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search courses, books, quizzes..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-base text-gray-900"
            />
            <TouchableOpacity className="w-9 h-9 bg-purple-600 rounded-lg items-center justify-center">
              <Ionicons name="options-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Carousel - Reduced height */}
        <View style={{ height: 260 }} className="mb-6">
          <Swiper
            autoplay={true}
            autoplayTimeout={5}
            loop={true}
            showsPagination={true}
            paginationStyle={{ bottom: 15 }}
            dotStyle={{
              backgroundColor: "rgba(255,255,255,.3)",
              width: 8,
              height: 8,
              borderRadius: 4,
              marginLeft: 3,
              marginRight: 3,
            }}
            activeDotStyle={{
              backgroundColor: "#fff",
              width: 24,
              height: 8,
              borderRadius: 4,
              marginLeft: 3,
              marginRight: 3,
            }}
          >
            {heroSlides.map((slide) => (
              <View key={slide.id} className="flex-1 px-6">
                <View className="flex-1 rounded-3xl overflow-hidden">
                  <ImageBackground
                    source={{ uri: slide.image }}
                    className="flex-1"
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
                      className="flex-1 justify-end p-6"
                    >
                      <View className="mb-2">
                        <View className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full self-start mb-3">
                          <Text className="text-white text-xs font-semibold">
                            {slide.type === "quiz"
                              ? "🎯 Quiz Mode"
                              : "📚 Learning Path"}
                          </Text>
                        </View>
                        <Text className="text-white text-2xl font-bold mb-2">
                          {slide.title}
                        </Text>
                        <Text className="text-white/90 text-sm mb-4">
                          {slide.subtitle}
                        </Text>
                        <TouchableOpacity
                          className="bg-white py-3 px-5 rounded-xl flex-row items-center self-start"
                          onPress={() => {
                            if (slide.type === "quiz") {
                              router.push("/(tabs)/quiz");
                            } else {
                              router.push("/(tabs)/study");
                            }
                          }}
                        >
                          <Text className="text-purple-600 font-bold text-sm mr-2">
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

        {/* Categories */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Top Categories
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-purple-600 font-semibold text-sm mr-1">
                View All
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {categories.map((category) => (
              <View key={category.id} style={{ width: "48%" }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/category/[id]",
                      params: { id: category.id, name: category.name },
                    })
                  }
                >
                  <LinearGradient
                    colors={[category.color, category.color + "dd"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl p-5"
                    style={{
                      shadowColor: category.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-3">
                      <Ionicons
                        name={category.icon as any}
                        size={24}
                        color="white"
                      />
                    </View>
                    <Text className="font-bold text-white text-base mb-1">
                      {category.name}
                    </Text>
                    <Text className="text-white/80 text-xs">
                      {category.courses} courses
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Courses Slider - Enhanced */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center px-6 mb-0">
            <Text className="text-lg font-bold text-gray-900">
              Popular Courses
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/study")}
            >
              <Text className="text-purple-600 font-semibold text-sm mr-1">
                See All
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 260, marginTop: 16 }}>
            <Swiper
              autoplay={true}
              autoplayTimeout={5}
              loop={true}
              showsPagination={true}
              horizontal={true}
              removeClippedSubviews={false}
              paginationStyle={{
                bottom: -10,
              }}
              dotStyle={{
                backgroundColor: "rgba(0,0,0,.15)",
                width: 8,
                height: 8,
                borderRadius: 4,
                marginLeft: 3,
                marginRight: 3,
              }}
              activeDotStyle={{
                backgroundColor: "#7c3aed",
                width: 8,
                height: 8,
                borderRadius: 4,
                marginLeft: 3,
                marginRight: 3,
              }}
            >
              {Array.from(
                { length: Math.ceil(allBooks.length / 2) },
                (_, i) => (
                  <View key={i} className="flex-row px-6 gap-3 w-full">
                    {allBooks.slice(i * 2, i * 2 + 2).map((book, index) => (
                      <View key={book.id || index} style={{ flex: 1 }}>
                        <BookCard book={book} index={i * 2 + index} />
                      </View>
                    ))}
                  </View>
                ),
              )}
            </Swiper>
          </View>
        </View>

        {/* Achievements Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Your Achievements
            </Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-purple-600 font-semibold text-sm mr-1">
                View All
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 px-6"
          >
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                className="bg-white rounded-2xl p-4 mr-3 border border-gray-100"
                style={{
                  width: 200,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: achievement.color + "15" }}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.color}
                  />
                </View>
                <Text className="text-gray-900 font-bold text-base mb-1">
                  {achievement.title}
                </Text>
                <Text className="text-gray-500 text-xs mb-3">
                  {achievement.description}
                </Text>
                <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${achievement.progress}%`,
                      backgroundColor: achievement.color,
                    }}
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-2">
                  {achievement.progress}% Complete
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quiz CTA Banner */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/quiz")}
          >
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
              }}
              className="rounded-2xl overflow-hidden"
              resizeMode="cover"
            >
              <LinearGradient
                colors={["rgba(124, 58, 237, 0.95)", "rgba(37, 99, 235, 0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <View className="bg-white/20 px-3 py-1 rounded-full self-start mb-2">
                      <Text className="text-white text-xs font-semibold">
                        🎯 TRENDING NOW
                      </Text>
                    </View>
                    <Text className="text-white text-xl font-bold mb-2">
                      Test Your Knowledge
                    </Text>
                    <Text className="text-white/90 text-sm mb-4">
                      Challenge yourself with MCQ quizzes
                    </Text>
                    <View className="bg-white py-2.5 px-5 rounded-xl flex-row items-center self-start">
                      <Ionicons name="play-circle" size={18} color="#7c3aed" />
                      <Text className="text-purple-600 font-bold text-sm ml-2">
                        Start Quiz
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/10 w-16 h-16 rounded-2xl items-center justify-center">
                    <Ionicons
                      name="help-circle-outline"
                      size={40}
                      color="white"
                    />
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Blog Section - 2 Columns */}
        <View className="px-6 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">
              Latest from Blog
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/blog")}
            >
              <Text className="text-purple-600 font-semibold text-sm mr-1">
                See More
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {latestBlogs.map((blog) => (
              <View key={blog.id} style={{ width: "48.5%" }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/blog/${blog.slug}`)}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Image
                    source={{ uri: blog.image }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-purple-50 px-2 py-1 rounded-md">
                        <Text className="text-purple-600 text-xs font-semibold">
                          {blog.category}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-gray-900 font-bold text-sm mb-2"
                      numberOfLines={2}
                    >
                      {blog.title}
                    </Text>
                    <Text
                      className="text-gray-600 text-xs mb-3"
                      numberOfLines={2}
                    >
                      {blog.excerpt}
                    </Text>
                    <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                      <Text className="text-gray-400 text-xs">
                        {blog.readTime}
                      </Text>
                      <Text className="text-gray-400 text-xs">
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
