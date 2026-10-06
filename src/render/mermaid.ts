/**
 * Mermaid 다이어그램 (로드맵 4-1) — ```mermaid 펜스를 DOM에 넣은 뒤 SVG로 바꾼다.
 *
 * - `renderMarkdown`은 다른 펜스처럼 `<pre data-line><code class="language-mermaid" data-lang="mermaid">`만 낸다
 *   (DOMPurify가 `svg`를 막으므로 그림은 정화 뒤에 넣는다). 셸이 DOM에 넣은 뒤 `renderDiagrams(root, dark)`를 부른다
 * - 라이브러리는 `@mermaid-js/tiny`(마인드맵·아키텍처·KaTeX 라벨 뺀 단일 파일)를 **처음 만날 때만** 일반 스크립트로 싣는다.
 *   ESM 번들에 넣으면 IIFE가 모듈 스코프에 갇혀 `globalThis.mermaid`를 못 만든다. CSP `script-src 'self'` 안이다
 * - `securityLevel: "strict"` — 라벨 HTML·클릭 핸들러를 막고 Mermaid 자체 DOMPurify를 거친다
 * - 그린 그림은 원문을 `data-mermaid`에 남겨 테마(라이트·다크)가 바뀌면 다시 그린다. 문법 오류는 원문 코드 블록 아래에 알린다
 */

import mermaidUrl from "@mermaid-js/tiny/dist/mermaid.tiny.js?url";
import { sanitizeSvg } from "./sanitize";

interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  render(id: string, text: string): Promise<{ svg: string }>;
}


/** 그린 그림 상자 — 원문은 `data-mermaid`, 소스 줄은 원래 `<pre>`의 `data-line` */
export const DIAGRAM_CLASS = "mermaid-diagram";
const SOURCE_SELECTOR = 'pre > code[data-lang="mermaid"]';

/** 실은 라이브러리. `window.mermaid`를 직접 보지 않는다 — 문서의 `## Mermaid` 제목(`id="mermaid"`)이 이름으로 그 자리를 가린다(DOM clobbering) */
let api: MermaidApi | null = null;
let loading: Promise<MermaidApi> | null = null;
let configuredDark: boolean | null = null;
let seq = 0;
/** Mermaid render는 동시에 부르면 임시 요소가 엉킨다 — 한 줄로 세운다 */
let queue: Promise<unknown> = Promise.resolve();

function loadMermaid(): Promise<MermaidApi> {
  if (api) return Promise.resolve(api);
  loading ??= new Promise<MermaidApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = mermaidUrl;
    script.async = true;
    script.onload = () => {
      // 스크립트가 `globalThis.mermaid`에 진짜 속성을 만든다 — 그 뒤로는 같은 이름의 요소가 가리지 못한다
      const loaded = (globalThis as { mermaid?: unknown }).mermaid as MermaidApi | undefined;
      if (loaded && typeof loaded.initialize === "function" && typeof loaded.render === "function") {
        api = loaded;
        resolve(loaded);
      } else reject(new Error("Mermaid를 불러오지 못했습니다"));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Mermaid를 불러오지 못했습니다"));
    };
    document.head.append(script);
  });
  return loading;
}

function configure(mermaid: MermaidApi, dark: boolean): void {
  if (configuredDark === dark) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: dark ? "dark" : "default",
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--font-ui").trim() || undefined,
  });
  configuredDark = dark;
}

/** 문서에 Mermaid 펜스나 이미 그린 그림이 있는지 — 없으면 라이브러리를 싣지 않는다 */
export function hasDiagrams(root: ParentNode): boolean {
  return root.querySelector(`${SOURCE_SELECTOR}, .${DIAGRAM_CLASS}`) !== null;
}

/**
 * `root` 안의 Mermaid 펜스를 그림으로 바꾸고, 이미 그린 그림은 테마가 다르면 다시 그린다.
 * `isStale()`이 참이 되면(그사이 문서를 다시 그림) 남은 것을 건너뛴다
 */
export async function renderDiagrams(root: HTMLElement, dark: boolean, isStale: () => boolean = () => false): Promise<void> {
  if (!hasDiagrams(root)) return;
  let mermaid: MermaidApi;
  try {
    mermaid = await loadMermaid();
  } catch (e) {
    for (const code of root.querySelectorAll<HTMLElement>(SOURCE_SELECTOR)) showError(code.parentElement!, String(e));
    return;
  }
  const job = queue.then(async () => {
    configure(mermaid, dark);
    const targets: { el: HTMLElement; source: string }[] = [];
    for (const code of root.querySelectorAll<HTMLElement>(SOURCE_SELECTOR)) targets.push({ el: code.parentElement!, source: code.textContent ?? "" });
    for (const box of root.querySelectorAll<HTMLElement>(`.${DIAGRAM_CLASS}`)) {
      if (box.dataset.theme !== (dark ? "dark" : "light")) targets.push({ el: box, source: box.dataset.mermaid ?? "" });
    }
    for (const { el, source } of targets) {
      if (isStale()) return;
      if (!el.isConnected) continue;
      try {
        const { svg } = await mermaid.render(`mermaid-${++seq}`, source);
        const box = document.createElement("div");
        box.className = DIAGRAM_CLASS;
        box.dataset.mermaid = source;
        box.dataset.theme = dark ? "dark" : "light";
        if (el.dataset.line !== undefined) box.dataset.line = el.dataset.line;
        box.innerHTML = sanitizeSvg(svg);
        el.replaceWith(box);
      } catch (e) {
        // render가 실패하면 Mermaid가 body에 남긴 임시 요소를 치운다
        document.getElementById(`dmermaid-${seq}`)?.remove();
        if (el.classList.contains(DIAGRAM_CLASS)) continue; // 테마만 다시 그리다 실패 — 예전 그림을 둔다
        showError(el, e instanceof Error ? e.message : String(e));
      }
    }
  });
  queue = job.catch(() => undefined);
  await job;
}

function showError(pre: HTMLElement, message: string): void {
  if (pre.nextElementSibling?.classList.contains("mermaid-error")) return;
  const note = document.createElement("p");
  note.className = "mermaid-error";
  note.textContent = `Mermaid 다이어그램을 그리지 못했습니다: ${message.split("\n")[0]}`;
  pre.after(note);
}
