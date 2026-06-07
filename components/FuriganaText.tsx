// components/FuriganaText.tsx
import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

/**
 * FuriganaText Component
 * Renders Japanese text with furigana (reading) above kanji.
 *
 * Syntax: {漢字|ふりがな}
 * Example: {社会福祉|しゃかいふくし}の理念を{発展|はってん}させた
 */

interface FuriganaTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  furiganaStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

interface TextSegment {
  type: "plain" | "furigana";
  text: string;
  reading?: string;
}

function parseText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\{([^|{}]+)\|([^|{}]+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "plain",
        text: text.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: "furigana", text: match[1], reading: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "plain", text: text.slice(lastIndex) });
  }

  return segments;
}

export function hasFurigana(text: string): boolean {
  return /\{[^|{}]+\|[^|{}]+\}/.test(text);
}

export default function FuriganaText({
  text,
  style,
  furiganaStyle,
  containerStyle,
}: FuriganaTextProps) {
  // No furigana markup → plain Text
  if (!hasFurigana(text)) {
    return <Text style={style}>{text}</Text>;
  }

  const segments = parseText(text);

  return (
    // ── Key fix: use View (not Text) so flexDirection/alignItems work on Android ──
    <View style={[styles.container, containerStyle]}>
      {segments.map((seg, idx) => {
        if (seg.type === "plain") {
          return (
            // alignSelf: "flex-end" makes plain text bottom-align with kanji in ruby blocks
            <Text key={idx} style={[style, styles.plainText]}>
              {seg.text}
            </Text>
          );
        }

        // Ruby (furigana) block
        return (
          <View key={idx} style={styles.rubyBlock}>
            {/* Furigana reading — small text above kanji */}
            <Text style={[styles.furigana, furiganaStyle]} numberOfLines={1}>
              {seg.reading}
            </Text>
            {/* Kanji text */}
            <Text style={style}>{seg.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", // lay segments left to right
    flexWrap: "wrap", // wrap to next line when needed
    alignItems: "flex-end", // align bottoms: plain text aligns with kanji bottom
  },
  plainText: {
    alignSelf: "flex-end", // extra safety: stick to bottom of row
  },
  rubyBlock: {
    alignItems: "center", // center furigana over kanji
    marginHorizontal: 0.5,
  },
  furigana: {
    fontSize: 9,
    color: "#6b7280",
    lineHeight: 11,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
