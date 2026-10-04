// components/ParagraphContent.tsx
import FuriganaText from "@/components/FuriganaText";
import QuizImage from "@/components/QuizImage";
import { API_URL } from "@/config/constants";
import { useEditorFonts } from "@/utils/editorFonts";
import { normalizeEditorLineHeights } from "@/utils/editorHtml";
import React, { useMemo, useState } from "react";
import { Linking, StyleProp, TextStyle, View } from "react-native";
import RenderHtml, {
  CustomBlockRenderer,
  HTMLContentModel,
  MixedStyleDeclaration,
  defaultHTMLElementModels,
} from "react-native-render-html";
import { WebView } from "react-native-webview";

/**
 * Body of a reading paragraph. The dashboard saves paragraphs with CKEditor, so the
 * content is HTML (headings, lists, tables, images, embedded videos). Older paragraphs
 * are plain text and keep rendering through FuriganaText.
 */
interface ParagraphContentProps {
  content?: string | null;
  style?: StyleProp<TextStyle>;
  furiganaStyle?: StyleProp<TextStyle>;
}

// Backend origin: editor images live there, and YouTube needs a real Referer.
const SITE_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*?>/i.test(s);

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const absoluteUrl = (src?: string) => {
  if (!src) return undefined;
  const url = decodeEntities(src.trim());
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return SITE_ORIGIN + url;
  return url;
};

// Watch/share links -> player URL that can be shown in an iframe.
function toEmbedUrl(raw: string): string {
  const url = decodeEntities(raw.trim());
  const yt = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const dm = url.match(/dailymotion\.com\/(?:embed\/)?video\/([a-z0-9]+)/i);
  if (dm) return `https://www.dailymotion.com/embed/video/${dm[1]}`;
  return url;
}

// CKEditor saves videos as <figure class="media"> holding either an <oembed url>
// or a preview <div data-oembed-url><div padding-hack><iframe></div></div>.
// Both become a plain <iframe>, which the renderer below sizes itself.
function normalizeMedia(html: string): string {
  return html
    .replace(/<figure[^>]*class="[^"]*\bmedia\b[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi, (whole, inner: string) => {
      const src =
        inner.match(/<iframe[^>]*\ssrc="([^"]+)"/i)?.[1] ??
        inner.match(/data-oembed-url="([^"]+)"/i)?.[1] ??
        inner.match(/<oembed[^>]*\surl="([^"]+)"/i)?.[1];
      return src ? `<iframe src="${toEmbedUrl(src)}"></iframe>` : whole;
    })
    .replace(/<oembed[^>]*\surl="([^"]+)"[^>]*>(?:<\/oembed>)?/gi, (_, src: string) =>
      `<iframe src="${toEmbedUrl(src)}"></iframe>`,
    );
}

// HTML can't show ruby text, so {漢字|かんじ} becomes 漢字（かんじ）.
const inlineFurigana = (html: string) =>
  html.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, "$1（$2）");

const widthPercent = (style?: string) => {
  const m = style?.match(/(?:^|;)\s*width\s*:\s*([\d.]+)%/i);
  const n = m ? parseFloat(m[1]) : NaN;
  return n > 0 && n <= 100 ? n : null;
};

// Uses the same image view as question images (keeps aspect ratio, tap to zoom,
// hides itself if the file is missing). Honours CKEditor's resize (style="width:NN%").
const ImageRenderer: CustomBlockRenderer = ({ tnode }) => {
  const pct = widthPercent(tnode.attributes.style);
  return (
    <QuizImage
      uri={absoluteUrl(tnode.attributes.src)}
      maxHeight={480}
      style={{ width: pct ? `${pct}%` : "100%", alignSelf: "center", marginVertical: 6 }}
    />
  );
};

const videoHtml = (src: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
iframe{border:0;width:100%;height:100%}</style></head><body>
<iframe src="${src.replace(/"/g, "&quot;")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
 allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;

