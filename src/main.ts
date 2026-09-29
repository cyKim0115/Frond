/**
 * 앱 셸 — 파일 열기 경로(argv·두 번째 인스턴스·드롭·Ctrl+O), 렌더 호출, 목차·상태바·줌·다크 모드,
 * 외부 변경 리로드. 파일 읽기는 전부 Rust `load_document`(mdeditor-core)로 간다.
 */

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { highlightCodeBlocks, renderMarkdown } from "./render";
import "./style.css";
import "./theme/index.css";

interface DocumentInfo {
  encoding: string;
  bom: boolean;
  eol: string;
  mixed_eol: boolean;
  final_newline: boolean;
  lossy: boolean;
  line_count: number;
  byte_len: number;
}
interface DocumentPayload {
  path: string;
  dir: string;
  name: string;
  text: string;
  info: DocumentInfo;
  hash: string;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const viewer = $("#viewer");
const article = $<HTMLElement>("#document");
const welcome = $("#welcome");
const banner = $("#banner");
const sidebar = $("#sidebar");
const toc = $("#toc");
const statusDefault = $<HTMLButtonElement>("#status-default");

let current: DocumentPayload | null = null;
let zoom = 1;

// ---- 열기 ---------------------------------------------------------------

async function openPath(path: string, keepScroll?: number): Promise<void> {
  try {
    const doc = await invoke<DocumentPayload>("load_document", { path });
    current = doc;
    show(doc);
    if (keepScroll !== undefined) viewer.scrollTop = keepScroll;
    hideBanner();
    await invoke("watch_document", { path: doc.path, hash: doc.hash });
  } catch (e) {
    showError(String(e));
  }
}

function show(doc: DocumentPayload): void {
  const { html, toc: entries } = renderMarkdown(doc.text, {
    baseDir: doc.dir,
    toAssetUrl: convertFileSrc,
  });
  article.innerHTML = html;
  article.hidden = false;
  welcome.hidden = true;
  viewer.scrollTop = 0;
  // 2 MB(스펙 largeSoftLimit)를 넘는 문서는 하이라이트를 생략해 첫 렌더를 지킨다
  if (doc.info.byte_len <= 2 * 1024 * 1024) void highlightCodeBlocks(article);

  toc.replaceChildren(
    ...entries.map((e) => {
      const a = document.createElement("a");
      a.href = `#${e.id}`;
      a.textContent = e.text;
      a.dataset.level = String(e.level);
      return a;
    }),
  );
  sidebar.hidden = entries.length === 0;
  updateActiveHeading();

  const title = `${doc.name} — MdEditor`;
  document.title = title;
  void getCurrentWindow().setTitle(title);
  $("#status-path").textContent = doc.path;
  $("#status-path").title = doc.path;
  $("#status-encoding").textContent = doc.info.bom ? `${doc.info.encoding} BOM` : doc.info.encoding;
  $("#status-encoding").classList.toggle("warn", doc.info.lossy);
  $("#status-encoding").title = doc.info.lossy ? "일부 바이트를 해석하지 못했습니다 (손실 디코드)" : "";
  $("#status-eol").textContent = doc.info.mixed_eol ? `${doc.info.eol} (혼합)` : doc.info.eol;
}

function showError(message: string): void {
  article.replaceChildren();
  const p = document.createElement("p");
  p.className = "error";
  p.textContent = `열 수 없습니다: ${message}`;
  article.append(p);
  article.hidden = false;
  welcome.hidden = true;
}

function showBanner(message: string): void {
  banner.textContent = message;
  banner.hidden = false;
}

function hideBanner(): void {
  banner.hidden = true;
}

async function pickAndOpen(): Promise<void> {
  const picked = await openDialog({
    multiple: false,
    directory: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mkdn", "mdwn", "txt"] }],
  });
  if (typeof picked === "string") await openPath(picked);
}

// ---- 링크 ------------------------------------------------------------------

article.addEventListener("click", (event) => {
  // 로컬 .md 링크는 DOMPurify가 href를 떼도 data-local-path로 열린다
  const a = (event.target as HTMLElement).closest("a[href], a[data-local-path]") as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute("href") ?? "";
  event.preventDefault();
  if (a.dataset.localPath) {
    void openPath(a.dataset.localPath);
  } else if (href.startsWith("#")) {
    document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ block: "start" });
  } else if (/^(https?|mailto):/i.test(href)) {
    void openUrl(href);
  }
});

// ---- 목차 활성 제목 ---------------------------------------------------------

