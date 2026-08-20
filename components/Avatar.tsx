// components/Avatar.tsx
// Shared avatar: shows the user's uploaded profile image when present,
// otherwise a colored initial. Used anywhere the app shows the user's avatar
// (AppHeader, Home tab, SettingsSidebar) so they all stay in sync.
import React from "react";
import { Image, Text, View } from "react-native";

const AVATAR_COLORS = ["#7c3aed", "#2563eb", "#059669", "#ef4444", "#ea580c", "#0891b2"];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}

type Props = {
  name?: string | null;
  imageUri?: string | null;
  size?: number;
  borderColor?: string;
};

export default function Avatar({ name, imageUri, size = 36, borderColor = "rgba(255,255,255,0.5)" }: Props) {
  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor,
        }}
      />
    );
  }

  const letter = (name ?? "U")[0]?.toUpperCase() ?? "U";
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
        borderColor,
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.38, fontWeight: "900" }}>
        {letter}
      </Text>
    </View>
  );
}
