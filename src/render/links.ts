/**
 * 링크·이미지 정책 (brief W10·R4·G15, 스펙 §47·§152·§153).
 * - `validateLink` 대체: 허용 목록 방식 — `http:`·`https:`·`mailto:`·`#앵커`·스킴 없는 상대 경로·`C:\` 절대 경로,
 *   그리고 `.md`/`.markdown` 문서를 가리키는 `file:` URL만. `javascript:`·`data:`·`vbscript:`·그 외 `file:`은 전부 거부
 *   → markdown-it이 링크로 만들지 않고 글자 그대로 둔다
 * - 렌더 전 토큰 재작성: http(s) 링크는 `target="_blank" rel="noopener"`, 상대 `.md`·드라이브 절대 `.md`·`file:` `.md` 링크는
 *   `data-local-path`(앱 내 열기, `href`는 남겨 셸의 `a[href]` 클릭 처리·링크 스타일을 받는다),
 *   상대 이미지는 문서 폴더 기준 절대 경로 → `toAssetUrl`. 그 외 스킴의 이미지는 `src`를 뗀다
 */

import type { Token } from "markdown-it";
import { decodePercent, isAbsoluteWindowsPath, resolvePath } from "./paths";

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const HTTP_RE = /^https?:/i;
const FILE_RE = /^file:/i;
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);
/** `.md`/`.markdown`로 끝나는 경로 + 선택적 `#조각`·`?쿼리` */
const LOCAL_DOC_RE = /^(.*?\.(?:md|markdown))(?:[?#].*)?$/i;
const DOC_EXT_RE = /\.(?:md|markdown)$/i;

export interface LinkContext {
  baseDir: string;
  toAssetUrl: (absPath: string) => string;
  lazyImages?: boolean;
}

/**
 * `file:` URL → 마크다운 문서의 Windows 절대 경로. 문서(`.md`/`.markdown`)가 아니거나 드라이브·호스트가 없어 열 수 없으면 `undefined`.
 * `file:///C:/a%20b.md#s` → `C:\a b.md`, `file://server/share/x.md` → `\\server\share\x.md`, `file://localhost/C:/a.md` → `C:\a.md`
 */
export function fileUrlToLocalDoc(href: string): string | undefined {
  if (!FILE_RE.test(href)) return undefined;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.protocol !== "file:" || !DOC_EXT_RE.test(decodePercent(url.pathname))) return undefined;
  // `/C:/a.md` → `C:/a.md`(드라이브), `/share/x.md` + 호스트 → `//server/share/x.md`(UNC). 퍼센트 디코딩은 resolvePath가 한 번 한다
  const target = url.hostname === "" ? url.pathname.replace(/^\/+(?=[a-zA-Z]:)/, "") : `//${url.hostname}${url.pathname}`;
  if (!isAbsoluteWindowsPath(decodePercent(target))) return undefined;
  return resolvePath("", target);
}

/** markdown-it `validateLink`. 인자는 `normalizeLink`를 거친(퍼센트 인코딩된) 목적지 */
export function isAllowedLink(url: string): boolean {
  const value = url.trim();
  if (value === "" || value.startsWith("#")) return true;
  // 프로토콜 상대(`//host`)는 웹뷰 origin(tauri.localhost)에 붙어 의미가 없다
  if (value.startsWith("//")) return false;

  const decoded = decodePercent(value);
  if (isAbsoluteWindowsPath(decoded)) return true;

  const rawScheme = SCHEME_RE.exec(value)?.[0].toLowerCase();
  const decodedScheme = SCHEME_RE.exec(decoded)?.[0].toLowerCase();
  if (rawScheme === undefined && decodedScheme === undefined) return true; // 상대 경로
  // `file:`은 앱 내에서 여는 `.md` 문서만. 그 외 파일은 셸 실행·다운로드 통로가 되지 않게 거부 (스펙 §153)
  if (rawScheme === "file:") return fileUrlToLocalDoc(value) !== undefined;
  return [rawScheme, decodedScheme].every((s) => s === undefined || ALLOWED_SCHEMES.has(s));
}

/** 인라인 토큰의 `link_open`·`image`를 제자리에서 고친다 */
export function rewriteInlineLinks(children: Token[], ctx: LinkContext): void {
  for (const token of children) {
    if (token.type === "link_open") rewriteLink(token, ctx);
    else if (token.type === "image") rewriteImage(token, ctx);
  }
}

function rewriteLink(token: Token, ctx: LinkContext): void {
  const href = stringAttr(token, "href");
  if (href === "") {
    removeAttr(token, "href");
    return;
  }
  if (HTTP_RE.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener");
    return;
  }
  if (href.startsWith("#")) return;

  const fileDoc = fileUrlToLocalDoc(href);
  if (fileDoc !== undefined) {
    token.attrSet("data-local-path", fileDoc);
    return;
  }
  if (SCHEME_RE.test(href) && !isAbsoluteWindowsPath(decodePercent(href))) return; // mailto: 등

  const doc = LOCAL_DOC_RE.exec(href);
  if (doc) token.attrSet("data-local-path", resolvePath(ctx.baseDir, doc[1]));
}

function rewriteImage(token: Token, ctx: LinkContext): void {
  if (ctx.lazyImages) token.attrSet("loading", "lazy");
  const src = stringAttr(token, "src");
  if (src === "") {
    removeAttr(token, "src");
    return;
  }
  if (HTTP_RE.test(src)) return;
  if (SCHEME_RE.test(src) && !isAbsoluteWindowsPath(decodePercent(src))) {
    removeAttr(token, "src");
    return;
  }
  const abs = resolvePath(ctx.baseDir, src);
  token.attrSet("src", ctx.toAssetUrl(abs));
  // asset 프로토콜은 문서 폴더(하위 포함)만 연다 — 밖(`../`·다른 드라이브)이면 깨진 이미지가 왜 깨졌는지 알린다 (스펙 경계 사례)
  if (ctx.baseDir !== "" && !isInside(ctx.baseDir, abs) && token.attrGet("title") === null) {
    token.attrSet("title", OUTSIDE_TITLE);
  }
}

export const OUTSIDE_TITLE = "문서 폴더 밖의 이미지 — 보안상 문서 폴더(하위 폴더 포함) 안의 이미지만 보입니다";

/** `abs`가 `dir` 안(하위 포함)인지. Windows 경로라 대소문자를 가리지 않는다 */
function isInside(dir: string, abs: string): boolean {
  const base = dir.replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase();
  return abs.toLowerCase().startsWith(`${base}\\`);
}

function stringAttr(token: Token, name: string): string {
  const value = token.attrGet(name);
  return value === null ? "" : String(value);
}

/** `attrs`는 배열로 남긴다 — markdown-it 이미지 렌더 룰이 `attrs[attrIndex('alt')]`를 직접 만진다 */
function removeAttr(token: Token, name: string): void {
  if (token.attrs) token.attrs = token.attrs.filter(([attrName]) => attrName !== name);
}
