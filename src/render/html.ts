/**
 * 원문 HTML 허용 목록 (결정 D1, `docs/decisions/ideas/20261001-v1-open-decisions.md`).
 *
 * markdown-it을 `html: true`로 열되 허용 목록 태그만 HTML로 내보내고, 목록 밖 태그는 이스케이프해 글자 그대로 보인다.
 * GitHub처럼 모르는 태그를 지우면 산문 속 `List<String>`이 사라지기 때문이다. 주석 `<!-- -->`은 GitHub·Typora처럼 숨긴다.
 * - 블록: `html_block` 룰을 감싸 줄 첫 태그가 허용 목록(또는 닫힌 주석)일 때만 HTML 블록으로 받는다. 그 외(`<script>`·`<section>`·
 *   `<?…?>`·`<!DOCTYPE>`)는 `html: false` 때처럼 문단이 되고, 안의 태그는 인라인 룰이 하나씩 이스케이프한다
 * - 허용 태그는 속성 목록만 남겨 다시 쓴다(`style`·`on*`·`class` 등은 버린다). `a href`·`img src`는 마크다운 링크·이미지와 같은
 *   `normalizeLink` → `validateLink` → 재작성(links.ts: 새 창 속성·`data-local-path`·`toAssetUrl`)을 거친다
 * - HTML 블록 안의 글자는 그대로 HTML 글자로 두되 `<`·`>`·엔티티가 아닌 `&`만 이스케이프한다
 * - DOMPurify(sanitize.ts)가 그 뒤에 한 번 더 거른다
 */

import MarkdownIt from "markdown-it";
import type { MarkdownIt as MarkdownItInstance, RendererRule, Token } from "markdown-it";
import { DATA_LINE_ATTR } from "./data-line";
import { type LinkContext, rewriteInlineLinks } from "./links";

export const ALLOWED_HTML_TAGS: ReadonlySet<string> = new Set([
  "details", "summary", "img", "br", "kbd", "sub", "sup", "mark", "ins", "del", "s", "u", "abbr",
  "div", "p", "span", "a", "table", "thead", "tbody", "tr", "th", "td", "hr",
]);

export const ALLOWED_HTML_ATTRS: ReadonlySet<string> = new Set([
  "align", "width", "height", "alt", "title", "href", "src", "open", "colspan", "rowspan",
]);

/** 속성 이름이 뜻을 갖는 태그 — 다른 태그의 `href`·`src`는 재작성을 거치지 않으니 버린다 */
const URL_ATTR_TAG: Readonly<Record<string, string>> = { href: "a", src: "img" };

// markdown-it `HTML_TAG_RE`와 같은 문법 (CommonMark 원문 HTML). 그룹: 1 여는 태그 이름, 2 속성들, 3 닫는 태그 이름
const ATTR_NAME = "[a-zA-Z_:][a-zA-Z0-9:._-]*";
const ATTR_VALUE = "(?:[^\"'=<>`\\x00-\\x20]+|'[^']*'|\"[^\"]*\")";
const OPEN_TAG = `<([A-Za-z][A-Za-z0-9-]*)((?:\\s+${ATTR_NAME}(?:\\s*=\\s*${ATTR_VALUE})?)*)\\s*\\/?>`;
const CLOSE_TAG = "<\\/([A-Za-z][A-Za-z0-9-]*)\\s*>";
const COMMENT = "<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->";
const OTHER = "<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>";
const TAG_RE = new RegExp(`${OPEN_TAG}|${CLOSE_TAG}|(${COMMENT})|${OTHER}`, "g");
const ATTR_RE = new RegExp(`(${ATTR_NAME})(?:\\s*=\\s*(${ATTR_VALUE}))?`, "g");
const LEADING_TAG_NAME_RE = /^<\/?([A-Za-z][A-Za-z0-9-]*)/;
const ENTITY_RE = /&(?!(?:#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});)/g;

/** 렌더러 룰의 env는 renderMarkdown의 RenderEnv다 — 링크 재작성에 필요한 부분만 본다 */
type HtmlEnv = LinkContext;

export function htmlAllowlistPlugin(md: MarkdownItInstance): void {
  const rule = md.block.ruler.__rules__.find((r) => r.name === "html_block");
  if (!rule) throw new Error("markdown-it html_block 룰이 없습니다");
  const original = rule.fn;
  md.block.ruler.at(
    "html_block",
    (state, startLine, endLine, silent) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine];
      const line = state.src.slice(pos, state.eMarks[startLine]);
      if (line.startsWith("<!--")) {
        // 닫히지 않은 주석은 문서 끝까지 삼키니 받지 않는다 → 글자로 보인다
        if (state.src.indexOf("-->", pos + 2) === -1) return false;
      } else {
        const name = LEADING_TAG_NAME_RE.exec(line)?.[1].toLowerCase();
        if (name === undefined || !ALLOWED_HTML_TAGS.has(name)) return false;
      }
      return original(state, startLine, endLine, silent);
    },
    { alt: rule.alt },
  );

  const renderBlock: RendererRule = (tokens, idx, _options, env) => {
    const token = tokens[idx];
    const line = token.attrGet(DATA_LINE_ATTR);
    return renderHtml(md, token.content, env as unknown as HtmlEnv, line === null ? undefined : String(line));
  };
  const renderInline: RendererRule = (tokens, idx, _options, env) =>
    renderHtml(md, tokens[idx].content, env as unknown as HtmlEnv);
  md.renderer.rules.html_block = renderBlock;
  md.renderer.rules.html_inline = renderInline;
}

