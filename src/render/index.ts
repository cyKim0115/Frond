/**
 * 렌더 파이프라인 (로드맵 1-3, 스택 판정 Modified approach 6).
 *
 * markdown-it 15 (`html: true` + 허용 목록, linkify) + cjk-friendly + front-matter + anchor + 태스크 리스트 + footnote
 *   → `data-line` 부여 → 링크·이미지 재작성(스킴 허용 목록, 상대 경로 → 절대 경로 → `toAssetUrl`) → DOMPurify.
 * 코드 하이라이트는 DOM 삽입 뒤 `highlightCodeBlocks()`가 언어를 지연 로드해 처리한다.
 * front matter는 닫는 줄이 있는 YAML 해시일 때만 인정한다(`hasClosedFrontMatter`) — 첫 줄 `---`만으로는 `<hr>`.
 *
 * 원문 HTML은 허용 목록 태그(`<details>`·`<img width>`·`<br>`·`<kbd>`…)만 렌더하고 나머지 태그는 글자 그대로 둔다 (html.ts, 결정 D1).
 * 수식(`$…$`·`$$`·```math)은 math.ts가 자리만 표시하고 셸이 DOM에 넣은 뒤 math-render.ts가 KaTeX로 그린다(4-3).
 * GitHub Alerts(`> [!NOTE]`)는 alerts.ts(로드맵 4-2). Mermaid 펜스는 보통 코드 블록으로 내고 셸이 DOM에 넣은 뒤 mermaid.ts가 그린다(4-1).
 */

import MarkdownIt from "markdown-it";
import type { MarkdownIt as MarkdownItInstance, RendererRule, StateCore, Token } from "markdown-it";
import anchor from "markdown-it-anchor";
import cjkFriendly from "markdown-it-cjk-friendly";
import footnote from "markdown-it-footnote";
import frontMatter from "markdown-it-front-matter";
import { alertsPlugin } from "./alerts";
import { chunkPlugin } from "./chunks";
import { dataLinePlugin } from "./data-line";
import { htmlAllowlistPlugin } from "./html";
import { isAllowedLink, rewriteInlineLinks } from "./links";
import { mathFenceHtml, mathPlugin } from "./math";
import { sanitizeHtml } from "./sanitize";
import { taskListsPlugin } from "./task-lists";
import type { RenderOptions, RenderResult, TocEntry } from "./types";

export type { RenderOptions, RenderResult, TocEntry } from "./types";
export { CHUNK_CLASS } from "./chunks";
export { highlightCodeBlocks } from "./highlight";
export { resolvePath } from "./paths";

/** 한 번의 `render` 동안 코어 룰이 읽고 쓰는 상태. `md`는 모듈 싱글턴이라 렌더별 데이터는 전부 env에 둔다 */
type RenderEnv = {
  baseDir: string;
  toAssetUrl: (absPath: string) => string;
  lazyImages?: boolean;
  chunkBlocks?: number;
  toc: TocEntry[];
  frontMatter?: string;
};

/**
 * GitHub식 슬러그(github-slugger): trim·소문자 → 유니코드 문자/숫자/결합 부호/연결 부호(`_`)/`-`/공백 외 제거 → 공백 하나마다 `-`.
 * 한글은 그대로 남는다. 공백을 묶지 않으므로 `a  b`·`a & b`는 GitHub처럼 `a--b`.
 * 중복은 markdown-it-anchor가 `-1`, `-2`를 붙여 푼다. 문장 부호뿐인 제목은 `section`
 */
export function slugify(text: string): string {
  const slug = text.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc} -]/gu, "").replace(/ /g, "-");
  return slug === "" ? "section" : slug;
}

const WWW_RE = /^www\./i;

function createMarkdownIt(): MarkdownItInstance {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: false, breaks: false })
    .use(htmlAllowlistPlugin)
    .use(cjkFriendly)
    // 원문은 콜백 대신 토큰(`front_matter`.meta)에서 읽어 env에 넣는다 — 콜백은 env를 못 받는다
    .use(frontMatter, () => {})
    .use(anchor, { slugify, tabIndex: false })
    .use(taskListsPlugin)
    .use(footnote)
    .use(alertsPlugin)
    .use(mathPlugin)
    .use(dataLinePlugin);

  // GFM 자동 링크 범위: 스킴 있는 URL·이메일·`www.`로 시작하는 주소 (결정 D2). linkify-it에 `www.` 전용 옵션이 없어 퍼지 링크를 켜고
  // 스킴 없는 매치 중 `www.`로 시작하지 않는 것은 버린다 — 안 버리면 `paths.md` 같은 파일명이 `.md`(몰도바 TLD) 링크가 된다
  md.linkify.set({ fuzzyLink: true, fuzzyIP: false });
  const match = md.linkify.match.bind(md.linkify);
  // 코어 linkify 룰은 `test`가 참이면 결과의 `length`를 바로 읽는다 — 다 걸러져도 null이 아니라 빈 배열
  md.linkify.match = (text) => match(text)?.filter((m) => m.schema !== "" || WWW_RE.test(m.raw)) ?? null;
  md.validateLink = isAllowedLink;

  const renderFence: RendererRule = (tokens, idx, _options, _env, renderer) => {
    const token = tokens[idx];
    const info = token.info ? md.utils.unescapeAll(token.info).trim() : "";
    const lang = info.split(/\s+/)[0];
    const attrs = renderer.renderAttrs(token); // data-line
    if (lang === "math") return mathFenceHtml(token.content, attrs, md.utils.escapeHtml);
    const body = md.utils.escapeHtml(token.content);
    if (lang === "") return `<pre${attrs}><code>${body}</code></pre>\n`;
    const safeLang = md.utils.escapeHtml(lang);
    return `<pre${attrs}><code class="language-${safeLang}" data-lang="${safeLang}">${body}</code></pre>\n`;
  };
  md.renderer.rules.fence = renderFence;

  // 플러그인(anchor·linkify·footnote) 뒤에 push → 모든 토큰이 완성된 뒤 목차·front matter·링크 재작성
  md.core.ruler.push("frond_collect", collectRule);
  // 토큰 목록을 바꾸므로 맨 끝
  md.use(chunkPlugin);
  return md;
}

