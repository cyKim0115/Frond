/**
 * 앱 셸 — 파일 열기 경로(argv·두 번째 인스턴스·드롭·Ctrl+O·최근 파일), 렌더 호출, 목차·상태바·줌·다크 모드,
 * 외부 변경 리로드. 파일 읽기는 전부 Rust `load_document`(mdeditor-core)로 간다.
 * 제목 표시줄은 titlebar.ts, 탐색 영역은 nav.ts, 목차 폭은 resize.ts, 설정은 settings.ts(+ settings-dialog.ts).
 */

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { initNav } from "./nav";
import { highlightCodeBlocks, renderMarkdown } from "./render";
import { initSidebarResize } from "./resize";
import { getSetting, onSettingChange, setSetting, SETTING_KEYS, type SettingKey } from "./settings";
import { initSettingsDialog } from "./settings-dialog";
import { initTitlebar, setTitleText } from "./titlebar";
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
const app = $("#app");

let current: DocumentPayload | null = null;
let zoom = 1;
const IS_TAURI = "__TAURI_INTERNALS__" in window;
/** 브라우저 미리보기에서는 경로를 그대로 URL로 쓴다 (Vite가 프로젝트 파일을 서빙). `#`·공백은 조각으로 읽히지 않게 인코딩 */
const toAssetUrl = IS_TAURI
  ? convertFileSrc
  : (absPath: string) => absPath.split(/[\\/]/).map(encodeURIComponent).join("/");

// ---- 열기 ---------------------------------------------------------------

/** 브라우저 미리보기(`npm run dev`)에서는 Vite가 서빙하는 프로젝트 파일을 fetch로 읽는다 */
async function fetchDocument(path: string): Promise<DocumentPayload> {
  const res = await fetch(`/${path}`);
  // 없는 경로도 Vite SPA 폴백이 index.html(200)을 준다
  if (!res.ok || res.headers.get("content-type")?.includes("text/html")) throw new Error(`${path}: 찾을 수 없음`);
  const text = await res.text();
  const slash = path.lastIndexOf("/");
  return {
    path,
    dir: slash < 0 ? "" : path.slice(0, slash),
    name: path.slice(slash + 1),
    text,
    info: { encoding: "UTF-8", bom: false, eol: "LF", mixed_eol: false, final_newline: true, lossy: false, line_count: 0, byte_len: text.length },
    hash: "",
  };
}

const loadDocument = IS_TAURI
  ? (path: string) => invoke<DocumentPayload>("load_document", { path })
  : fetchDocument;

async function fileExists(path: string): Promise<boolean> {
  if (IS_TAURI) return invoke<boolean>("file_exists", { path });
  return fetchDocument(path).then(
    () => true,
    () => false,
  );
}

const nav = initNav({ open: (path) => openPath(path), exists: fileExists });

/** keepScroll이 있으면 같은 문서 리로드(F5·외부 변경) — 최근 목록 순서는 건드리지 않는다 */
async function openPath(path: string, keepScroll?: number): Promise<void> {
  try {
    const doc = await loadDocument(path);
    current = doc;
    show(doc);
    if (keepScroll !== undefined) viewer.scrollTop = keepScroll;
    else nav.remember(doc.path);
    hideBanner();
    if (IS_TAURI) await invoke("watch_document", { path: doc.path, hash: doc.hash });
  } catch (e) {
    showError(String(e));
  }
}

function show(doc: DocumentPayload): void {
  const { html, toc: entries } = renderMarkdown(doc.text, { baseDir: doc.dir, toAssetUrl });
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
  setTitleText(doc.name);
  if (IS_TAURI) void getCurrentWindow().setTitle(title);
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

// ---- 목차 -----------------------------------------------------------------------

// 이동은 scrollIntoView — 제목의 scroll-margin-top(설정 '제목 이동 시 위쪽 여백')만큼 위를 남긴다
toc.addEventListener("click", (event) => {
  const a = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
  if (!a) return;
  event.preventDefault();
  document.getElementById(decodeURIComponent(a.hash.slice(1)))?.scrollIntoView({ block: "start" });
});

let headingTick = 0;
function updateActiveHeading(): void {
  const links = toc.querySelectorAll<HTMLAnchorElement>("a[href]");
  if (links.length === 0) return;
  // 이동한 제목은 여백만큼 아래에 멈춘다 — 그 선까지 온 제목을 현재 제목으로 본다. 여백은 본문 줌을 따라 커진다
  const top = viewer.getBoundingClientRect().top + getSetting("headingScrollOffset") * zoom + 8;
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
  setSetting("theme", dark ? "light" : "dark");
}

// ---- 설정 적용 -------------------------------------------------------------------

function applySetting(key: SettingKey): void {
  const root = document.documentElement;
  if (key === "theme") {
    const theme = getSetting("theme");
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
  } else if (key === "bodyMaxWidth") {
    root.style.setProperty("--body-max-width", `${getSetting("bodyMaxWidth")}px`);
  } else if (key === "headingScrollOffset") {
    root.style.setProperty("--heading-scroll-offset", `${getSetting("headingScrollOffset")}px`);
    updateActiveHeading();
  }
}
SETTING_KEYS.forEach(applySetting);
onSettingChange(applySetting);
const settingsDialog = initSettingsDialog();
$("#open-settings").addEventListener("click", () => settingsDialog.open());

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
  } else if (ctrl && event.shiftKey && key === "e") {
    event.preventDefault();
    nav.toggle();
  } else if (ctrl && event.key === ",") {
    event.preventDefault();
    settingsDialog.open();
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

initSidebarResize();
// 저장된 열림 상태·폭을 적용한 첫 그림에서는 애니메이션을 끈다
requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("no-anim")));

if (IS_TAURI) {
  initTitlebar();
  void init();
} else {
  // Tauri 밖(브라우저에서 `npm run dev`)에서는 샘플을 직접 불러 렌더·테마를 눈으로 확인한다
  void openPath(new URLSearchParams(location.search).get("sample") ?? "samples/showcase.md");
}
