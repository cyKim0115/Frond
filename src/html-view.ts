/**
 * HTML 문서 보기 (결정 docs/decisions/ideas/20261026-html-view.md) — HTML 탭마다 iframe 하나. 엔진은 앱과 같은 WebView2다.
 *
 * - **안전 보기(기본)**: `srcdoc` + `sandbox="allow-same-origin allow-modals"`. 같은 origin이라 앱이 frame 문서에 직접 붙어
 *   링크·단축키·찾기·글자 수·인쇄를 처리한다. 대신 스크립트가 한 줄이라도 돌면 IPC가 열리므로(Tauri 권고문 GHSA-57fm-592m-34r7의
 *   Windows 예외) 네 겹으로 막는다 — ① 샌드박스(`allow-scripts` 없음) ② 맨 앞 meta CSP `script-src 'none'` ③ 물려받는 앱 CSP(인라인 금지)
 *   ④ 여기서 지우는 `<script>`·`on*` 속성·`javascript:` URL·meta refresh·`<base>`. 이미지·CSS·글꼴·미디어는 문서 폴더(`htmlview` 프로토콜)와
 *   `data:`만 — 외부 리소스는 열람 추적이 될 수 있어 막는다
 * - **스크립트 허용**: `src="http://htmlview.localhost/<토큰>/<파일>"` + `sandbox="allow-scripts allow-modals"`. 불투명 origin이라
 *   앱 DOM·저장소에 닿지 않는다. Windows에서는 wry가 Tauri 초기화 스크립트(invoke 키 포함)를 frame에도 넣지만, Tauri가
 *   `Origin: null`을 거부하고 frame의 postMessage는 앱 IPC 처리기에 닿지 않아 부르지 못한다(2026-10-26 실측). 링크·단축키·인쇄는
 *   프로토콜이 넣은 도우미(src-tauri/src/htmlview_helper.js)가 `postMessage`로 넘기고, 여기서는 보낸 frame을 확인한 뒤 믿지 않는 값으로 다룬다
 * - 줌은 두 보기 모두 탭 `<article>`의 CSS `zoom`(main.ts `applyZoom`)이 frame 내용을 키운다 — frame 상자는 본문 판 크기 그대로
 *
 * 순수 함수(`buildSafeDoc`·`htmlTitle`·`viewTarget`)는 html-view.test.ts가 시험한다.
 */

import { invoke } from "@tauri-apps/api/core";
import { localDocPath } from "./render/links";
import { decodePercent } from "./render/paths";

/** 프로토콜 origin (Windows에서 Tauri 커스텀 프로토콜은 `http://<이름>.localhost`) */
export const VIEW_ORIGIN = "http://htmlview.localhost";

const HTML_EXT_RE = /\.html?$/i;
/** HTML 보기로 여는 문서인지 — 확장자로만 가른다 (`.xhtml`은 XML 파서가 필요해 넣지 않는다) */
export function isHtmlPath(path: string): boolean {
  return HTML_EXT_RE.test(path);
}

/** 안전 보기에서 막은 것 — 배너에 쓴다 */
export interface Blocked {
  /** 지운 `<script>` 수 */
  scripts: number;
  /** `on*` 속성을 지운 요소 수 */
  handlers: number;
  /** 외부(원격) 리소스를 부르는 곳이 있었다 */
  remote: boolean;
}

export interface SafeDoc {
  html: string;
  blocked: Blocked;
}

/** 안전 보기 meta CSP — `origin`은 리소스를 내는 곳(앱에서는 `VIEW_ORIGIN`, 브라우저 미리보기에서는 Vite) */
export function safeCsp(origin: string): string {
  return [
    "default-src 'none'",
    `img-src ${origin} data:`,
    `media-src ${origin} data:`,
    `style-src ${origin} 'unsafe-inline'`,
    `font-src ${origin} data:`,
    `frame-src ${origin}`,
    "script-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "connect-src 'none'",
    `base-uri ${origin}`,
  ].join("; ");
}

/** URL을 담는 속성 — `javascript:`·`vbscript:` 값이면 지운다 */
const URL_ATTRS = ["href", "src", "action", "formaction", "xlink:href", "data", "poster", "background", "ping", "srcdoc"];
const SCRIPT_URL_RE = /^(?:javascript|vbscript):/i;
/** 리소스를 부르는 요소의 속성 — 외부를 가리키면 "외부 리소스 있음" */
const RESOURCE_SELECTOR =
  "img[src], img[srcset], source[src], source[srcset], video[src], video[poster], audio[src], track[src], iframe[src], embed[src], object[data], input[src], script[src], link[href]";
