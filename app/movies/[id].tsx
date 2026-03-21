import { fetchMovies } from "@/services/api";
import useFetch from "@/services/useFetch";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MovieDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
  } = useFetch(() => fetchMovies({ query: "" }));

  const { id } = useLocalSearchParams<{ id: string }>();

  const movie = movies?.find((m) => String(m.id) === String(id));

  // Animated header opacity based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Share movie function
  const handleShare = async () => {
    if (!movie) return;

    try {
      await Share.share({
        message: `🎬 ${movie.title || movie.original_title}\n\n⭐ Rating: ${movie.vote_average?.toFixed(1)}/10\n📅 Released: ${movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}\n\n${movie.overview || "No overview available"}\n\n🔗 https://www.themoviedb.org/movie/${movie.id}`,
        title: movie.title || movie.original_title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Open TMDB page
  const openTMDBPage = () => {
    if (!movie) return;
    Linking.openURL(`https://www.themoviedb.org/movie/${movie.id}`);
  };

  // Search on Google
  const searchOnGoogle = () => {
    if (!movie) return;
    const query = encodeURIComponent(
      `${movie.title || movie.original_title} movie`,
    );
    Linking.openURL(`https://www.google.com/search?q=${query}`);
  };

  // Search on YouTube for trailer
  const searchTrailer = () => {
    if (!movie) return;
    const query = encodeURIComponent(
      `${movie.title || movie.original_title} official trailer`,
    );
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  // Copy movie title
  const copyTitle = async () => {
    if (!movie) return;
    await Clipboard.setStringAsync(movie.title || movie.original_title || "");
    Alert.alert("Copied!", "Movie title copied to clipboard");
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you can add logic to save to AsyncStorage or your backend
  };

  // Calculate rating percentage
  const getRatingPercentage = () => {
    if (!movie?.vote_average) return 0;
    return (movie.vote_average / 10) * 100;
  };

  // Get rating color based on score
  const getRatingColor = () => {
    const rating = movie?.vote_average || 0;
    if (rating >= 7) return "#10B981"; // Green
    if (rating >= 5) return "#FBBF24"; // Yellow
    return "#EF4444"; // Red
  };

  // 🔄 Loading state
  if (moviesLoading) {
    return (
      <View
        className="bg-primary flex-1 justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#E50914" />
        <Text className="text-gray-400 mt-4">Loading movie details...</Text>
      </View>
    );
  }

  // ❌ Error state
  if (moviesError) {
    return (
      <View
        className="bg-primary flex-1 justify-center items-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle-outline" size={64} color="#E50914" />
        <Text className="text-white text-lg mt-4 text-center">
          Error loading movie details
        </Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Please try again later
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-red-600 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 🚫 Movie not found
  if (!movie) {
    return (
      <View
        className="bg-primary flex-1 justify-center items-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <StatusBar barStyle="light-content" />
        <Ionicons name="film-outline" size={64} color="#666" />
        <Text className="text-white text-lg mt-4">Movie not found</Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          This movie doesn't exist or has been removed
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-gray-700 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ Movie display
  return (
    <View className="bg-primary flex-1" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {/* Animated Header with back button and actions */}
      <Animated.View
        className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4 py-3 z-20"
        style={{
          paddingTop: insets.top,
          backgroundColor: headerOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(26, 26, 26, 0)", "rgba(26, 26, 26, 0.95)"],
          }),
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-black/50 p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Animated.Text
          className="text-white text-lg font-bold flex-1 mx-4"
          numberOfLines={1}
          style={{ opacity: headerOpacity }}
        >
          {movie.title || movie.original_title}
        </Animated.Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={toggleFavorite}
            className="bg-black/50 p-2 rounded-full"
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#E50914" : "white"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="bg-black/50 p-2 rounded-full"
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Poster with Gradient Overlay */}
        <View className="relative">
          <Image
            source={{
              uri: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Image",
            }}
            style={{ width: "100%", height: 500 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(26, 26, 26, 0.8)", "#1a1a1a"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />

          {/* Rating badge on poster - moved to bottom left */}
          {movie.vote_average && (
            <View className="absolute bottom-20 left-4 bg-black/80 px-4 py-2 rounded-full flex-row items-center">
              <Ionicons name="star" size={18} color="#FBBF24" />
              <Text className="text-white font-bold ml-2 text-base">
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-5 -mt-20">
          {/* Title with copy button */}
          <View className="flex-row items-start justify-between">
            <Text className="text-white text-3xl font-bold leading-tight flex-1 pr-2">
              {movie.title || movie.original_title}
            </Text>
            <TouchableOpacity
              onPress={copyTitle}
              className="bg-gray-800 p-2 rounded-full mt-1"
            >
              <Ionicons name="copy-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Original title if different */}
          {movie.original_title && movie.title !== movie.original_title && (
            <Text className="text-gray-400 text-sm mt-2 italic">
              Original: {movie.original_title}
            </Text>
          )}

          {/* Meta Info */}
          <View className="flex-row items-center mt-3 flex-wrap gap-3">
            {movie.release_date && (
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">
                  {new Date(movie.release_date).getFullYear()}
                </Text>
              </View>
            )}

            {movie.vote_average && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text className="text-gray-400 text-sm ml-1">
                  {movie.vote_average.toFixed(1)}/10
                </Text>
              </View>
            )}

            {movie.vote_count && (
              <Text className="text-gray-500 text-xs">
                ({movie.vote_count.toLocaleString()} votes)
              </Text>
            )}
          </View>

          {/* Circular Rating Progress */}
          {movie.vote_average && (
            <View className="mt-6 items-center">
              <View className="relative">
                <View
                  className="rounded-full border-4"
                  style={{
                    width: 120,
                    height: 120,
                    borderColor: "#2d2d2d",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    className="absolute rounded-full border-4"
                    style={{
                      width: 120,
                      height: 120,
                      borderColor: getRatingColor(),
                      borderTopColor: "transparent",
                      borderRightColor: "transparent",
                      transform: [
                        { rotate: `${getRatingPercentage() * 3.6}deg` },
                      ],
                    }}
                  />
                  <View className="items-center">
                    <Text className="text-white text-3xl font-bold">
                      {Math.round(getRatingPercentage())}%
                    </Text>
                    <Text className="text-gray-400 text-xs">User Score</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Genres */}
          {movie.genre_ids && movie.genre_ids.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-6">
              {movie.genre_ids.map((genreId: number, index: number) => (
                <View
                  key={index}
                  className="bg-gray-800 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-gray-300 text-xs">
                    {getGenreName(genreId)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick Action Buttons */}
          <View className="flex-row flex-wrap gap-3 mt-6">
            <TouchableOpacity
              onPress={searchTrailer}
              className="flex-1 min-w-[45%] bg-red-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="play-circle-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Watch Trailer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openTMDBPage}
              className="flex-1 min-w-[45%] bg-blue-600 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="white"
              />
              <Text className="text-white font-semibold ml-2">TMDB Page</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={searchOnGoogle}
              className="flex-1 min-w-[45%] bg-gray-700 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Ionicons name="search-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Google It</Text>
            </TouchableOpacity>
          </View>

          {/* Popularity & Language */}
          <View className="flex-row items-center gap-4 mt-6">
            {movie.popularity && (
              <View className="flex-row items-center flex-1 bg-gray-800/50 px-3 py-2 rounded-lg">
                <Ionicons name="trending-up" size={18} color="#9CA3AF" />
                <Text className="text-gray-300 text-sm ml-2">
                  Popularity: {Math.round(movie.popularity)}
                </Text>
              </View>
            )}

            {movie.original_language && (
              <View className="bg-gray-800 px-4 py-2 rounded-lg">
                <Text className="text-gray-300 text-sm font-semibold uppercase">
                  {movie.original_language}
                </Text>
              </View>
            )}
          </View>

          {/* Overview */}
          <View className="mt-6">
            <Text className="text-white text-xl font-bold mb-3">Overview</Text>
            <Text
              className="text-gray-300 text-base leading-6"
              numberOfLines={showFullOverview ? undefined : 5}
            >
              {movie.overview || "No overview available for this movie."}
            </Text>
            {movie.overview && movie.overview.length > 200 && (
              <TouchableOpacity
                onPress={() => setShowFullOverview(!showFullOverview)}
                className="mt-2"
              >
                <Text className="text-red-500 font-semibold">
                  {showFullOverview ? "Show Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Additional Info */}
          {movie.adult !== undefined && (
            <View className="mt-6 bg-gray-800/50 p-4 rounded-lg">
              <View className="flex-row items-center">
                <Ionicons
                  name={movie.adult ? "warning" : "checkmark-circle"}
                  size={22}
                  color={movie.adult ? "#EF4444" : "#10B981"}
                />
                <Text className="text-gray-300 ml-3 text-base font-medium">
                  {movie.adult ? "Adult Content (18+)" : "Family Friendly"}
                </Text>
              </View>
            </View>
          )}

          {/* Movie Stats */}
          <View className="mt-6 bg-gradient-to-br from-gray-800/40 to-gray-900/40 p-5 rounded-xl border border-gray-700/50">
            <Text className="text-white text-xl font-bold mb-4">
              Movie Statistics
            </Text>
            <View className="space-y-3">
              {movie.release_date && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-700/50">
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={18} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-2">Release Date</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    {new Date(movie.release_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              )}
              {movie.vote_average && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-700/50">
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={18} color="#FBBF24" />
                    <Text className="text-gray-400 ml-2">Average Rating</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    {movie.vote_average.toFixed(1)}/10
                  </Text>
                </View>
              )}
              {movie.vote_count && (
                <View className="flex-row justify-between items-center py-3 border-b border-gray-700/50">
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={18} color="#9CA3AF" />
                    <Text className="text-gray-400 ml-2">Total Votes</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    {movie.vote_count.toLocaleString()}
                  </Text>
                </View>
              )}
              {movie.popularity && (
                <View className="flex-row justify-between items-center py-3">
                  <View className="flex-row items-center">
                    <Ionicons name="flame" size={18} color="#EF4444" />
                    <Text className="text-gray-400 ml-2">Popularity Score</Text>
                  </View>
                  <Text className="text-white font-semibold">
                    {Math.round(movie.popularity)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Backdrop Image */}
          {movie.backdrop_path && (
            <View className="mt-6">
              <Text className="text-white text-xl font-bold mb-3">
                Backdrop Image
              </Text>
              <TouchableOpacity activeOpacity={0.9}>
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`,
                  }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Spacing */}
          <View className="h-10" />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// Helper function to map genre IDs to names
function getGenreName(id: number): string {
  const genres: Record<number, string> = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
  };
  return genres[id] || "Unknown";
}