let headingTick = 0;
function updateActiveHeading(): void {
  const links = toc.querySelectorAll<HTMLAnchorElement>("a[href]");
  if (links.length === 0) return;
  const top = viewer.getBoundingClientRect().top + 8;
  let activeId = "";
  for (const h of article.querySelectorAll<HTMLElement>("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]")) {
    if (h.getBoundingClientRect().top <= top) activeId = h.id;
    else break;
  }
  for (const link of links) {
    link.classList.toggle("active", decodeURIComponent(link.hash.slice(1)) === activeId);
  }
}
viewer.addEventListener("scroll", () => {
  if (headingTick) return;
  headingTick = requestAnimationFrame(() => {
    headingTick = 0;
    updateActiveHeading();
  });
});

// ---- 줌·테마·단축키 ----------------------------------------------------------

function applyZoom(next: number): void {
  zoom = Math.min(3, Math.max(0.5, Math.round(next * 10) / 10));
  article.style.setProperty("zoom", String(zoom));
  $("#status-zoom").textContent = `${Math.round(zoom * 100)}%`;
}

function toggleTheme(): void {
  const root = document.documentElement;
  const dark =
    root.dataset.theme === "dark" ||
    (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "light" : "dark";
}

window.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  const ctrl = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (ctrl && key === "o") {
    event.preventDefault();
    void pickAndOpen();
  } else if (ctrl && (event.key === "=" || event.key === "+")) {
    event.preventDefault();
    applyZoom(zoom + 0.1);
  } else if (ctrl && event.key === "-") {
    event.preventDefault();
    applyZoom(zoom - 0.1);
  } else if (ctrl && event.key === "0") {
    event.preventDefault();
    applyZoom(1);
  } else if (ctrl && event.shiftKey && key === "d") {
    event.preventDefault();
    toggleTheme();
  } else if (ctrl && event.key === "\\") {
    event.preventDefault();
    sidebar.hidden = !sidebar.hidden;
  } else if (key === "f5" && current) {
    event.preventDefault();
    void openPath(current.path, viewer.scrollTop);
  }
});

// ---- 기본 앱 (1-6) -----------------------------------------------------------

async function refreshDefaultAppStatus(): Promise<void> {
  try {
    const progId = await invoke<string | null>("query_default_app");
    const isDefault = progId === "MdEditor.Markdown";
    statusDefault.hidden = isDefault;
    statusDefault.title = progId ? `현재 .md 기본 앱: ${progId}` : "현재 .md 기본 앱이 없습니다";
  } catch {
    // 설치 모듈이 아직 없거나(개발 실행) 조회 실패 — 버튼을 숨긴다
    statusDefault.hidden = true;
  }
}
statusDefault.addEventListener("click", () => {
  void invoke("open_default_apps_settings").catch((e) => showBanner(`설정을 열 수 없습니다: ${e}`));
});
window.addEventListener("focus", () => void refreshDefaultAppStatus());

// ---- 열기 경로 연결 ---------------------------------------------------------

async function init(): Promise<void> {
  await listen<string[]>("open-file", (event) => {
    const [first] = event.payload;
    if (first) void openPath(first);
  });

  await listen<{ path: string; hash: string }>("file-changed", (event) => {
    if (!current || event.payload.path.toLowerCase() !== current.path.toLowerCase()) return;
    void openPath(current.path, viewer.scrollTop);
  });

  await listen<string>("file-missing", () => {
    showBanner("파일이 삭제되거나 이동됐습니다. 마지막으로 읽은 내용을 보여 줍니다.");
  });

  await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "over" || event.payload.type === "enter") {
      viewer.classList.add("drag-over");
    } else if (event.payload.type === "drop") {
      viewer.classList.remove("drag-over");
      const [first] = event.payload.paths;
      if (first) void openPath(first);
    } else {
      viewer.classList.remove("drag-over");
    }
  });

  const pending = await invoke<string[]>("take_pending_paths");
  if (pending[0]) await openPath(pending[0]);
  void refreshDefaultAppStatus();
}

/** Tauri 밖(브라우저에서 `npm run dev`)에서는 샘플을 직접 불러 렌더·테마를 눈으로 확인한다 */
async function initBrowserPreview(): Promise<void> {
  const file = new URLSearchParams(location.search).get("sample") ?? "samples/showcase.md";
  const text = await (await fetch(`/${file}`)).text();
  const name = file.split("/").pop() ?? file;
  show({
    path: file,
    dir: file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "",
    name,
    text,
    info: { encoding: "UTF-8", bom: false, eol: "LF", mixed_eol: false, final_newline: true, lossy: false, line_count: 0, byte_len: text.length },
    hash: "",
  });
}

if ("__TAURI_INTERNALS__" in window) {
  void init();
} else {
  void initBrowserPreview();
}