const VideoEmbed = ({ src, width }: { src: string; width: number }) => (
  <View style={{ width, height: Math.round((width * 9) / 16), borderRadius: 12, overflow: "hidden", backgroundColor: "#000", marginVertical: 6 }}>
    <WebView
      // Loaded with our site as base URL so YouTube gets a Referer (otherwise error 153).
      source={{ html: videoHtml(src), baseUrl: SITE_ORIGIN }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction
      scrollEnabled={false}
      setSupportMultipleWindows={false}
      // Links inside the player ("Watch on YouTube") open outside the app.
      onShouldStartLoadWithRequest={(req) => {
        if (req.isTopFrame === false) return true;
        if (req.url === "about:blank" || req.url.startsWith(SITE_ORIGIN)) return true;
        Linking.openURL(req.url).catch(() => {});
        return false;
      }}
    />
  </View>
);

// <iframe> has no content model by default, so render-html would drop it.
const CUSTOM_MODELS = {
  iframe: defaultHTMLElementModels.iframe.extend({ contentModel: HTMLContentModel.block }),
};

const BASE_STYLE: MixedStyleDeclaration = { color: "#374151", fontSize: 15, lineHeight: 26 };

const TAGS_STYLES: Record<string, MixedStyleDeclaration> = {
  p: { marginTop: 0, marginBottom: 12 },
  h1: { fontSize: 20, fontWeight: "800", color: "#1f2937", marginTop: 4, marginBottom: 10 },
  h2: { fontSize: 18, fontWeight: "800", color: "#1f2937", marginTop: 4, marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: "700", color: "#1f2937", marginTop: 4, marginBottom: 8 },
  a: { color: "#7c3aed", textDecorationLine: "underline" },
  ul: { marginTop: 0, marginBottom: 12 },
  ol: { marginTop: 0, marginBottom: 12 },
  li: { marginBottom: 4 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#c4b5fd",
    paddingLeft: 12,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  figure: { marginTop: 4, marginBottom: 12, marginLeft: 0, marginRight: 0, alignSelf: "center" },
  figcaption: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 4 },
  table: { borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  th: { borderWidth: 1, borderColor: "#e5e7eb", padding: 6, fontWeight: "700", backgroundColor: "#f9fafb" },
  td: { borderWidth: 1, borderColor: "#e5e7eb", padding: 6 },
};

const IGNORED_TAGS = ["script", "style"];

const TEXT_METRICS = {
  fontSize: BASE_STYLE.fontSize as number,
  lineHeight: BASE_STYLE.lineHeight as number,
  tagFontSizes: { h1: 20, h2: 18, h3: 16, figcaption: 12 },
};

const ParagraphContent = React.memo(({ content, style, furiganaStyle }: ParagraphContentProps) => {
  const [width, setWidth] = useState(0);
  const text = content ?? "";
  const isHtml = looksLikeHtml(text);

  const html = useMemo(() => (isHtml ? normalizeEditorLineHeights(normalizeMedia(inlineFurigana(text)), TEXT_METRICS) : ""), [isHtml, text]);
  const { html: fontHtml, systemFonts } = useEditorFonts(html);

  const renderers = useMemo(
    () => ({
      img: ImageRenderer,
      iframe: (({ tnode }) => {
        const src = absoluteUrl(tnode.attributes.src);
        return src ? <VideoEmbed src={toEmbedUrl(src)} width={width} /> : null;
      }) as CustomBlockRenderer,
    }),
    [width],
  );

  if (!isHtml) {
    return <FuriganaText text={text} style={style} furiganaStyle={furiganaStyle} />;
  }

  return (
    <View onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}>
      {width > 0 && (
        <RenderHtml
          contentWidth={width}
          // React 19 ignores render-html's defaultProps, so these must be set here or
          // the editor's inline styles (align, size, color, font...) are dropped.
          enableCSSInlineProcessing
          enableUserAgentStyles
          source={{ html: fontHtml }}
          baseStyle={BASE_STYLE}
          tagsStyles={TAGS_STYLES}
          renderers={renderers}
          customHTMLElementModels={CUSTOM_MODELS}
          systemFonts={systemFonts}
          ignoredDomTags={IGNORED_TAGS}
          enableExperimentalMarginCollapsing
        />
      )}
    </View>
  );
});
ParagraphContent.displayName = "ParagraphContent";

export default ParagraphContent;
