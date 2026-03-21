// app/reader/[bookId].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Sample chapters data
const chaptersData = {
  1: {
    title: "Introduction to Design Thinking",
    content: `Chapter 1: Introduction to Design Thinking

Design thinking is a human-centered approach to innovation that draws from the designer's toolkit to integrate the needs of people, the possibilities of technology, and the requirements for business success.

The Fundamentals

At its core, design thinking is about solving problems creatively. It's a methodology used by designers to solve complex problems and find desirable solutions for clients. It revolves around a deep interest to understand the people for whom we're designing products or services.

Key Principles:
- Empathy: Understanding the user's needs
- Collaboration: Working together to find solutions
- Experimentation: Testing and iterating ideas
- Human-centeredness: Keeping people at the center

Design thinking helps us observe and develop empathy with the target user. It enables us to question: question the problem, question the assumptions, and question the implications.

The Five Stages

The design thinking process consists of five phases:
1. Empathize - Research your users' needs
2. Define - State your users' needs and problems
3. Ideate - Challenge assumptions and create ideas
4. Prototype - Start to create solutions
5. Test - Try your solutions out

This is an iterative process, and the insights you gather during one phase often lead you to revisit previous stages.`,
  },
  2: {
    title: "User-Centered Design",
    content: `Chapter 2: User-Centered Design

User-centered design (UCD) is an iterative design process in which designers focus on the users and their needs in each phase of the design process.

Understanding Your Users

The foundation of UCD is a deep understanding of who your users are, what they need, and how they behave. This understanding comes from:

- User research and interviews
- Observational studies
- Surveys and questionnaires
- Usability testing
- Analytics and data analysis

Creating User Personas

User personas are fictional characters that represent the different user types that might use your service, product, or brand. They help you:

1. Understand your users better
2. Make design decisions
3. Communicate about users
4. Build empathy within your team

Best Practices:
- Always involve users in the design process
- Test early and test often
- Iterate based on feedback
- Focus on solving real problems
- Design for accessibility

Remember, you are not your user. What makes sense to you might not make sense to them. Always validate your assumptions through research and testing.`,
  },
  3: {
    title: "Affordances and Signifiers",
    content: `Chapter 3: Affordances and Signifiers

Understanding affordances and signifiers is crucial for creating intuitive and user-friendly designs.

What are Affordances?

An affordance is what a user can do with an object based on the user's capabilities. For example, a button affords pushing, a door handle affords pulling or pushing, and a touchscreen affords touching.

Types of Affordances:
- Physical affordances - What the object physically allows
- Cognitive affordances - What the user thinks they can do
- Sensory affordances - What the user perceives through senses
- Functional affordances - What the object is designed to do

Signifiers Explained

Signifiers are signals that communicate where the action should take place. They tell you what to do and where to do it. For example:

- A "Push" sign on a door
- An underlined link on a webpage
- A highlighted button that invites clicking
- Color changes on hover

The Relationship

Affordances tell you what's possible, while signifiers tell you where and how to do it. Good design uses both effectively:

1. Make affordances perceivable
2. Use clear signifiers
3. Ensure consistency
4. Provide feedback
5. Match user expectations

When affordances and signifiers work together, users can interact with your design naturally and intuitively, without needing instructions.`,
  },
  4: {
    title: "The Psychology of Design",
    content: `Chapter 4: The Psychology of Design

Design psychology examines the relationship between human behavior and design. Understanding how people think, perceive, and interact helps create better user experiences.

Cognitive Load

Cognitive load refers to the amount of mental effort being used in working memory. To create user-friendly designs:

- Minimize unnecessary complexity
- Break information into chunks
- Use progressive disclosure
- Provide clear visual hierarchy
- Reduce decision fatigue

Visual Perception Principles

Gestalt Principles guide how we perceive visual elements:

1. Proximity - Elements close together are perceived as related
2. Similarity - Similar elements are grouped together
3. Continuity - Eyes follow smooth paths
4. Closure - We complete incomplete shapes mentally
5. Figure-Ground - We distinguish objects from backgrounds

Color Psychology

Colors evoke emotional responses and convey meaning:

- Red: Energy, urgency, passion
- Blue: Trust, calm, professionalism
- Green: Growth, health, nature
- Yellow: Optimism, warmth, attention
- Purple: Creativity, luxury, wisdom

Memory and Recognition

Design for recognition rather than recall:
- Use familiar patterns and conventions
- Provide visual cues and landmarks
- Make important actions visible
- Use consistent terminology
- Support both novice and expert users

Understanding these psychological principles allows you to create designs that work with, rather than against, how the human mind processes information.`,
  },
  5: {
    title: "Design Principles",
    content: `Chapter 5: Design Principles

Design principles are fundamental guidelines that help create effective, efficient, and aesthetically pleasing designs.

Core Design Principles

1. Hierarchy
Create a clear visual hierarchy that guides users through your content. Use size, color, contrast, and spacing to show what's most important.

2. Balance
Balance creates stability and structure. It can be:
- Symmetrical - Mirror image on both sides
- Asymmetrical - Different elements with equal weight
- Radial - Elements arranged around a center point

3. Contrast
Contrast creates visual interest and helps distinguish elements. Use contrast in:
- Color
- Size
- Shape
- Texture
- Typography

4. Repetition
Repetition creates consistency and strengthens unity. Repeat:
- Colors from your palette
- Typography styles
- Visual elements
- Spacing patterns

5. Alignment
Everything should be visually connected. Alignment creates:
- Order
- Organization
- Clean appearance
- Professional look

6. Proximity
Group related items together. Proximity:
- Organizes information
- Reduces clutter
- Creates relationships
- Improves readability

7. White Space
Also called negative space, it gives elements room to breathe:
- Improves comprehension
- Creates focus
- Adds elegance
- Increases usability

Applying These Principles

Remember: These principles work together, not in isolation. The best designs thoughtfully combine all these elements to create cohesive, effective solutions.

Practice applying these principles to your work, and over time, they'll become second nature. Great design is not about following rules rigidly, but understanding principles deeply enough to know when and how to apply them.`,
  },
};

