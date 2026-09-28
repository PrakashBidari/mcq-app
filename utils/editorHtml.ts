// utils/editorHtml.ts

/**
 * Line heights for dashboard (CKEditor) HTML before it goes to <RenderHtml>.
 *
 * - react-native-render-html only understands line-height in px: unitless values are
 *   dropped and "em" is resolved against a fixed 14px root, not the text's own size.
 * - React Native (Android and iOS) uses ONE line height per paragraph: a line-height
 *   on a <span> ends up spacing every line of its paragraph.
 * - The screens give all text a fixed lineHeight (e.g. 26), so text enlarged with the
 *   editor's Font Size (28px...) gets clipped.
 *
 * So each block (<p>, <li>, heading...) gets a single `line-height:NNpx`: its line
 * height setting (or the renderer's default ratio) times the font size used by most of
 * its text. Line heights on inline elements are removed.
 */
export interface EditorTextMetrics {
  /** baseStyle fontSize of the renderer */
  fontSize: number;
  /** baseStyle lineHeight of the renderer (its ratio is used for resized text) */
  lineHeight: number;
  /** fontSize from tagsStyles (h1, h2...) */
  tagFontSizes?: Record<string, number>;
}

const BLOCK_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "td", "th", "figcaption", "pre", "div",
]);
const VOID_TAGS = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

interface Frame {
  tag: string;
  fontSize: number;
  ratio: number;
  block: Block | null; // innermost block this element is in
}

interface Block {
  tokenIndex: number;
  fontSize: number;
  ratio: number;
  hasOwnRatio: boolean; // line-height set on this block or an enclosing one
  chars: Map<number, number>; // font size -> number of characters
}

const styleValue = (style: string, prop: string) =>
  style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"))?.[1].trim();

// Font size in px, or null when missing / in a unit we can't resolve.
function parseFontSize(value: string | undefined, parent: number): number | null {
  const m = value?.match(/^([\d.]+)\s*(px|em|rem|%)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = (m[2] ?? "px").toLowerCase();
  if (unit === "px") return n;
  if (unit === "%") return (parent * n) / 100;
  return parent * n;
}

// Line height as a multiple of the font size.
function parseLineRatio(value: string | undefined, fontSize: number): number | null {
  const m = value?.match(/^([\d.]+)\s*(px|em|%)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!(n > 0)) return null;
  const unit = m[2]?.toLowerCase();
  if (unit === "px") return n / fontSize;
  if (unit === "%") return n / 100;
  return n;
}

const STYLE_ATTR = /\sstyle\s*=\s*(["'])([\s\S]*?)\1/i;

const withoutLineHeight = (style: string) =>
  style.replace(/(?:^|;)\s*line-height\s*:[^;]*/gi, "").replace(/^[\s;]+|[\s;]+$/g, "");

// Rewrites the style attribute of an opening tag (null = only remove line-height).
function setTagLineHeight(tag: string, px: number | null): string {
  const quote = tag.match(STYLE_ATTR);
  const rest = withoutLineHeight(quote?.[2] ?? "");
  const style = [rest, px !== null ? `line-height:${px}px` : ""].filter(Boolean).join(";");
  if (quote) return tag.replace(quote[0], style ? ` style=${quote[1]}${style}${quote[1]}` : "");
  if (!style) return tag;
  const end = tag.endsWith("/>") ? "/>" : ">";
  return `${tag.slice(0, -end.length)} style="${style}"${end}`;
}

const textLength = (text: string) => text.replace(/&[#\w]+;/g, "_").replace(/\s+/g, " ").trim().length;

export function normalizeEditorLineHeights(html: string, metrics: EditorTextMetrics): string {
  if (!/font-size|line-height/i.test(html)) return html;

  const defaultRatio = metrics.lineHeight / metrics.fontSize;
  const tokens = html.split(/(<[^>]*>)/);
  const blocks: Block[] = [];
  const inlineWithLineHeight: number[] = [];
  const stack: Frame[] = [{ tag: "", fontSize: metrics.fontSize, ratio: defaultRatio, block: null }];

  tokens.forEach((token, index) => {
    const tagMatch = token.match(/^<(\/?)([a-zA-Z][\w-]*)([^>]*)>$/);
    const top = stack[stack.length - 1];

    if (!tagMatch) {
      // Text: count it toward the font size it is shown in.
      const len = token.startsWith("<") ? 0 : textLength(token);
      if (len && top.block) top.block.chars.set(top.fontSize, (top.block.chars.get(top.fontSize) ?? 0) + len);
      return;
    }

    const [, closing, rawTag, attrs] = tagMatch;
    const tag = rawTag.toLowerCase();
    if (closing) {
      const i = stack.map((f) => f.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      return;
    }

    const style = attrs.match(STYLE_ATTR)?.[2] ?? "";
    const fontSize =
      parseFontSize(styleValue(style, "font-size"), top.fontSize) ?? metrics.tagFontSizes?.[tag] ?? top.fontSize;
    const lineValue = styleValue(style, "line-height");
    const ownRatio = parseLineRatio(lineValue, fontSize);
    const ratio = ownRatio ?? top.ratio;

    let block = top.block;
    if (BLOCK_TAGS.has(tag)) {
      block = {
        tokenIndex: index,
        fontSize,
        ratio,
        hasOwnRatio: ownRatio !== null || !!top.block?.hasOwnRatio,
        chars: new Map(),
      };
      blocks.push(block);
    } else if (lineValue) {
      inlineWithLineHeight.push(index);
    }

    if (!VOID_TAGS.has(tag) && !attrs.trim().endsWith("/")) stack.push({ tag, fontSize, ratio, block });
  });

  for (const index of inlineWithLineHeight) tokens[index] = setTagLineHeight(tokens[index], null);

  for (const block of blocks) {
    // Font size of most of the block's text.
    let mainSize = block.fontSize;
    let most = 0;
    block.chars.forEach((count, size) => {
      if (count > most) {
        most = count;
        mainSize = size;
      }
    });
    // Blocks with default spacing and size keep the renderer's styles.
    if (!block.hasOwnRatio && mainSize === block.fontSize) continue;
    tokens[block.tokenIndex] = setTagLineHeight(tokens[block.tokenIndex], Math.round(mainSize * block.ratio));
  }

  return tokens.join("");
}
