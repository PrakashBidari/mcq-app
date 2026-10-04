// utils/editorFonts.ts
import * as Font from "expo-font";
import { useEffect, useMemo, useState } from "react";
import { defaultSystemFonts } from "react-native-render-html";

/**
 * Google Fonts offered by the dashboard's CKEditor "Font Family" dropdown
 * (keep in sync with mcq-backend/resources/views/partials/ckeditor.blade.php).
 * They are not bundled: a font file is downloaded (from the fontsource CDN) the
 * first time some HTML content uses it.
 */
const CDN = "https://cdn.jsdelivr.net/fontsource/fonts";

// Font name -> file prefix; the variant suffix ("-400-normal.ttf"...) is added per variant.
export const EDITOR_FONTS: Record<string, string> = {
  Roboto: `${CDN}/roboto@latest/latin`,
  "Open Sans": `${CDN}/open-sans@latest/latin`,
  Lato: `${CDN}/lato@latest/latin`,
  Montserrat: `${CDN}/montserrat@latest/latin`,
  Poppins: `${CDN}/poppins@latest/latin`,
  Nunito: `${CDN}/nunito@latest/latin`,
  Raleway: `${CDN}/raleway@latest/latin`,
  Oswald: `${CDN}/oswald@latest/latin`,
  Merriweather: `${CDN}/merriweather@latest/latin`,
  Lora: `${CDN}/lora@latest/latin`,
  "Playfair Display": `${CDN}/playfair-display@latest/latin`,
  "Dancing Script": `${CDN}/dancing-script@latest/latin`,
  "Noto Sans JP": `${CDN}/noto-sans-jp@latest/japanese`,
  "Noto Serif JP": `${CDN}/noto-serif-jp@latest/japanese`,
};

/*
 * Bold / italic: expo-font registers a downloaded font for the normal style only, and
 * Android then shows bold or italic text in the system font. So each variant is loaded
 * as its own font ("Lato Bold"...) and the HTML is rewritten to use it directly
 * (font-family:'Lato Bold'; font-weight:normal).
 */
type Variant = "Regular" | "Bold" | "Italic" | "Bold Italic";

const VARIANT_FILE: Record<Variant, string> = {
  Regular: "400-normal",
  Bold: "700-normal",
  Italic: "400-italic",
  "Bold Italic": "700-italic",
};

// Not every font has italics: fall back to the closest variant that exists.
const VARIANT_FALLBACKS: Record<Variant, Variant[]> = {
  Regular: ["Regular"],
  Bold: ["Bold", "Regular"],
  Italic: ["Italic", "Regular"],
  "Bold Italic": ["Bold Italic", "Bold", "Italic", "Regular"],
};

const fontName = (family: string, variant: Variant) =>
  variant === "Regular" ? family : `${family} ${variant}`;

// Tags the renderers show bold / italic (user-agent styles + the screens' tagsStyles).
const BOLD_TAGS = new Set(["strong", "b", "h1", "h2", "h3", "h4", "h5", "h6", "th"]);
const ITALIC_TAGS = new Set(["em", "i", "blockquote", "cite"]);
const VOID_TAGS = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

interface Frame {
  tag: string;
  family: string | null; // editor font in effect (null = default / other font)
  bold: boolean;
  italic: boolean;
  written: boolean; // a font-weight:normal / font-style:normal was written here or above
}

const styleValue = (style: string, prop: string) =>
  style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"))?.[1].trim();

const decodeQuotes = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/**
 * Walks the HTML and calls `pick(family, variant)` for text in an editor font. When it
 * returns a loaded font name, the element is rewritten to use it.
 */