/** 원문 HTML 조각 → 안전한 HTML. `dataLine`은 블록의 첫 허용 여는 태그에 붙여 스크롤 동기가 블록을 찾게 한다 */
function renderHtml(md: MarkdownItInstance, src: string, env: HtmlEnv, dataLine?: string): string {
  let out = "";
  let last = 0;
  let line = dataLine;
  for (const m of src.matchAll(TAG_RE)) {
    out += escapeText(src.slice(last, m.index));
    last = m.index + m[0].length;
    const [raw, openName, attrs, closeName, comment] = m;
    if (comment !== undefined) continue;
    if (openName !== undefined && ALLOWED_HTML_TAGS.has(openName.toLowerCase())) {
      out += renderOpenTag(md, openName.toLowerCase(), attrs ?? "", env, line);
      line = undefined;
    } else if (closeName !== undefined && ALLOWED_HTML_TAGS.has(closeName.toLowerCase())) {
      out += `</${closeName.toLowerCase()}>`;
    } else {
      out += escapeText(raw);
    }
  }
  return out + escapeText(src.slice(last));
}

function renderOpenTag(md: MarkdownItInstance, name: string, rawAttrs: string, env: HtmlEnv, dataLine?: string): string {
  // 링크·이미지 재작성(links.ts)이 markdown-it 토큰을 받으므로 같은 모양으로 만든다
  const token: Token = new MarkdownIt.Token(name === "a" ? "link_open" : name === "img" ? "image" : "html_tag", name, 0);
  token.attrs = [];
  if (dataLine !== undefined) token.attrSet(DATA_LINE_ATTR, dataLine);
  for (const [, rawName, rawValue] of rawAttrs.matchAll(ATTR_RE)) {
    const attr = rawName.toLowerCase();
    if (!ALLOWED_HTML_ATTRS.has(attr) || token.attrGet(attr) !== null) continue; // 중복은 HTML처럼 처음 것
    const urlTag = URL_ATTR_TAG[attr];
    if (urlTag !== undefined && urlTag !== name) continue;
    let value = rawValue === undefined ? "" : decodeEntities(md, unquote(rawValue));
    if (urlTag !== undefined) {
      value = md.normalizeLink(value.trim());
      if (!md.validateLink(value)) continue;
    }
    token.attrs.push([attr, value]);
  }
  rewriteInlineLinks([token], env);
  return `<${name}${md.renderer.renderAttrs(token)}>`;
}

function unquote(value: string): string {
  const q = value[0];
  return (q === '"' || q === "'") && value.endsWith(q) ? value.slice(1, -1) : value;
}

/**
 * 속성 값의 HTML 엔티티를 푼다. markdown-it `unescapeAll`은 `\` 이스케이프도 풀어 `C:\(old)\a.png`를 망가뜨리므로
 * 역슬래시를 두 배로 넣어 `\\` → `\`로만 돌아오게 한다
 */
function decodeEntities(md: MarkdownItInstance, value: string): string {
  return md.utils.unescapeAll(value.replace(/\\/g, "\\\\"));
}

/** 원문 HTML 속 글자: 엔티티(`&copy;`)는 살리고 `<`·`>`·홀로 선 `&`만 이스케이프 */
function escapeText(text: string): string {
  return text.replace(ENTITY_RE, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