const REMOTE_RE = /^\s*(?:https?:)?\/\//i;
const CSS_REMOTE_RE = /url\(\s*["']?\s*(?:https?:)?\/\/|@import\s+(?:url\()?\s*["']?\s*(?:https?:)?\/\//i;
/** 리소스가 아니라 연결만 미리 여는 `<link>` — CSP가 다루지 않는 것도 있어 안전 보기에서 지운다 */
const PRECONNECT_RELS = ["dns-prefetch", "preconnect", "prefetch", "prerender", "modulepreload"];

/** 찾기(find.ts) 하이라이트 — style.css의 `::highlight(find-*)`와 같은 색. frame 문서에는 앱 CSS가 없어서 따로 넣는다 */
function findHighlightCss(accent: string): string {
  return (
    "::highlight(find-match){background-color:color-mix(in srgb,#f2cc60 55%,transparent)}" +
    `::highlight(find-current){background-color:color-mix(in srgb,${accent || "Highlight"} 45%,transparent)}`
  );
}

/**
 * 안전 보기 `srcdoc` — `text`(문서 원문)를 inert 파싱(DOMParser는 스크립트를 돌리지 않고 리소스도 부르지 않는다)해 실행되는 것을 지우고,
 * `<head>` 맨 앞에 meta CSP·`<base href=base>`·찾기 하이라이트 CSS를 넣어 다시 문자열로 만든다. doctype은 그대로 둔다(표준·호환 모드 유지)
 */
export function buildSafeDoc(text: string, base: string, accent = ""): SafeDoc {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const blocked: Blocked = { scripts: 0, handlers: 0, remote: false };

  for (const el of Array.from(doc.querySelectorAll(RESOURCE_SELECTOR))) {
    const value = el.getAttribute("src") ?? el.getAttribute("data") ?? el.getAttribute("href") ?? el.getAttribute("poster") ?? "";
    const srcset = el.getAttribute("srcset") ?? "";
    const isLink = el.localName === "link";
    const rel = isLink ? (el.getAttribute("rel") ?? "").toLowerCase() : "";
    // <link rel=canonical·alternate> 같은 메타 정보는 리소스가 아니다
    const loads = !isLink || /\b(stylesheet|icon|preload|manifest|modulepreload|prefetch|preconnect|dns-prefetch|prerender)\b/.test(rel);
    if (loads && (REMOTE_RE.test(value) || srcset.split(",").some((c) => REMOTE_RE.test(c)))) blocked.remote = true;
  }
  for (const style of Array.from(doc.querySelectorAll("style"))) if (CSS_REMOTE_RE.test(style.textContent ?? "")) blocked.remote = true;

  for (const script of Array.from(doc.querySelectorAll("script"))) {
    script.remove();
    blocked.scripts++;
  }
  for (const el of Array.from(doc.querySelectorAll("*"))) {
    let handler = false;
    for (const name of el.getAttributeNames()) {
      const lower = name.toLowerCase();
      if (lower.startsWith("on")) {
        el.removeAttribute(name);
        handler = true;
      } else if (URL_ATTRS.includes(lower)) {
        // URL 파서처럼 제어 문자·공백을 빼고 본다 (`java\tscript:`도 javascript:다)
        // eslint-disable-next-line no-control-regex
        const value = (el.getAttribute(name) ?? "").replace(/[\u0000- ]/g, "");
        if (SCRIPT_URL_RE.test(value)) el.removeAttribute(name);
      } else if (lower === "style" && !blocked.remote && CSS_REMOTE_RE.test(el.getAttribute(name) ?? "")) {
        blocked.remote = true;
      }
    }
    if (handler) blocked.handlers++;
  }
  doc.querySelectorAll("base, meta[http-equiv]").forEach((el) => {
    if (el.localName === "base" || /^\s*refresh\s*$/i.test(el.getAttribute("http-equiv") ?? "")) el.remove();
  });
  doc.querySelectorAll("link[rel]").forEach((el) => {
    const rels = (el.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
    if (rels.some((r) => PRECONNECT_RELS.includes(r))) el.remove();
  });

  const csp = doc.createElement("meta");
  csp.setAttribute("http-equiv", "Content-Security-Policy");
  csp.setAttribute("content", safeCsp(new URL(base).origin));
  const baseEl = doc.createElement("base");
  baseEl.setAttribute("href", base);
  const style = doc.createElement("style");
  style.setAttribute("data-frond", "");
  style.textContent = findHighlightCss(accent);
  doc.head.prepend(csp, baseEl, style);

  return { html: doctypeOf(doc) + doc.documentElement.outerHTML, blocked };
}

function doctypeOf(doc: Document): string {
  const dt = doc.doctype;
  if (!dt) return "";
  const pub = dt.publicId ? ` PUBLIC "${dt.publicId}"` : "";
  const sys = dt.systemId ? `${dt.publicId ? "" : " SYSTEM"} "${dt.systemId}"` : "";
  return `<!DOCTYPE ${dt.name}${pub}${sys}>`;
}

const TITLE_MAX = 120;
const TITLE_RE = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i;
const H1_RE = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i;

/** 최근 목록·받은 목록에 보일 제목 — `<title>`, 없으면 첫 `<h1>`. 큰 문서도 앞부분만 정규식으로 찾고 그 조각만 파싱한다 */
export function htmlTitle(text: string): string | undefined {
  const head = text.slice(0, 256 * 1024);
  for (const re of [TITLE_RE, H1_RE]) {
    const m = re.exec(head);
    if (!m) continue;
    const el = new DOMParser().parseFromString(`<div>${m[1]}</div>`, "text/html").body;
    const title = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (title !== "") return title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1)}…` : title;
  }
  return undefined;
}

/** 링크를 누른 결과 */
export type ViewTarget =
  | { kind: "fragment"; id: string }
  | { kind: "external"; url: string }
  | { kind: "doc"; path: string }
  | { kind: "none" };

/**
 * 안전 보기에서 누른 `<a>`의 `href` 원문 → 할 일. `#조각`은 frame 안 이동, `http(s)`·`mailto`는 기본 브라우저,
 * 앱이 여는 문서(`.md`·`.html` — 상대·절대·`file:`)는 Frond 탭, 그 밖은 아무것도 하지 않는다(frame은 이동하지 않는다)
 */
export function viewTarget(href: string, docDir: string): ViewTarget {
  const value = href.trim();
  if (value === "") return { kind: "none" };
  if (value.startsWith("#")) return { kind: "fragment", id: decodePercent(value.slice(1)) };
  if (/^(?:https?:|mailto:)/i.test(value)) {
    try {
      return { kind: "external", url: new URL(value).href };
    } catch {
      return { kind: "none" };
    }
  }
  const path = localDocPath(value, docDir);
  return path === undefined ? { kind: "none" } : { kind: "doc", path };
}

/**
 * 스크립트 허용 보기의 도우미가 보낸 링크 → 할 일. `href` 원문(`raw`)을 안전 보기와 같이 문서 폴더 기준으로 판정한다 — 프로토콜 URL로
 * 풀린 절대 주소(`href`)는 `../a.md`처럼 문서 폴더 위를 가리키면 폴더 정보를 잃는다. 원문이 없으면 절대 주소 중 외부만 받는다.
 * 같은 문서의 `#조각`은 도우미가 frame 안에서 처리하므로 오지 않는다
 */
export function messageTarget(raw: unknown, href: string, docDir: string): ViewTarget {
  if (typeof raw === "string" && raw.trim() !== "") {
    const target = viewTarget(raw, docDir);
    return target.kind === "fragment" ? { kind: "none" } : target;
  }
  return /^(?:https?:|mailto:)/i.test(href) && !href.startsWith(VIEW_ORIGIN) ? viewTarget(href, docDir) : { kind: "none" };
}

export interface HtmlViewHooks {
  isTauri: boolean;
  /** 지금 문서 경로·폴더 (다른 이름으로 저장하면 바뀐다) */
  doc(): { path: string; dir: string; name: string };
  /** 브라우저 미리보기에서 상대 리소스 base — Vite가 프로젝트 파일을 낸다 */
  previewBase(): string;
  /** 찾기 하이라이트 강조색 (지금 테마 `--accent`) */
  accent(): string;
  /** frame 안에서 누른 키 — 앱 단축키 처리기(main.ts)에 그대로 넘긴다 */
  onKeydown(event: KeyboardEvent): void;
  openExternal(url: string): void;
  openDoc(path: string): void;
  /** frame이 새 문서를 다 읽었다 — 글자 수·찾기 갱신 */
  onLoad(view: HtmlView): void;
}

const SAFE_SANDBOX = "allow-same-origin allow-modals";
const SCRIPT_SANDBOX = "allow-scripts allow-modals";

const views = new Set<HtmlView>();
let listening = false;

/** 스크립트 허용 frame의 도우미 메시지 — 보낸 창이 그 frame인지 먼저 본다 (불투명 origin이라 `event.origin`은 "null") */
function onMessage(event: MessageEvent): void {
  if (event.origin !== "null") return;
  for (const view of views) {
    if (view.scripts && event.source === view.frame.contentWindow) {
      view.receive(event.data);
      return;
    }
  }
}

/** HTML 탭 하나의 보기 — `container`(탭 `<article>`) 안에 iframe을 둔다 */
export class HtmlView {
  readonly frame: HTMLIFrameElement;
  /** 지금 frame이 스크립트 허용으로 그려졌다 */
  scripts = false;
  blocked: Blocked = { scripts: 0, handlers: 0, remote: false };
  private token: string | null = null;
  private opening: Promise<string | null> | null = null;
  private seq = 0;
  private restoreScroll: { top: number; left: number } | null = null;
  private disposed = false;
  private loadWaiters: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    private readonly hooks: HtmlViewHooks,
  ) {
    this.frame = document.createElement("iframe");
    this.frame.className = "html-frame";
    this.frame.setAttribute("sandbox", SAFE_SANDBOX);
    this.frame.setAttribute("referrerpolicy", "no-referrer");
    this.frame.title = "HTML 문서";
    this.frame.addEventListener("load", () => this.onFrameLoad());
    container.append(this.frame);
    views.add(this);
    if (!listening) {
      window.addEventListener("message", onMessage);
      listening = true;
    }
  }

  /** 문서 폴더 base — 앱은 프로토콜 토큰, 브라우저 미리보기는 Vite 경로 */
  private async base(): Promise<string | null> {
    if (!this.hooks.isTauri) return this.hooks.previewBase();
    if (!this.token) {
      this.opening ??= invoke<string>("html_view_open", { path: this.hooks.doc().path }).catch(() => null);
      this.token = await this.opening;
      this.opening = null;
    }
    return this.token ? `${VIEW_ORIGIN}/${this.token}/` : null;
  }

  /** 문서를 (다시) 그린다. `scripts`면 스크립트 허용 보기 — 브라우저 미리보기에서는 늘 안전 보기 */
  async render(text: string, scripts: boolean): Promise<void> {
    const seq = ++this.seq;
    const base = await this.base();
    if (seq !== this.seq || this.disposed || base === null) return;
    const withScripts = scripts && this.hooks.isTauri;
    // 스크립트 허용은 본문까지 프로토콜로 낸다(편집 중 텍스트). 안전 보기는 본문이 srcdoc이라 모드만 알린다
    if (this.token) await invoke("html_view_set", { token: this.token, text: withScripts ? text : null, scripts: withScripts }).catch(() => undefined);
    if (seq !== this.seq || this.disposed) return;
    if (withScripts) {
      this.restoreScroll = null;
      this.frame.setAttribute("sandbox", SCRIPT_SANDBOX);
      // srcdoc이 있으면 src는 무시된다 — src를 먼저 바꾸고 srcdoc을 지워야 새 src로 간다
      this.frame.src = `${base}${encodeURIComponent(this.hooks.doc().name)}?v=${seq}`;
      this.frame.removeAttribute("srcdoc");
    } else {
      const safe = buildSafeDoc(text, base, this.hooks.accent());
      this.blocked = safe.blocked;
      // 편집 중 다시 그릴 때(분할 뷰) 보던 자리를 지킨다
      this.restoreScroll = this.scripts ? null : this.scrollPosition();
      this.frame.setAttribute("sandbox", SAFE_SANDBOX);
      this.frame.removeAttribute("src");
      this.frame.srcdoc = safe.html;
    }
    this.scripts = withScripts;
  }

  /** 안전 보기 frame 문서 (스크립트 허용이면 다른 origin이라 null) */
  document(): Document | null {
    if (this.scripts) return null;
    try {
      return this.frame.contentDocument;
    } catch {
      return null;
    }
  }

  /** 찾기·글자 수 대상 — 안전 보기 본문 */
  body(): HTMLElement | null {
    return this.document()?.body ?? null;
  }

  private scrollPosition(): { top: number; left: number } | null {
    const el = this.document()?.scrollingElement;
    return el ? { top: el.scrollTop, left: el.scrollLeft } : null;
  }

  /** 다음 frame 읽기가 끝날 때 — 다시 그린 뒤 인쇄할 때. 그리기가 취소돼 load가 안 와도 `timeoutMs` 뒤에는 넘어간다 */
  loaded(timeoutMs = 3000): Promise<void> {
    return new Promise((resolve) => {
      const timer = window.setTimeout(resolve, timeoutMs);
      this.loadWaiters.push(() => {
        window.clearTimeout(timer);
        resolve();
      });
    });
  }

  private onFrameLoad(): void {
    for (const resolve of this.loadWaiters.splice(0)) resolve();
    if (this.disposed) return;
    const doc = this.document();
    // 빈 frame(about:blank)이 처음 뜰 때도 load가 온다 — 그린 문서가 있을 때만
    if (doc && this.frame.hasAttribute("srcdoc")) this.attach(doc);
    this.hooks.onLoad(this);
  }

  /** 안전 보기 frame 문서에 앱 처리를 붙인다 — 스크립트가 없는 문서라 앱(부모)의 리스너만 돈다 */
  private attach(doc: Document): void {
    const scroll = this.restoreScroll;
    this.restoreScroll = null;
    if (scroll && doc.scrollingElement) {
      doc.scrollingElement.scrollTop = scroll.top;
      doc.scrollingElement.scrollLeft = scroll.left;
    }
    doc.addEventListener("keydown", (event) => this.hooks.onKeydown(event), true);
    const onClick = (event: MouseEvent): void => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      // frame은 늘 제자리 — 이동·다운로드·새 창을 앱이 대신 정한다
      event.preventDefault();
      if (event.type === "auxclick" && event.button !== 1) return;
      const target = viewTarget(anchor.getAttribute("href") ?? "", this.hooks.doc().dir);
      if (target.kind === "fragment") {
        const el = doc.getElementById(target.id) ?? doc.getElementsByName(target.id)[0];
        el?.scrollIntoView({ block: "start" });
      } else if (target.kind === "external") this.hooks.openExternal(target.url);
      else if (target.kind === "doc") this.hooks.openDoc(target.path);
    };
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("auxclick", onClick, true);
  }

  /** 스크립트 허용 frame의 도우미 메시지 — 페이지 스크립트도 같은 모양을 보낼 수 있으니 값을 믿지 않는다 */
  receive(data: unknown): void {
    if (typeof data !== "object" || data === null || (data as { frond?: unknown }).frond !== 1) return;
    const message = data as Record<string, unknown>;
    if (message.type === "key") {
      const str = (v: unknown): string => (typeof v === "string" ? v.slice(0, 32) : "");
      const flag = (v: unknown): boolean => v === true;
      this.hooks.onKeydown(
        new KeyboardEvent("keydown", {
          key: str(message.key),
          code: str(message.code),
          ctrlKey: flag(message.ctrlKey),
          shiftKey: flag(message.shiftKey),
          altKey: flag(message.altKey),
          metaKey: flag(message.metaKey),
        }),
      );
    } else if (message.type === "link" && typeof message.href === "string" && this.token) {
      // 탭·외부 브라우저 열기는 사용자가 이 frame 안을 막 누른 때만 — 페이지 스크립트가 클릭 없이 보낸 메시지로 창·탭을 열지 않게.
      // 사용자 활성화는 창 전체 기준이라(frame 안 클릭도 부모에 전해지고, 앱 버튼 클릭도 5초 남는다) 포커스가 이 frame에 있는지도 본다
      const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
      if ((activation && !activation.isActive) || document.activeElement !== this.frame) return;
      const target = messageTarget(message.raw, message.href, this.hooks.doc().dir);
      if (target.kind === "doc") this.hooks.openDoc(target.path);
      else if (target.kind === "external") this.hooks.openExternal(target.url);
    }
  }

  /** 인쇄 — 안전 보기는 frame 문서를 바로, 스크립트 허용은 도우미에게 맡긴다 (둘 다 `allow-modals`) */
  print(): void {
    if (this.scripts) this.frame.contentWindow?.postMessage({ frond: 1, type: "print" }, "*");
    else this.frame.contentWindow?.print();
  }

  /** 다른 이름으로 저장 등으로 문서 경로가 바뀌었다 — 다음 렌더에서 새 폴더로 토큰을 다시 받는다 */
  reset(): void {
    if (this.token) void invoke("html_view_close", { token: this.token }).catch(() => undefined);
    this.token = null;
  }

  dispose(): void {
    this.disposed = true;
    views.delete(this);
    this.reset();
    this.frame.remove();
  }
}