function rewriteFonts(html: string, pick: (family: string, variant: Variant) => string | null): string {
  const stack: Frame[] = [{ tag: "", family: null, bold: false, italic: false, written: false }];

  return html.replace(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g, (whole, closing: string, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();

    if (closing) {
      const i = stack.map((f) => f.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      return whole;
    }

    const parent = stack[stack.length - 1];
    const quote = attrs.match(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/i);
    const style = decodeQuotes(quote?.[2] ?? "");

    const familyValue = styleValue(style, "font-family");
    const firstFamily = familyValue?.split(",")[0].trim().replace(/^["']+|["']+$/g, "").trim();
    const family = familyValue ? (firstFamily && EDITOR_FONTS[firstFamily] ? firstFamily : null) : parent.family;

    const weight = styleValue(style, "font-weight")?.toLowerCase();
    const bold = weight
      ? weight === "bold" || weight === "bolder" || parseInt(weight, 10) >= 600
      : BOLD_TAGS.has(tag) || parent.bold;
    const fontStyle = styleValue(style, "font-style")?.toLowerCase();
    const italic = fontStyle ? fontStyle !== "normal" : ITALIC_TAGS.has(tag) || parent.italic;

    const variant: Variant = bold ? (italic ? "Bold Italic" : "Bold") : italic ? "Italic" : "Regular";
    const target = family ? pick(family, variant) : null;
    const useVariantFont = !!target && variant !== "Regular";

    const frame: Frame = { tag, family, bold, italic, written: useVariantFont };
    if (!VOID_TAGS.has(tag) && !attrs.trim().endsWith("/")) stack.push(frame);

    let decls: string | null = null;
    if (useVariantFont) {
      decls = `font-family:'${target}';font-weight:normal;font-style:normal`;
    } else if (parent.written) {
      // Leaving a rewritten bold/italic run: restore this element's own look.
      decls =
        (family ? `font-family:'${family}';` : "") +
        `font-weight:${bold ? "bold" : "normal"};font-style:${italic ? "italic" : "normal"}`;
    }
    if (!decls) return whole;

    if (!quote) {
      const end = whole.endsWith("/>") ? "/>" : ">";
      return `${whole.slice(0, -end.length)} style="${decls}"${end}`;
    }
    const rest = style
      .replace(/(?:^|;)\s*font-(?:family|weight|style)\s*:[^;]*/gi, "")
      .replace(/^[\s;]+|[\s;]+$/g, "")
      .replace(/"/g, "'");
    return whole.replace(quote[0], ` style="${rest ? rest + ";" : ""}${decls}"`);
  });
}

// "family|variant" keys of the editor fonts the HTML uses.
function usedFontVariants(html: string): string[] {
  const found = new Set<string>();
  rewriteFonts(html, (family, variant) => {
    found.add(`${family}|${variant}`);
    return null;
  });
  return Array.from(found).sort();
}

// "family|variant" -> name of the font actually loaded for it (after fallbacks).
const resolved = new Map<string, string>();
const loading = new Map<string, Promise<void>>();

function loadFontFile(family: string, variant: Variant): Promise<void> {
  const name = fontName(family, variant);
  if (Font.isLoaded(name)) return Promise.resolve();
  let p = loading.get(name);
  if (!p) {
    p = Font.loadAsync({ [name]: `${EDITOR_FONTS[family]}-${VARIANT_FILE[variant]}.ttf` }).catch((e) => {
      loading.delete(name); // allow a retry next time (e.g. offline)
      throw e;
    });
    loading.set(name, p);
  }
  return p;
}

async function loadFontVariant(key: string): Promise<void> {
  const [family, variant] = key.split("|") as [string, Variant];
  for (const candidate of VARIANT_FALLBACKS[variant]) {
    try {
      await loadFontFile(family, candidate);
      resolved.set(key, fontName(family, candidate));
      return;
    } catch {
      // try the next closest variant
    }
  }
}

/**
 * Loads the editor fonts used by `html` and returns the HTML to render (bold / italic
 * text switched to the matching font file) plus the `systemFonts` for <RenderHtml>.
 * Until a font is loaded its text shows in the default font.
 */
export function useEditorFonts(html?: string | null): { html: string; systemFonts: string[] } {
  const source = html ?? "";
  const keys = useMemo(() => usedFontVariants(source), [source]);
  const [loadedTick, setLoadedTick] = useState(0);

  useEffect(() => {
    let alive = true;
    for (const key of keys) {
      if (resolved.has(key)) continue;
      loadFontVariant(key).then(() => {
        if (alive && resolved.has(key)) setLoadedTick((n) => n + 1);
      });
    }
    return () => {
      alive = false;
    };
  }, [keys]);

  return useMemo(() => {
    if (!keys.length) return { html: source, systemFonts: defaultSystemFonts };
    const names = new Set<string>();
    for (const key of keys) {
      const name = resolved.get(key);
      if (name) names.add(name);
    }
    return {
      html: rewriteFonts(source, (family, variant) => resolved.get(`${family}|${variant}`) ?? null),
      systemFonts: names.size ? [...defaultSystemFonts, ...names] : defaultSystemFonts,
    };
    // loadedTick: recompute after a font finishes loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, keys, loadedTick]);
}
