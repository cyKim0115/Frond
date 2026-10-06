/**
 * HTML 내보내기 (로드맵 4-4, Typora Export 사양 T·G21) — 보기 화면에 그린 본문(하이라이트·Mermaid 그림·KaTeX 수식 포함)을
 * 복제해 테마 CSS를 인라인한 HTML 파일 하나로 만든다. 셸이 지연 import 한다(시작 번들에 넣지 않는다).
 *
 * - 이미지: `embed`면 문서 폴더의 이미지를 base64 `data:`로 넣어 한 파일로, `link`면 내보낼 파일 기준 상대 경로로 둔다.
 *   원격(http·https) 이미지는 그대로
 * - CSS: 문서 테마 파일들 + 지금 테마 색(`theme-vars`) + 본문 폭. 수식이 있으면 KaTeX CSS와 woff2 글꼴을 넣는다.
 *   D2Coding은 넣지 않는다(1.4 MB) — 설치돼 있으면 쓰고 없으면 Cascadia Code·Consolas로 떨어진다
 * - 앱 안에서만 쓰는 속성(`data-line`·`data-local-path`·묶음 상자 등)은 뺀다. 로컬 `.md` 링크는 원래 `href`(상대 경로) 그대로
 */

import baseCss from "./theme/base.css?inline";
import darkCss from "./theme/dark.css?inline";
import fontsCss from "./theme/fonts.css?inline";
import markdownCss from "./theme/github-markdown.css?inline";
import highlightCss from "./theme/highlight.css?inline";
import koCss from "./theme/ko.css?inline";
import tokensCss from "./theme/tokens.css?inline";
import katexCss from "katex/dist/katex.min.css?inline";
import { CHUNK_CLASS } from "./render";

export type ImageMode = "embed" | "link";

export interface ExportOptions {
  /** 보기 화면 본문 (`.markdown-body`) — 복제해서 쓴다 */
  article: HTMLElement;
  title: string;
  /** `<style id="theme-vars">` 내용 — 지금 테마 색 */
  themeCss: string;
  dark: boolean;
  bodyMaxWidth: number;
  images: ImageMode;
  /** 내보낼 파일이 들어갈 폴더 (상대 경로 기준) */
  outDir: string;
  /** 이미지 파일 바이트 (embed) */
  readImage(path: string): Promise<ArrayBuffer>;
  /** 앱 자산(KaTeX 글꼴) 읽기 — 기본은 fetch */
  fetchAsset?(url: string): Promise<ArrayBuffer>;
}

const INTERNAL_ATTRS = ["data-line", "data-local-path", "data-rendered", "data-mermaid", "data-theme", "data-tex", "loading"];
const ASSET_HOST_RE = /^https?:\/\/asset\.localhost\//i;
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

const escapeHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** asset 프로토콜 URL(`convertFileSrc`) → 파일 절대 경로. 그 밖의 URL이면 null */
export function assetUrlToPath(src: string): string | null {
  if (!ASSET_HOST_RE.test(src)) return null;
  try {
    return decodeURIComponent(new URL(src).pathname.slice(1));
  } catch {
    return null;
  }
}