function collectRule(state: StateCore): void {
  const env = state.env as RenderEnv;
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    switch (token.type) {
      case "front_matter":
        env.frontMatter = typeof token.meta === "string" ? token.meta : "";
        break;
      case "heading_open": {
        const inline = tokens[i + 1] as Token | undefined;
        env.toc.push({
          level: Number(token.tag.slice(1)),
          text: inline?.type === "inline" ? plainText(inline.children ?? []) : "",
          id: String(token.attrGet("id") ?? ""),
          line: token.map?.[0] ?? 0,
        });
        break;
      }
      case "inline":
        if (token.children) rewriteInlineLinks(token.children, env);
        break;
    }
  }
}

/** 제목 인라인의 평문 — markdown-it-anchor가 슬러그에 쓰는 것과 같은 규칙 */
function plainText(children: Token[]): string {
  return children
    .filter((child) => child.type === "text" || child.type === "code_inline")
    .map((child) => child.content)
    .join("");
}

const md = createMarkdownIt();

const FRONT_MATTER_OPEN_RE = /^(-{3,})[ \t]*(?:\r?\n|$)/;
const FRONT_MATTER_CLOSE_RE = /^ {0,3}(-{3,}|\.\.\.)[ \t]*$/;
/** 최상위 YAML 키(`title: x`·`foo:`). 주석(`#`)·리스트(`-`)·`http://`처럼 `:` 뒤에 공백이 없는 값은 키가 아니다 */
const YAML_KEY_RE = /^[^\s#:-][^:]*:(?:[ \t]|$)/;

/**
 * 진짜 front matter인지. markdown-it-front-matter는 닫는 줄이 없으면 문서 끝까지 통째로 삼키므로(자동 닫힘) 여기서 먼저 거른다.
 * GitHub처럼 (1) 닫는 `---`(여는 것 이상 길이)·`...` 줄이 있고 (2) 내용이 YAML 해시(최상위 키가 하나라도 있거나 비어 있음)일 때만 인정한다.
 * 첫 줄이 수평선 `---`인 보통 문서(`---\n\n# 제목 …`)는 룰을 꺼서 `<hr>`+본문으로 렌더한다
 */
export function hasClosedFrontMatter(text: string): boolean {
  const open = FRONT_MATTER_OPEN_RE.exec(text);
  if (!open) return false;
  const minLength = open[1].length;
  const body: string[] = [];
  for (const line of text.slice(open[0].length).split(/\r?\n/)) {
    const close = FRONT_MATTER_CLOSE_RE.exec(line);
    if (close && (close[1] === "..." || close[1].length >= minLength)) {
      return body.every((l) => l.trim() === "") || body.some((l) => YAML_KEY_RE.test(l));
    }
    body.push(line);
  }
  return false;
}

/** 스펙 `largeSoftLimit` — 이 바이트를 넘는 문서는 셸이 하이라이트를 생략하고 큰 문서 모드(style.css `large-doc`)로 그린다 */
export const LARGE_SOFT_LIMIT = 2 * 1024 * 1024;

/** 큰 문서 모드에서 한 묶음(chunks.ts)에 넣을 최상위 블록 수 — 10 MB 샘플(블록 14만 개)이 묶음 1,400여 개가 된다 */
export const LARGE_CHUNK_BLOCKS = 100;

/** 동기. 큰 문서의 예산 판단(2 MB·10 MB)은 셸이 한다 */
export function renderMarkdown(source: string, options: RenderOptions): RenderResult {
  // 디코더가 BOM을 남겼어도 front matter·첫 제목이 깨지지 않게
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  // 렌더는 동기이고 `md`는 싱글턴이라 렌더마다 토글해도 안전하다
  md.block.ruler[hasClosedFrontMatter(text) ? "enable" : "disable"]("front_matter");
  const env: RenderEnv = {
    baseDir: options.baseDir,
    toAssetUrl: options.toAssetUrl,
    lazyImages: options.lazyImages,
    chunkBlocks: options.chunkBlocks,
    toc: [],
  };
  const html = sanitizeHtml(md.render(text, env));
  const result: RenderResult = { html, toc: env.toc };
  if (env.frontMatter !== undefined) result.frontMatter = env.frontMatter;
  return result;
}
