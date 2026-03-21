// app/(tabs)/bookmark.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function BookmarkScreen() {
  const [activeTab, setActiveTab] = useState<
    "all" | "books" | "notes" | "quizzes"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - Full data for all sections
  const bookmarkedBooks = [
    {
      id: "1",
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      category: "Computer Science",
      progress: 65,
      coverColor: "#7c3aed",
      bookmarkedAt: "2 days ago",
    },
    {
      id: "2",
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Programming",
      progress: 40,
      coverColor: "#2563eb",
      bookmarkedAt: "1 week ago",
    },
    {
      id: "3",
      title: "Design Patterns",
      author: "Gang of Four",
      category: "Software Engineering",
      progress: 80,
      coverColor: "#059669",
      bookmarkedAt: "3 days ago",
    },
    {
      id: "4",
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      category: "Programming",
      progress: 55,
      coverColor: "#dc2626",
      bookmarkedAt: "5 days ago",
    },
    {
      id: "5",
      title: "You Don't Know JS",
      author: "Kyle Simpson",
      category: "JavaScript",
      progress: 90,
      coverColor: "#f59e0b",
      bookmarkedAt: "1 day ago",
    },
  ];

  const bookmarkedNotes = [
    {
      id: "1",
      title: "Binary Search Trees",
      subject: "Data Structures",
      date: "Feb 8, 2026",
      preview:
        "A binary search tree is a node-based binary tree data structure which has the following properties: left subtree contains only nodes with keys lesser than the node's key...",
      color: "#7c3aed",
    },
    {
      id: "2",
      title: "React Hooks Best Practices",
      subject: "Web Development",
      date: "Feb 7, 2026",
      preview:
        "Understanding useEffect dependencies and optimization techniques. Always include all values from component scope that change over time...",
      color: "#2563eb",
    },
    {
      id: "3",
      title: "Big O Notation",
      subject: "Algorithms",
      date: "Feb 6, 2026",
      preview:
        "Big O notation is used to classify algorithms according to how their run time or space requirements grow as the input size grows...",
      color: "#059669",
    },
    {
      id: "4",
      title: "SQL vs NoSQL",
      subject: "Databases",
      date: "Feb 5, 2026",
      preview:
        "SQL databases are relational, NoSQL databases are non-relational. SQL databases use structured query language and have predefined schema...",
      color: "#dc2626",
    },
    {
      id: "5",
      title: "REST API Principles",
      subject: "Backend Development",
      date: "Feb 4, 2026",
      preview:
        "REST stands for Representational State Transfer. It's an architectural style that defines a set of constraints to be used for creating web services...",
      color: "#f59e0b",
    },
    {
      id: "6",
      title: "CSS Grid vs Flexbox",
      subject: "Frontend Development",
      date: "Feb 3, 2026",
      preview:
        "Flexbox is designed for one-dimensional layouts (row or column), while Grid is designed for two-dimensional layouts (rows and columns)...",
      color: "#8b5cf6",
    },
  ];

  const bookmarkedQuizzes = [
    {
      id: "1",
      title: "JavaScript Fundamentals",
      questions: 25,
      duration: "30 min",
      difficulty: "Medium",
      score: 85,
      color: "#f59e0b",
    },
    {
      id: "2",
      title: "Data Structures Quiz",
      questions: 40,
      duration: "45 min",
      difficulty: "Hard",
      score: null,
      color: "#dc2626",
    },
    {
      id: "3",
      title: "React Advanced Concepts",
      questions: 30,
      duration: "35 min",
      difficulty: "Hard",
      score: 92,
      color: "#2563eb",
    },
    {
      id: "4",
      title: "Python Basics",
      questions: 20,
      duration: "25 min",
      difficulty: "Easy",
      score: 78,
      color: "#059669",
    },
    {
      id: "5",
      title: "Database Design",
      questions: 35,
      duration: "40 min",
      difficulty: "Medium",
      score: null,
      color: "#7c3aed",
    },
  ];

  const tabs = [
    {
      id: "all",
      label: "All",
      count:
        bookmarkedBooks.length +
        bookmarkedNotes.length +
        bookmarkedQuizzes.length,
    },
    { id: "books", label: "Books", count: bookmarkedBooks.length },
    { id: "notes", label: "Notes", count: bookmarkedNotes.length },
    { id: "quizzes", label: "Quizzes", count: bookmarkedQuizzes.length },
  ];

  const renderBookCard = (book: any, index: number) => (
    <View key={`${activeTab}-book-${book.id}`} className="mb-3">
      <TouchableOpacity
        className="bg-white rounded-xl overflow-hidden flex-row p-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        activeOpacity={0.9}
      >
        {/* Book Cover */}
        <View
          className="w-16 h-20 rounded-lg items-center justify-center"
          style={{ backgroundColor: book.coverColor }}
        >
          <Ionicons name="book" size={24} color="#fff" />
        </View>

        {/* Book Info */}
        <View className="flex-1 ml-3 justify-between">
          <View>
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {book.title}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">{book.author}</Text>
          </View>

          {/* Progress */}
          <View className="mt-2">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs text-gray-400">
                {book.progress}% complete
              </Text>
              <Text className="text-xs text-gray-400">{book.bookmarkedAt}</Text>
            </View>
            <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${book.progress}%`,
                  backgroundColor: book.coverColor,
                }}
              />
            </View>
          </View>
        </View>

        {/* Bookmark Icon */}
        <TouchableOpacity className="ml-2 justify-center">
          <Ionicons name="bookmark" size={20} color={book.coverColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  const renderNoteCard = (note: any, index: number) => (
    <View key={`${activeTab}-note-${note.id}`} className="mb-3">
      <TouchableOpacity
        className="bg-white rounded-xl p-3 border-l-2"
        style={{
          borderLeftColor: note.color,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        activeOpacity={0.9}
      >
        <View className="flex-row justify-between items-start mb-1">
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {note.title}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">{note.subject}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark" size={18} color={note.color} />
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-gray-600 mt-1.5" numberOfLines={2}>
          {note.preview}
        </Text>

        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-400 ml-1">{note.date}</Text>
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Text
              className="text-xs font-semibold mr-1"
              style={{ color: note.color }}
            >
              View
            </Text>
            <Ionicons name="arrow-forward" size={12} color={note.color} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderQuizCard = (quiz: any, index: number) => (
    <View key={`${activeTab}-quiz-${quiz.id}`} className="mb-3">
      <TouchableOpacity
        className="bg-white rounded-xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
        activeOpacity={0.9}
      >
        <View
          className="flex-row items-center p-3"
          style={{ backgroundColor: quiz.color + "15" }}
        >
          <View
            className="w-12 h-12 rounded-lg items-center justify-center"
            style={{ backgroundColor: quiz.color }}
          >
            <Ionicons name="help-circle" size={24} color="#fff" />
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {quiz.title}
            </Text>
            <View className="flex-row items-center mt-1 gap-3">
              <Text className="text-xs text-gray-500">
                {quiz.questions} questions
              </Text>
              <Text className="text-xs text-gray-500">• {quiz.duration}</Text>
            </View>
          </View>

          <TouchableOpacity>
            <Ionicons name="bookmark" size={18} color={quiz.color} />
          </TouchableOpacity>
        </View>

        <View className="px-3 py-2.5 bg-white flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <View
              className={`px-2 py-0.5 rounded-md ${
                quiz.difficulty === "Easy"
                  ? "bg-green-50"
                  : quiz.difficulty === "Medium"
                    ? "bg-yellow-50"
                    : "bg-red-50"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  quiz.difficulty === "Easy"
                    ? "text-green-600"
                    : quiz.difficulty === "Medium"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {quiz.difficulty}
              </Text>
            </View>
            {quiz.score && (
              <View className="flex-row items-center">
                <Ionicons name="trophy" size={14} color="#f59e0b" />
                <Text className="text-xs font-semibold text-gray-700 ml-1">
                  {quiz.score}%
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            className="px-3 py-1 rounded-lg"
            style={{ backgroundColor: quiz.color }}
          >
            <Text className="text-xs font-semibold text-white">
              {quiz.score ? "Retake" : "Start"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (activeTab === "all") {
      return (
        <View key="all-content">
          {bookmarkedBooks.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Books
                </Text>
                <Text className="text-xs text-gray-400">
                  {bookmarkedBooks.length} items
                </Text>
              </View>
              {bookmarkedBooks.map((book, index) =>
                renderBookCard(book, index),
              )}
            </View>
          )}
          {bookmarkedNotes.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Notes
                </Text>
                <Text className="text-xs text-gray-400">
                  {bookmarkedNotes.length} items
                </Text>
              </View>
              {bookmarkedNotes.map((note, index) =>
                renderNoteCard(note, index),
              )}
            </View>
          )}
          {bookmarkedQuizzes.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Quizzes
                </Text>
                <Text className="text-xs text-gray-400">
                  {bookmarkedQuizzes.length} items
                </Text>
              </View>
              {bookmarkedQuizzes.map((quiz, index) =>
                renderQuizCard(quiz, index),
              )}
            </View>
          )}
        </View>
      );
    }

    if (activeTab === "books") {
      return (
        <View key="books-content">
          {bookmarkedBooks.map((book, index) => renderBookCard(book, index))}
        </View>
      );
    }

    if (activeTab === "notes") {
      return (
        <View key="notes-content">
          {bookmarkedNotes.map((note, index) => renderNoteCard(note, index))}
        </View>
      );
    }

    if (activeTab === "quizzes") {
      return (
        <View key="quizzes-content">
          {bookmarkedQuizzes.map((quiz, index) => renderQuizCard(quiz, index))}
        </View>
      );
    }
  };

  const totalBookmarks =
    bookmarkedBooks.length + bookmarkedNotes.length + bookmarkedQuizzes.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-3 pb-4 bg-white">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Bookmarks</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {totalBookmarks} saved {totalBookmarks === 1 ? "item" : "items"}
            </Text>
          </View>
          <TouchableOpacity className="w-9 h-9 bg-purple-50 rounded-full items-center justify-center">
            <Ionicons name="options-outline" size={18} color="#7c3aed" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search bookmarks..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Compact Tabs */}
      <View className="flex-row px-5 py-2 bg-white border-b border-gray-100">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            className={`mr-2 px-3 py-1.5 rounded-lg ${
              activeTab === tab.id ? "bg-purple-600" : "bg-gray-50"
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.id ? "text-white" : "text-gray-600"
                }`}
              >
                {tab.label}
              </Text>
              <View
                className={`ml-1.5 px-1.5 py-0.5 rounded-full min-w-[18px] items-center ${
                  activeTab === tab.id ? "bg-purple-500" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    activeTab === tab.id ? "text-white" : "text-gray-600"
                  }`}
                >
                  {tab.count}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        key={activeTab}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {totalBookmarks === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-purple-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="bookmarks-outline" size={48} color="#c084fc" />
            </View>
            <Text className="text-lg font-bold text-gray-900 mb-1">
              No Bookmarks Yet
            </Text>
            <Text className="text-center text-sm text-gray-500 px-8">
              Start saving your favorite content here for quick access
            </Text>
          </View>
        ) : (
          renderContent()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