/** `fromDir`에서 `to`(절대 경로)로 가는 상대 경로 (`/` 구분). 드라이브가 다르면 `file:///` URL */
export function relativePath(fromDir: string, to: string): string {
  const split = (p: string): string[] => p.replace(/\//g, "\\").split("\\").filter((s) => s !== "");
  const a = split(fromDir);
  const b = split(to);
  if (a.length === 0 || b.length === 0 || a[0].toLowerCase() !== b[0].toLowerCase()) {
    return `file:///${b.map(encodeURIComponent).join("/").replace(/^([a-zA-Z])%3A/, "$1:")}`;
  }
  let i = 0;
  while (i < a.length && i < b.length - 1 && a[i].toLowerCase() === b[i].toLowerCase()) i++;
  const up = a.length - i;
  return [...Array<string>(up).fill(".."), ...b.slice(i)].map((s) => (s === ".." ? s : encodeURIComponent(s))).join("/");
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** KaTeX CSS의 글꼴 — woff2만 data URL로 넣고 woff·ttf 대안은 뺀다 */
async function inlineKatexFonts(css: string, fetchAsset: (url: string) => Promise<ArrayBuffer>): Promise<string> {
  const urls = new Map<string, string>();
  for (const m of css.matchAll(/url\(([^)]+\.woff2)\)/g)) urls.set(m[1], "");
  for (const url of urls.keys()) {
    try {
      const clean = url.replace(/^["']|["']$/g, "");
      urls.set(url, `data:font/woff2;base64,${toBase64(await fetchAsset(new URL(clean, location.href).href))}`);
    } catch {
      urls.delete(url);
    }
  }
  return css
    .replace(/,\s*url\([^)]+\.(?:woff|ttf)\)\s*format\(["']?(?:woff|truetype)["']?\)/g, "")
    .replace(/url\(([^)]+\.woff2)\)/g, (all, url: string) => (urls.get(url) ? `url(${urls.get(url)})` : all));
}

/** 내보낼 HTML 문서 전체 */
export async function buildExportHtml(options: ExportOptions): Promise<string> {
  const { article } = options;
  const fetchAsset = options.fetchAsset ?? ((url: string) => fetch(url).then((r) => r.arrayBuffer()));
  const body = article.cloneNode(true) as HTMLElement;
  // 큰 문서의 블록 묶음 상자는 풀어 낸다
  for (const chunk of Array.from(body.querySelectorAll(`:scope > .${CHUNK_CLASS}`))) chunk.replaceWith(...Array.from(chunk.childNodes));
  for (const el of [body, ...Array.from(body.querySelectorAll("*"))]) for (const attr of INTERNAL_ATTRS) el.removeAttribute(attr);

  for (const img of Array.from(body.querySelectorAll("img"))) {
    const path = assetUrlToPath(img.getAttribute("src") ?? "");
    if (!path) continue;
    if (options.images === "link") {
      img.setAttribute("src", relativePath(options.outDir, path));
      continue;
    }
    const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
    try {
      img.setAttribute("src", `data:${MIME[ext] ?? "application/octet-stream"};base64,${toBase64(await options.readImage(path))}`);
    } catch {
      // 못 읽은 이미지는 상대 경로로 남긴다
      img.setAttribute("src", relativePath(options.outDir, path));
    }
  }

  const hasMath = body.querySelector(".katex") !== null;
  const css = [
    markdownCss,
    tokensCss,
    // 번들 글꼴 경로는 내보낸 파일에서 풀리지 않는다 — 설치된 D2Coding(local)만 쓴다
    fontsCss.replace(/,\s*url\([^)]*\)\s*format\(["']?woff2["']?\)/g, ""),
    baseCss,
    koCss,
    highlightCss,
    darkCss,
    options.themeCss,
    hasMath ? await inlineKatexFonts(katexCss, fetchAsset) : "",
    `:root { --body-max-width: ${options.bodyMaxWidth}px; }`,
    "html { background: var(--bgColor-default, #fff); } body { margin: 0; }",
    ".markdown-body { margin: 0 auto; }",
    // D2Coding이 없을 때 떨어지는 Cascadia Code 등의 합자(`-->` → 화살표)가 코드를 바꿔 보이게 하지 않게
    ".markdown-body code, .markdown-body pre, .markdown-body kbd, .markdown-body samp { font-variant-ligatures: none; }",
  ].join("\n");

  return [
    "<!doctype html>",
    `<html lang="ko" data-theme="${options.dark ? "dark" : "light"}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="generator" content="Frond">',
    `<title>${escapeHtml(options.title)}</title>`,
    `<style>\n${css}\n</style>`,
    "</head>",
    "<body>",
    `<article class="markdown-body" lang="ko">\n${body.innerHTML}\n</article>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
