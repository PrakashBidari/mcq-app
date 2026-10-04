// components/QuizImage.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

/**
 * Optional image on a quiz paragraph / question / answer option.
 * Keeps the image's own aspect ratio (capped by maxHeight) and opens it
 * full-screen on tap so small text in the image stays readable.
 */
interface QuizImageProps {
  uri?: string | null;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
}

const QuizImage = React.memo(({ uri, maxHeight = 240, style }: QuizImageProps) => {
  const [ratio, setRatio] = useState(4 / 3);
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!uri) return;
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w > 0 && h > 0) setRatio(w / h); },
      () => {},
    );
    return () => { alive = false; };
  }, [uri]);

  // Missing / broken image: show nothing rather than an empty grey box.
  if (!uri || failed) return null;

  return (
    <>
      <Pressable onPress={() => setZoomed(true)} style={[styles.wrap, style]}>
        <Image
          source={{ uri }}
          style={{ width: "100%", aspectRatio: ratio, maxHeight }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      </Pressable>

      <Modal visible={zoomed} transparent animationType="fade" onRequestClose={() => setZoomed(false)}>
        <Pressable style={styles.backdrop} onPress={() => setZoomed(false)}>
          <Image source={{ uri }} style={styles.full} resizeMode="contain" />
          <View style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
});
QuizImage.displayName = "QuizImage";

export default QuizImage;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  full: { width: "100%", height: "80%" },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
