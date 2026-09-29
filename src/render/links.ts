/**
 * 링크·이미지 정책 (brief W10·R4·G15).
 * - `validateLink` 대체: 허용 목록 방식 — `http:`·`https:`·`mailto:`·`#앵커`·스킴 없는 상대 경로·`C:\` 절대 경로만.
 *   `javascript:`·`data:`·`file:`·`vbscript:` 등 나머지는 전부 거부 → markdown-it이 링크로 만들지 않고 글자 그대로 둔다
 * - 렌더 전 토큰 재작성: http(s) 링크는 `target="_blank" rel="noopener"`, 상대 `.md` 링크는 `data-local-path`,
 *   상대 이미지는 문서 폴더 기준 절대 경로 → `toAssetUrl`. 그 외 스킴의 이미지는 `src`를 뗀다
 */

import type { Token } from "markdown-it";
import { decodePercent, isAbsoluteWindowsPath, resolvePath } from "./paths";

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const HTTP_RE = /^https?:/i;
const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);
/** `.md`/`.markdown`로 끝나는 경로 + 선택적 `#조각`·`?쿼리` */
const LOCAL_DOC_RE = /^(.*?\.(?:md|markdown))(?:[?#].*)?$/i;

export interface LinkContext {
  baseDir: string;
  toAssetUrl: (absPath: string) => string;
}

/** markdown-it `validateLink`. 인자는 `normalizeLink`를 거친(퍼센트 인코딩된) 목적지 */
export function isAllowedLink(url: string): boolean {
  const value = url.trim();
  if (value === "" || value.startsWith("#")) return true;
  // 프로토콜 상대(`//host`)는 웹뷰 origin(tauri.localhost)에 붙어 의미가 없다
  if (value.startsWith("//")) return false;

  const decoded = decodePercent(value);
  if (isAbsoluteWindowsPath(decoded)) return true;

  const rawScheme = SCHEME_RE.exec(value)?.[0];
  const decodedScheme = SCHEME_RE.exec(decoded)?.[0];
  if (rawScheme === undefined && decodedScheme === undefined) return true; // 상대 경로
  return [rawScheme, decodedScheme].every((s) => s === undefined || ALLOWED_SCHEMES.has(s.toLowerCase()));
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
  if (SCHEME_RE.test(href) && !isAbsoluteWindowsPath(decodePercent(href))) return; // mailto: 등

  const doc = LOCAL_DOC_RE.exec(href);
  if (doc) token.attrSet("data-local-path", resolvePath(ctx.baseDir, doc[1]));
}

function rewriteImage(token: Token, ctx: LinkContext): void {
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
  token.attrSet("src", ctx.toAssetUrl(resolvePath(ctx.baseDir, src)));
}

function stringAttr(token: Token, name: string): string {
  const value = token.attrGet(name);
  return value === null ? "" : String(value);
}

/** `attrs`는 배열로 남긴다 — markdown-it 이미지 렌더 룰이 `attrs[attrIndex('alt')]`를 직접 만진다 */
function removeAttr(token: Token, name: string): void {
  if (token.attrs) token.attrs = token.attrs.filter(([attrName]) => attrName !== name);
}
