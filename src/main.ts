/**
 * 앱 셸 — 파일 열기 경로(argv·두 번째 인스턴스·드롭·Ctrl+O), 렌더 호출, 목차·상태바·줌·다크 모드.
 * 파일 읽기는 전부 Rust `load_document`(mdeditor-core)로 간다.
 */

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { renderMarkdown } from "./render";
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
const sidebar = $("#sidebar");
const toc = $("#toc");

let current: DocumentPayload | null = null;
let zoom = 1;

// ---- 열기 ---------------------------------------------------------------

async function openPath(path: string): Promise<void> {
  try {
    const doc = await invoke<DocumentPayload>("load_document", { path });
    current = doc;
    show(doc);
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

  const title = `${doc.name} — MdEditor`;
  document.title = title;
  void getCurrentWindow().setTitle(title);
  $("#status-path").textContent = doc.path;
  $("#status-path").title = doc.path;
  $("#status-encoding").textContent = doc.info.bom ? `${doc.info.encoding} BOM` : doc.info.encoding;
  $("#status-eol").textContent = doc.info.mixed_eol ? `${doc.info.eol} (혼합)` : doc.info.eol;
  $("#status-encoding").classList.toggle("warn", doc.info.lossy);
}

function showError(message: string): void {
  article.innerHTML = "";
  const p = document.createElement("p");
  p.className = "error";
  p.textContent = `열 수 없습니다: ${message}`;
  article.append(p);
  article.hidden = false;
  welcome.hidden = true;
}

async function pickAndOpen(): Promise<void> {
  const picked = await openDialog({
    multiple: false,
    directory: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "txt"] }],
  });
  if (typeof picked === "string") await openPath(picked);
}

// ---- 링크·이미지 ------------------------------------------------------------

article.addEventListener("click", (event) => {
  const a = (event.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
  if (!a) return;
  const href = a.getAttribute("href") ?? "";
  if (href.startsWith("#")) {
    event.preventDefault();
    document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView({ block: "start" });
    return;
  }
  event.preventDefault();
  if (/^(https?|mailto):/i.test(href)) {
    void openUrl(href);
  } else if (current && a.dataset.localPath) {
    void openPath(a.dataset.localPath);
  }
});

// ---- 줌·테마 ---------------------------------------------------------------

function applyZoom(next: number): void {
  zoom = Math.min(3, Math.max(0.5, Math.round(next * 10) / 10));
  article.style.setProperty("zoom", String(zoom));
  $("#status-zoom").textContent = `${Math.round(zoom * 100)}%`;
}

function toggleTheme(): void {
  const root = document.documentElement;
  const dark = root.dataset.theme === "dark" || (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  root.dataset.theme = dark ? "light" : "dark";
}

window.addEventListener("keydown", (event) => {
  if (event.isComposing) return;
  const ctrl = event.ctrlKey || event.metaKey;
  if (ctrl && event.key.toLowerCase() === "o") {
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
  } else if (ctrl && event.shiftKey && event.key.toLowerCase() === "d") {
    event.preventDefault();
    toggleTheme();
  } else if (ctrl && event.key === "\\") {
    event.preventDefault();
    sidebar.hidden = !sidebar.hidden;
  }
});

// ---- 열기 경로 연결 ---------------------------------------------------------

async function init(): Promise<void> {
  await listen<string[]>("open-file", (event) => {
    const [first] = event.payload;
    if (first) void openPath(first);
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
}

void init();