export default function Reader() {
  const params = useLocalSearchParams();
  const bookId = params.bookId as string;
  const chapterId = params.chapterId as string;

  const [fontSize, setFontSize] = useState(16);
  const [currentChapter, setCurrentChapter] = useState(parseInt(chapterId));
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);

  const totalChapters = 5;
  const chapter = chaptersData[currentChapter];

  // Update when params change
  useEffect(() => {
    setCurrentChapter(parseInt(chapterId));
    // Scroll to top when chapter changes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, [chapterId]);

  const goToNextChapter = () => {
    if (currentChapter < totalChapters) {
      const nextChapter = currentChapter + 1;
      router.setParams({ chapterId: nextChapter.toString() });
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapter > 1) {
      const prevChapter = currentChapter - 1;
      router.setParams({ chapterId: prevChapter.toString() });
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Reader Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-gray-800 text-sm font-bold">
            Chapter {currentChapter} of {totalChapters}
          </Text>
          <Text className="text-gray-500 text-xs">{chapter?.title}</Text>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setFontSize(Math.max(12, fontSize - 2))}
          >
            <Ionicons name="remove-circle-outline" size={24} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFontSize(Math.min(24, fontSize + 2))}
          >
            <Ionicons name="add-circle-outline" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="px-6 py-3 bg-gray-50">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-600 text-xs font-semibold">
            Reading Progress
          </Text>
          <Text className="text-purple-600 text-xs font-bold">
            {Math.round((currentChapter / totalChapters) * 100)}%
          </Text>
        </View>
        <View className="bg-gray-200 h-1.5 rounded-full overflow-hidden">
          <Animatable.View
            animation="slideInLeft"
            duration={500}
            className="bg-purple-600 h-full rounded-full"
            style={{ width: `${(currentChapter / totalChapters) * 100}%` }}
          />
        </View>
      </View>

      {/* Reading Content */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 bg-amber-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 24,
          paddingBottom: 140 + insets.bottom,
        }}
      >
        <Animatable.View animation="fadeIn" duration={500}>
          {/* Chapter Title */}
          <Text className="text-gray-800 text-2xl font-black mb-6">
            {chapter?.title}
          </Text>

          {/* Chapter Content */}
          <Text className="text-gray-700 leading-8" style={{ fontSize }}>
            {chapter?.content}
          </Text>

          {/* End of Chapter */}
          <View className="mt-12 pt-6 border-t border-gray-300">
            <Text className="text-gray-500 text-center text-sm font-semibold mb-4">
              {currentChapter === totalChapters
                ? "🎉 Book Completed!"
                : "✓ End of Chapter"}
            </Text>

            {currentChapter < totalChapters && (
              <TouchableOpacity
                onPress={goToNextChapter}
                className="bg-purple-600 py-4 rounded-2xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  Continue to Chapter {currentChapter + 1}
                </Text>
              </TouchableOpacity>
            )}

            {currentChapter === totalChapters && (
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-green-600 py-4 rounded-2xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  Back to Book Details
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>
      </ScrollView>

      {/* Navigation Footer */}
      <View
        className="flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-white"
        style={{
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <TouchableOpacity
          className={`px-6 py-3 rounded-xl flex-row items-center ${
            currentChapter === 1 ? "bg-gray-200" : "bg-purple-100"
          }`}
          disabled={currentChapter === 1}
          onPress={goToPreviousChapter}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentChapter === 1 ? "#9CA3AF" : "#667eea"}
          />
          <Text
            className={`font-bold ml-2 ${
              currentChapter === 1 ? "text-gray-400" : "text-purple-600"
            }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* Chapter Indicator */}
        <View className="bg-gray-100 px-4 py-2 rounded-xl">
          <Text className="text-gray-600 font-bold text-sm">
            {currentChapter}/{totalChapters}
          </Text>
        </View>

        <TouchableOpacity
          className={`px-6 py-3 rounded-xl flex-row items-center ${
            currentChapter === totalChapters ? "bg-gray-600" : "bg-purple-600"
          }`}
          disabled={currentChapter === totalChapters}
          onPress={goToNextChapter}
        >
          <Text className="text-white font-bold mr-2">
            {currentChapter === totalChapters ? "Done" : "Next"}
          </Text>
          <Ionicons
            name={
              currentChapter === totalChapters
                ? "checkmark-circle"
                : "chevron-forward"
            }
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
