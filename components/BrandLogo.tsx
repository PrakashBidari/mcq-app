import { images } from "@/constants/images";
import { Image, StyleProp, View, ViewStyle } from "react-native";

// logo.jpeg is 1024x1024 with the logo tile sitting inside a black margin
// (tile spans x 203-820, y 193-787). The image is scaled and shifted so a
// 580px square at the tile's centre fills the frame and the margin is cut off.
const SOURCE_SIZE = 1024;
const CROP_SIZE = 580;
const CROP_CENTER = { x: 511.5, y: 490 };

type Props = {
  size: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandLogo({ size, style }: Props) {
  const scaled = (size * SOURCE_SIZE) / CROP_SIZE;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size * 0.22, overflow: "hidden" },
        style,
      ]}
    >
      <Image
        source={images.logo}
        accessibilityLabel="Ikigai Connect"
        style={{
          position: "absolute",
          width: scaled,
          height: scaled,
          left: size / 2 - (CROP_CENTER.x / SOURCE_SIZE) * scaled,
          top: size / 2 - (CROP_CENTER.y / SOURCE_SIZE) * scaled,
        }}
      />
    </View>
  );
}
