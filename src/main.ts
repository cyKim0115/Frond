/**
 * 앱 셸 — 파일 열기 경로(argv·두 번째 인스턴스·드롭·Ctrl+O·최근 파일), 보기(렌더)·소스(CM6) 모드, 저장·초안,
 * 목차·상태바·줌·테마, 외부 변경. 파일 읽기·쓰기는 전부 Rust 커맨드(mdeditor-core)로 간다 — fs 플러그인 금지.
 * 제목 표시줄은 titlebar.ts, 탐색 영역은 nav.ts, 목차 폭은 resize.ts, 설정은 settings.ts(+ settings-dialog.ts),
 * 소스 편집기는 editor.ts, 보기 모드 찾기는 find.ts, 테마는 theme/themes.ts.
 *
 * 문서 상태: `current`는 디스크 기준(연 때·마지막 저장 때의 텍스트·해시·메타). 편집 중인 텍스트는 편집기에만 있고
 * `dirty`가 둘의 차이를 나타낸다. 저장은 `current.hash`를 etag로 넘겨 그 사이 바뀐 파일을 덮어쓰지 않는다(save.rs).
 */

import type { StateEffect, Text } from "@codemirror/state";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { showChoice, showDialog } from "./dialog";
import { createSourceEditor, type SourceEditor } from "./editor";
import { initFindBar } from "./find";
import { initNav } from "./nav";
import { docTitle, samePath } from "./recent";
import { highlightCodeBlocks, LARGE_SOFT_LIMIT, renderMarkdown, type TocEntry } from "./render";
import { initSidebarResize } from "./resize";
import { getSetting, onSettingChange, setSetting, SETTING_KEYS, type SettingKey } from "./settings";
import { initSettingsDialog } from "./settings-dialog";
import { applyTheme, findTheme, registerColorTokens, resolveTheme, type ThemeDef, themeTransitionCss } from "./theme/themes";
import { createThemePanel } from "./theme-panel";
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
  /** 디스크 기준 LF 텍스트 — 저장하면 저장한 텍스트로 바뀐다 */
  text: string;
  info: DocumentInfo;
  /** 디스크 바이트의 blake3 — 저장 etag */
  hash: string;
}
interface SavedPayload {
  hash: string;
  info: DocumentInfo;
}
/** save.rs `SaveFailure` */
type SaveFailure =
  | { kind: "conflict"; missing: boolean }
  | { kind: "unmappable"; ch: string; line: number; col: number; encoding: string }
  | { kind: "lossy" }
  | { kind: "io"; message: string };
interface Draft {
  path: string;
  text: string;
  base_hash: string;
  saved_at: number;
}
type Mode = "view" | "source";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const viewer = $("#viewer");
const article = $<HTMLElement>("#document");
const editorHost = $("#editor");
const welcome = $("#welcome");
const banner = $("#banner");
const sidebar = $("#sidebar");
const toc = $("#toc");
const statusDefault = $<HTMLButtonElement>("#status-default");
const statusMode = $<HTMLButtonElement>("#status-mode");
const statusEncoding = $<HTMLButtonElement>("#status-encoding");
const statusEol = $<HTMLButtonElement>("#status-eol");
const app = $("#app");

const IS_TAURI = "__TAURI_INTERNALS__" in window;
/** 브라우저 미리보기에서는 경로를 그대로 URL로 쓴다 (Vite가 프로젝트 파일을 서빙). `#`·공백은 조각으로 읽히지 않게 인코딩 */
const toAssetUrl = IS_TAURI
  ? convertFileSrc
  : (absPath: string) => absPath.split(/[\\/]/).map(encodeURIComponent).join("/");

let current: DocumentPayload | null = null;
/** "해석만 바꾸기"로 고른 인코딩 — 같은 문서를 다시 읽을 때도 유지한다 */
let forcedEncoding: string | undefined;
let mode: Mode = "view";
let editor: SourceEditor | null = null;
/** 편집기가 지금 담고 있는 문서 경로 — 다른 문서를 열면 null(편집기 내용이 낡음) */
let editorDocPath: string | null = null;
/** 편집기 기준 "저장된 내용" — 이것과 같으면 dirty가 아니다 */
let savedDoc: Text | null = null;
let dirty = false;
/** 보기 모드에 마지막으로 그린 텍스트 — 같으면 모드 전환 때 다시 그리지 않는다 */
let renderedText: string | null = null;
/**
 * 소스 → 보기로 나갈 때 남긴 편집기 자리. 커서·선택은 편집기 상태에 그대로 남아 있으니 스크롤만 따로 둔다.
 * 편집기에 문서를 새로 올리면(`loadEditor`) 버린다 — 그때는 되살릴 자리가 없다
 */
let sourceMemo: { scroll: StateEffect<unknown>; viewLine: number } | null = null;
let tocEntries: TocEntry[] = [];
let zoom = 1;

// ---- 읽기 -----------------------------------------------------------------------

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

function loadDocument(path: string, encoding?: string): Promise<DocumentPayload> {
  return IS_TAURI ? invoke<DocumentPayload>("load_document", { path, encoding: encoding ?? null }) : fetchDocument(path);
}

async function fileExists(path: string): Promise<boolean> {
  if (IS_TAURI) return invoke<boolean>("file_exists", { path });
  return fetchDocument(path).then(
    () => true,
    () => false,
  );
}

const nav = initNav({ open: (path) => openPath(path).then(() => undefined), exists: fileExists });

/** 편집 중인 텍스트 (소스 모드에 한 번도 안 들어갔으면 디스크 텍스트) */
function workingText(): string {
  if (!current) return "";
  return editor && editorDocPath === current.path ? editor.getText() : current.text;
}

/**
 * 다른 문서를 연다 (argv·최근 파일·링크·Ctrl+O·드롭). 수정 중이면 저장 여부를 먼저 묻는다.
 * 같은 문서를 디스크에서 다시 읽을 때는 `reload()`.
 */
async function openPath(path: string, options: { skipConfirm?: boolean } = {}): Promise<boolean> {
  if (current && samePath(current.path, path) && !options.skipConfirm) return reload();
  if (!options.skipConfirm && !(await confirmLeave())) return false;
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(path);
  } catch (e) {
    showError(String(e));
    return false;
  }
  forcedEncoding = undefined;
  hideBanner();
  adopt(doc, getSetting("openMode") === "source" ? "source" : "view");
  nav.remember(doc.path, titleOf(doc.text));
  if (IS_TAURI) await invoke("watch_document", { path: doc.path, hash: doc.hash });
  await offerDraft(doc);
  return true;
}

/** 같은 문서를 디스크에서 다시 읽는다 (F5·외부 변경·"다시 읽기"·인코딩 다시 열기). 보던 위치를 지킨다 */
async function reload(options: { discard?: boolean; encoding?: string } = {}): Promise<boolean> {
  if (!current) return false;
  if (!options.discard && !(await confirmLeave("reload"))) return false;
  const encoding = options.encoding ?? forcedEncoding;
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(current.path, encoding);
  } catch (e) {
    showBanner(`다시 읽을 수 없습니다: ${e}`, [], true);
    return false;
  }
  forcedEncoding = encoding;
  const scrollTop = viewer.scrollTop;
  const line = mode === "source" && editor ? editor.topLine() : null;
  const cursor = mode === "source" && editor ? editor.view.state.selection.main.head : null;
  hideBanner();
  adopt(doc, mode);
  if (mode === "view") viewer.scrollTop = scrollTop;
  else if (editor && line !== null) {
    editor.scrollToLine(line);
    if (cursor !== null) editor.view.dispatch({ selection: { anchor: Math.min(cursor, editor.view.state.doc.length) } });
  }
  nav.retitle(doc.path, titleOf(doc.text));
  if (IS_TAURI) await invoke("watch_document", { path: doc.path, hash: doc.hash });
  return true;
}

/** 디스크에서 읽은 문서를 화면에 올린다 — 편집 상태는 버린다 */
function adopt(doc: DocumentPayload, nextMode: Mode): void {
  current = doc;
  editorDocPath = null;
  savedDoc = null;
  renderedText = null;
  setDirty(false);
  if (nextMode === "source") {
    loadEditor(doc.text);
    renderView(doc.text);
    showMode("source");
  } else {
    renderView(doc.text);
    showMode("view");
  }
  updateDocChrome();
}

/** 제목(front matter title → 첫 H1) — 큰 문서는 파싱을 아끼고 파일 이름만 쓴다 */
function titleOf(text: string): string | undefined {
  if (text.length > LARGE_SOFT_LIMIT / 2) return tocEntries.length ? docTitle(tocEntries) : undefined;
  const result = renderMarkdown(text, { baseDir: "", toAssetUrl: (p) => p });
  return docTitle(result.toc, result.frontMatter);
}

// ---- 보기 모드 (렌더) --------------------------------------------------------------

function renderView(text: string): void {
  if (!current) return;
  // 2 MB(스펙 largeSoftLimit)를 넘는 문서는 하이라이트를 생략하고, 이미지는 지연 로드,
  // 큰 문서 모드(화면 밖 레이아웃 생략·패널 애니메이션 끔)로 그린다
  const large = current.info.byte_len > LARGE_SOFT_LIMIT || text.length > LARGE_SOFT_LIMIT;
  const result = renderMarkdown(text, { baseDir: current.dir, toAssetUrl, lazyImages: large });
  app.classList.toggle("large-doc", large);
  article.innerHTML = result.html;
  article.hidden = false;
  welcome.hidden = true;
  viewer.scrollTop = 0;
  if (!large) void highlightCodeBlocks(article);
  renderedText = text;
  tocEntries = result.toc;

  tocLinks.clear();
  activeLink = null;
  toc.replaceChildren(
    ...result.toc.map((e) => {
      const a = document.createElement("a");
      a.href = `#${e.id}`;
      a.textContent = e.text;
      a.dataset.level = String(e.level);
      a.dataset.line = String(e.line);
      tocLinks.set(e.id, a);
      return a;
    }),
  );
  headings = Array.from(article.querySelectorAll<HTMLElement>("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]"));
  sidebar.hidden = result.toc.length === 0;
  updateActiveHeading();
  findBar.refresh();
}

/** 보기 화면 맨 위 블록의 소스 줄 (0 기준) */
function viewTopLine(): number {
  return viewLineRange().top;
}

/** 보기 화면에 보이는 소스 줄 범위 `[top, bottom)` (0 기준). 마지막 블록까지 보이면 bottom은 Infinity */
function viewLineRange(): { top: number; bottom: number } {
  const rect = viewer.getBoundingClientRect();
  let top: number | null = null;
  for (const el of article.children as HTMLCollectionOf<HTMLElement>) {
    if (el.dataset.line === undefined) continue;
    const box = el.getBoundingClientRect();
    if (top === null && box.bottom > rect.top + 4) top = Number(el.dataset.line);
    else if (top !== null && box.top >= rect.bottom) return { top, bottom: Number(el.dataset.line) };
  }
  return { top: top ?? 0, bottom: Infinity };
}

/** 소스 줄 `line`(0 기준) 이하에서 시작하는 마지막 최상위 블록을 화면 맨 위로 */
function scrollViewToLine(line: number): void {
  const blocks = Array.from(article.children as HTMLCollectionOf<HTMLElement>).filter((el) => el.dataset.line !== undefined);
  let lo = 0;
  let hi = blocks.length - 1;
  let hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (Number(blocks[mid].dataset.line) <= line) {
      hit = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (hit < 0) viewer.scrollTop = 0;
  else blocks[hit].scrollIntoView({ block: "start" });
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

// ---- 소스 모드 (CM6, 로드맵 2-1) ---------------------------------------------------

function ensureEditor(): SourceEditor {
  if (editor) return editor;
  editor = createSourceEditor(editorHost, { onChange: onEditorChange, onPasteImages: pasteImages });
  editor.setLineWrapping(getSetting("editorLineWrap") === "wrap");
  editor.view.scrollDOM.addEventListener("scroll", () => {
    if (headingTick) return;
    headingTick = requestAnimationFrame(() => {
      headingTick = 0;
      updateActiveHeading();
    });
  });
  return editor;
}

/** 편집기에 텍스트를 올린다. 디스크 텍스트와 다르면(초안 복구) 바로 dirty */
function loadEditor(text: string): void {
  if (!current) return;
  const ed = ensureEditor();
  ed.setText(current.text);
  savedDoc = ed.view.state.doc;
  if (text !== current.text) ed.view.dispatch({ changes: { from: 0, to: ed.view.state.doc.length, insert: text } });
  // 손실 디코드 문서는 저장할 수 없으니 편집도 막는다 (스펙 경계 사례)
  ed.setReadOnly(current.info.lossy);
  editorDocPath = current.path;
  sourceMemo = null;
  setDirty(text !== current.text);
}

function showMode(next: Mode): void {
  mode = next;
  viewer.hidden = next !== "view";
  editorHost.hidden = next !== "source";
  statusMode.hidden = !current;
  statusMode.textContent = next === "source" ? "소스" : "보기";
  if (next === "source") findBar.close();
}

/**
 * 보기 → 소스로 돌아올 때 커서를 어디에 둘지 (`sourceMemo`가 있을 때만 묻는다)
 * - "restore": 떠날 때의 커서·선택과 편집기 스크롤을 그대로 되살린다
 * - "keep-cursor": 커서·선택은 되살리고, 편집기 스크롤만 보기 화면 위치(viewTop)에 맞춘다
 * - "follow": 커서를 보기 화면 맨 위 줄 첫머리로 옮긴다 (예전 동작)
 *
 * @param cursorLine 떠날 때 커서가 있던 줄
 * @param leftAt     보기로 넘어온 직후 보기 화면 맨 위 줄
 * @param viewTop    지금 보기 화면에 보이는 줄 범위 [viewTop, viewBottom). 마지막까지 보이면 viewBottom은 Infinity
 * 줄은 모두 0 기준 소스 줄. 보기 화면은 최상위 블록 단위라 viewTop은 블록 시작 줄이다
 */
function cursorReturn(cursorLine: number, leftAt: number, viewTop: number, viewBottom: number): "restore" | "keep-cursor" | "follow" {
  // 보기에서 움직이지 않았으면 떠날 때 그대로. 움직였어도 커서 줄이 보이는 범위 안이면 커서는 살리고 화면만 따라간다
  if (viewTop === leftAt) return "restore";
  if (cursorLine >= viewTop && cursorLine < viewBottom) return "keep-cursor";
  return "follow";
}

/** Ctrl+/ — 보던 위치를 `data-line`으로 맞춰 오간다 (T1). 보기에서 크게 움직이지 않았으면 커서도 되살린다 */
function setMode(next: Mode): void {
  if (!current || next === mode) return;
  if (next === "source") {
    // 보기 화면은 숨기기 전에 잰다
    const range = viewLineRange();
    if (editorDocPath !== current.path) loadEditor(current.text);
    const memo = sourceMemo;
    sourceMemo = null;
    showMode("source");
    const ed = editor!;
    // 숨겨져 있던 편집기는 크기를 다시 재야 한다. scrollIntoView 효과는 그 측정 때 반영된다
    ed.view.requestMeasure();
    const { state } = ed.view;
    const choice = memo ? cursorReturn(state.doc.lineAt(state.selection.main.head).number - 1, memo.viewLine, range.top, range.bottom) : "follow";
    if (choice === "restore") ed.view.dispatch({ effects: memo!.scroll });
    // follow면 커서도 보던 줄로 — 바로 입력하면 보던 자리에 들어간다
    else ed.scrollToLine(range.top, choice === "follow");
    ed.focus();
  } else {
    const line = editor ? editor.topLine() : 0;
    // 편집기는 숨겨지면 스크롤을 잃는다 — 문서 위치 기준 스냅샷으로 남긴다
    const scroll = editor && editorDocPath === current.path ? editor.view.scrollSnapshot() : null;
    const text = workingText();
    if (text !== renderedText) renderView(text);
    showMode("view");
    scrollViewToLine(line);
    sourceMemo = scroll ? { scroll, viewLine: viewTopLine() } : null;
    viewer.focus({ preventScroll: true });
  }
}

let dirtyTimer = 0;
let previewTimer = 0;
function onEditorChange(): void {
  // 첫 입력은 바로 표시하고, 되돌리기로 원래대로 돌아왔는지는 잠시 뒤 정확히 잰다
  if (!dirty) setDirty(true);
  window.clearTimeout(dirtyTimer);
  dirtyTimer = window.setTimeout(() => {
    if (editor && savedDoc) setDirty(!editor.view.state.doc.eq(savedDoc));
  }, 250);
  // 작은 문서는 목차·보기 화면을 편집을 따라 갱신한다 (큰 문서는 보기로 돌아갈 때 한 번)
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(() => {
    if (!current || !editor) return;
    const text = editor.getText();
    if (text.length <= LARGE_SOFT_LIMIT / 4 && text !== renderedText) {
      const keep = viewer.scrollTop;
      renderView(text);
      viewer.scrollTop = keep;
      updateActiveHeading();
    }
  }, 700);
}

function setDirty(next: boolean): void {
  dirty = next;
  updateTitle();
}

// ---- 붙여넣기·끌어다 놓기 이미지 (2-5) ---------------------------------------------------

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

/** 마크다운 이미지 경로 — 공백·괄호가 있으면 꺾쇠로 감싼다 (렌더러 links.ts가 읽는 형태) */
function markdownImage(alt: string, rel: string): string {
  return /[\s()<>]/.test(rel) ? `![${alt}](<${rel}>)` : `![${alt}](${rel})`;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

async function pasteImages(files: File[]): Promise<string | null> {
  if (!current) return null;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 이미지를 저장할 수 없습니다.");
    return null;
  }
  const links: string[] = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) continue;
    const stem = `image-${timestamp()}`;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const rel = await invoke<string>("save_pasted_image", bytes, {
        headers: { "x-doc-dir": encodeURIComponent(current.dir), "x-stem": encodeURIComponent(stem), "x-ext": ext },
      });
      links.push(markdownImage("", rel));
    } catch (e) {
      showBanner(`이미지를 저장하지 못했습니다: ${e}`, [], true);
    }
  }
  return links.length ? links.join("\n") : null;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

async function dropImages(paths: string[], position: { x: number; y: number }): Promise<void> {
  if (!current || !editor) return;
  const at = editor.view.posAtCoords({ x: position.x / devicePixelRatio, y: position.y / devicePixelRatio });
  if (at !== null) editor.view.dispatch({ selection: { anchor: at } });
  const links: string[] = [];
  for (const source of paths) {
    try {
      const rel = await invoke<string>("copy_image_to_assets", { docDir: current.dir, source });
      const alt = source.replace(/^.*[\\/]/, "").replace(IMAGE_EXT_RE, "");
      links.push(markdownImage(alt, rel));
    } catch (e) {
      showBanner(`이미지를 복사하지 못했습니다: ${e}`, [], true);
    }
  }
  if (links.length) editor.insertAtCursor(links.join("\n"));
  editor.focus();
}

// ---- 저장 (2-2·2-3) -------------------------------------------------------------

/** 조합 중인 한글을 확정시킨다 — 저장·닫기 직전 (G17·G18) */
async function flushComposition(): Promise<void> {
  if (!editor?.view.composing) return;
  editor.view.contentDOM.blur();
  await new Promise((r) => setTimeout(r, 60));
}

interface SaveOptions {
  force?: boolean;
  convertTo?: string;
  bom?: boolean;
  /** 모든 줄의 줄바꿈을 이것으로 바꿔 저장한다 (`LF`·`CRLF`) */
  eol?: string;
}

/** Ctrl+S. 성공(또는 저장할 것 없음)이면 true */
async function save(options: SaveOptions = {}): Promise<boolean> {
  if (!current) return false;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 저장할 수 없습니다. 앱(npm run app:dev)에서 저장하세요.");
    return false;
  }
  await flushComposition();
  const doc = current;
  const text = workingText();
  if (!dirty && !options.force && !options.convertTo && !options.eol) {
    flashStatus("변경 없음");
    return true;
  }
  try {
    const saved = await invoke<SavedPayload>("save_document", {
      path: doc.path,
      text,
      expectedHash: doc.hash,
      force: options.force === true,
      convertTo: options.convertTo ?? null,
      bom: options.bom ?? null,
      eol: options.eol ?? null,
    });
    doc.text = text;
    doc.hash = saved.hash;
    doc.info = saved.info;
    if (options.convertTo) forcedEncoding = undefined;
    if (editor && editorDocPath === doc.path) savedDoc = editor.view.state.doc;
    setDirty(false);
    lastDraftText = null;
    void invoke("delete_draft", { path: doc.path }).catch(() => undefined);
    hideBanner();
    updateDocChrome();
    nav.retitle(doc.path, titleOf(text));
    flashStatus("저장됨");
    return true;
  } catch (error) {
    return handleSaveFailure(error as SaveFailure | string);
  }
}

async function handleSaveFailure(failure: SaveFailure | string): Promise<boolean> {
  if (typeof failure === "string" || !failure || typeof failure !== "object") {
    await showDialog({ title: "저장하지 못했습니다", message: String(failure) });
    return false;
  }
  switch (failure.kind) {
    case "conflict": {
      const choice = await showChoice({
        title: failure.missing ? "파일이 사라졌습니다" : "파일이 다른 곳에서 바뀌었습니다",
        message: failure.missing
          ? "연 뒤에 파일이 지워지거나 옮겨졌습니다. 이 내용으로 같은 자리에 다시 만들까요?"
          : "연 뒤에 다른 프로그램이 이 파일을 저장했습니다. 덮어쓰면 그 변경이 사라집니다.",
        detail: current?.path,
        choices: [
          { value: "save-as", label: "다른 이름으로 저장…" },
          { value: "force", label: failure.missing ? "다시 만들기" : "덮어쓰기", kind: failure.missing ? "primary" : "danger" },
        ],
        cancelLabel: "취소",
        focus: "save-as",
      });
      if (choice === "force") return save({ force: true });
      if (choice === "save-as") return saveAs();
      return false;
    }
    case "unmappable": {
      const ok = await showDialog({
        title: `${failure.encoding}로 저장할 수 없는 문자`,
        message: `"${failure.ch}" (${failure.line}행 ${failure.col}열)은 ${failure.encoding}에 없는 문자입니다. 파일을 UTF-8로 변환해 저장할까요? 다른 프로그램이 ${failure.encoding}을 기대하면 글자가 깨져 보일 수 있습니다.`,
        confirmLabel: "UTF-8로 변환해 저장",
        cancelLabel: "취소",
      });
      return ok ? save({ convertTo: "UTF-8", bom: false }) : false;
    }
    case "lossy":
      await showDialog({
        title: "읽기 전용 문서",
        message: "일부 바이트를 해석하지 못한 문서(손실 디코드)라 저장하면 원본이 망가집니다. 상태바의 인코딩을 눌러 맞는 인코딩으로 다시 여세요.",
      });
      return false;
    case "io":
      await showDialog({ title: "저장하지 못했습니다", message: failure.message });
      return false;
  }
}

/** Ctrl+Shift+S — 원래 파일의 인코딩·줄바꿈을 그대로 가져가 새 파일로 저장하고 그 파일로 옮겨 간다 */
async function saveAs(): Promise<boolean> {
  if (!current) return false;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 저장할 수 없습니다.");
    return false;
  }
  await flushComposition();
  const target = await saveDialog({
    defaultPath: current.path,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "txt"] }],
  });
  if (!target) return false;
  const text = workingText();
  const from = current.path;
  try {
    await invoke<SavedPayload>("save_document_as", { sourcePath: from, targetPath: target, text });
  } catch (error) {
    return handleSaveFailure(error as SaveFailure | string);
  }
  void invoke("delete_draft", { path: from }).catch(() => undefined);
  setDirty(false);
  const keepMode = mode;
  const opened = await openPath(target, { skipConfirm: true });
  if (opened && keepMode !== mode) setMode(keepMode);
  return opened;
}

/** 수정 중이면 저장할지 묻는다. 계속해도 되면 true */
async function confirmLeave(reason: "open" | "reload" | "close" = "open"): Promise<boolean> {
  if (!current || !dirty) return true;
  await flushComposition();
  const choice = await showChoice({
    title: "저장하지 않은 변경",
    message:
      reason === "reload"
        ? `${current.name}을(를) 디스크에서 다시 읽으면 편집한 내용이 사라집니다.`
        : `${current.name}의 변경 내용을 저장할까요?`,
    choices:
      reason === "reload"
        ? [{ value: "discard", label: "변경 버리고 다시 읽기", kind: "danger" }]
        : [
            { value: "discard", label: "저장 안 함", kind: "danger" },
            { value: "save", label: "저장", kind: "primary" },
          ],
    cancelLabel: "취소",
  });
  if (choice === "save") return save();
  if (choice === "discard") {
    void invoke("delete_draft", { path: current.path }).catch(() => undefined);
    lastDraftText = null;
    setDirty(false);
    return true;
  }
  return false;
}

// ---- 초안 백업 (2-4) ---------------------------------------------------------------

let draftTimer = 0;
let lastDraftText: string | null = null;

function scheduleDrafts(): void {
  window.clearInterval(draftTimer);
  const sec = getSetting("draftIntervalSec");
  if (sec > 0 && IS_TAURI) draftTimer = window.setInterval(() => void writeDraft(), sec * 1000);
}

async function writeDraft(): Promise<void> {
  if (!current || !dirty) return;
  const text = workingText();
  if (text === lastDraftText) return;
  try {
    await invoke("write_draft", { path: current.path, text, baseHash: current.hash });
    lastDraftText = text;
  } catch {
    // 초안은 보조 수단 — 실패해도 편집은 계속한다
  }
}

/** 연 문서에 초안이 남아 있으면 복구를 제안한다 */
async function offerDraft(doc: DocumentPayload): Promise<void> {
  if (!IS_TAURI) return;
  const draft = await invoke<Draft | null>("read_draft", { path: doc.path }).catch(() => null);
  if (!draft) return;
  if (draft.text === doc.text) {
    void invoke("delete_draft", { path: doc.path });
    return;
  }
  const when = new Date(draft.saved_at).toLocaleString("ko-KR");
  const changed = draft.base_hash !== doc.hash;
  const choice = await showChoice({
    title: "저장하지 않은 초안이 있습니다",
    message: `${when}에 남긴 편집 내용입니다. 복구하면 소스 모드에서 이어서 편집하고, 저장해야 파일에 반영됩니다.${
      changed ? " 초안을 남긴 뒤 파일도 바뀌었습니다 — 복구하면 파일의 새 내용 대신 초안이 편집기에 들어갑니다." : ""
    }`,
    detail: doc.path,
    choices: [
      { value: "discard", label: "초안 버리기", kind: "danger" },
      { value: "recover", label: "복구", kind: "primary" },
    ],
    cancelLabel: "나중에",
  });
  if (choice === "discard") void invoke("delete_draft", { path: doc.path });
  if (choice !== "recover" || !current || !samePath(current.path, doc.path)) return;
  loadEditor(draft.text);
  renderView(draft.text);
  showMode("source");
  editor?.focus();
  showBanner("초안을 복구했습니다. 저장(Ctrl+S)해야 파일에 반영됩니다.");
}

// ---- 상태바·제목 ----------------------------------------------------------------------

function updateTitle(): void {
  if (!current) return;
  const title = `${dirty ? "● " : ""}${current.name} — MdEditor`;
  document.title = title;
  setTitleText(current.name, dirty);
  if (IS_TAURI) void getCurrentWindow().setTitle(title);
}

function updateDocChrome(): void {
  if (!current) return;
  const { info } = current;
  updateTitle();
  $("#status-path").textContent = current.path;
  $("#status-path").title = current.path;
  statusEncoding.textContent = `${info.bom ? `${info.encoding} BOM` : info.encoding}${forcedEncoding ? " (지정)" : ""}`;
  statusEncoding.classList.toggle("warn", info.lossy);
  statusEncoding.title = info.lossy
    ? "일부 바이트를 해석하지 못했습니다 (손실 디코드, 읽기 전용) — 눌러서 다른 인코딩으로 다시 열기"
    : "인코딩 — 눌러서 다른 인코딩으로 다시 열기·변환";
  statusEol.textContent = info.mixed_eol ? `${info.eol} (혼합)` : info.eol;
  statusEol.title = info.mixed_eol
    ? `줄바꿈이 섞여 있습니다 (가장 많은 것: ${info.eol}) — 눌러서 한 가지로 변환`
    : "줄바꿈 — 눌러서 LF·CRLF로 변환";
}

let flashTimer = 0;
/** 상태바 경로 자리에 잠깐 알림을 띄운다 */
function flashStatus(message: string): void {
  const el = $("#status-path");
  el.textContent = message;
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => {
    if (current) el.textContent = current.path;
  }, 1600);
}

interface BannerAction {
  label: string;
  run: () => void;
}

function showBanner(message: string, actions: BannerAction[] = [], warn = false): void {
  $("#banner-text").textContent = message;
  $("#banner-actions").replaceChildren(
    ...actions.map((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a.label;
      b.addEventListener("click", a.run);
      return b;
    }),
  );
  banner.classList.toggle("warn", warn);
  banner.hidden = false;
}

function hideBanner(): void {
  // 배너 버튼으로 닫으면 누른 버튼이 숨으면서 포커스가 body로 빠진다 — 보던 화면으로 돌려 바로 이어서 입력하게
  const hadFocus = banner.contains(document.activeElement);
  banner.hidden = true;
  if (!hadFocus) return;
  if (mode === "source" && editor) editor.focus();
  else viewer.focus({ preventScroll: true });
}

/** 인코딩 메뉴 — "다시 열기"는 바이트를 두고 해석만(Encode in), "변환"은 저장 바이트를 바꾼다(Convert to) */
async function encodingMenu(): Promise<void> {
  if (!current) return;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 인코딩을 바꿀 수 없습니다.");
    return;
  }
  const now = statusEncoding.textContent ?? "";
  const choice = await showChoice({
    title: "인코딩",
    message: `지금: ${now}. 다시 열기는 파일을 그대로 두고 글자 해석만 바꿉니다(깨져 보일 때). 변환은 파일을 새 인코딩으로 바로 저장합니다.`,
    choices: [
      { value: "reopen:UTF-8", label: "UTF-8로 다시 열기" },
      { value: "reopen:EUC-KR", label: "EUC-KR(CP949)로 다시 열기" },
      { value: "reopen:UTF-16LE", label: "UTF-16LE로 다시 열기" },
      { value: "convert:UTF-8", label: "UTF-8로 변환해 저장" },
      { value: "convert:UTF-8:bom", label: "UTF-8 BOM으로 변환해 저장" },
    ],
    cancelLabel: "닫기",
    vertical: true,
  });
  if (!choice) return;
  const [action, label, bom] = choice.split(":");
  if (action === "reopen") {
    await reload({ encoding: label });
    return;
  }
  const ok = await showDialog({
    title: "인코딩 변환",
    message: `이 파일을 ${label}${bom ? " BOM" : ""}(으)로 변환해 저장합니다. 파일 바이트가 바뀝니다.`,
    confirmLabel: "변환해 저장",
    cancelLabel: "취소",
  });
  if (ok) await save({ convertTo: label, bom: bom === "bom" });
}

/** 줄바꿈 메뉴 — 모든 줄을 LF 또는 CRLF로 바꿔 바로 저장한다 (결정 D5). 평소 저장은 줄별 원래 줄바꿈을 지킨다 */
async function eolMenu(): Promise<void> {
  if (!current) return;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 줄바꿈을 바꿀 수 없습니다.");
    return;
  }
  const { info } = current;
  if (info.lossy) {
    showBanner("일부 바이트를 해석하지 못한 문서(손실 디코드)라 변환할 수 없습니다. 인코딩을 먼저 맞게 다시 여세요.", [], true);
    return;
  }
  const choice = await showChoice({
    title: "줄바꿈",
    message: `지금: ${statusEol.textContent}. 변환하면 모든 줄의 줄바꿈을 하나로 맞춰 파일을 바로 저장합니다. LF는 macOS·Linux·Git 저장소에서, CRLF는 Windows 메모장 등에서 흔히 씁니다.`,
    choices: [
      { value: "LF", label: "LF로 변환해 저장" },
      { value: "CRLF", label: "CRLF로 변환해 저장" },
    ],
    cancelLabel: "닫기",
    vertical: true,
  });
  if (!choice) return;
  if (!info.mixed_eol && info.eol === choice) {
    flashStatus(`이미 모든 줄이 ${choice}입니다`);
    return;
  }
  const ok = await showDialog({
    title: "줄바꿈 변환",
    message: `이 파일의 모든 줄바꿈을 ${choice}(으)로 바꿔 저장합니다. 파일 바이트가 바뀝니다.${dirty ? " 저장하지 않은 편집도 함께 저장됩니다." : ""}`,
    confirmLabel: "변환해 저장",
    cancelLabel: "취소",
  });
  if (ok) await save({ eol: choice });
}

statusEncoding.addEventListener("click", () => void encodingMenu());
statusEol.addEventListener("click", () => void eolMenu());
statusMode.addEventListener("click", () => setMode(mode === "view" ? "source" : "view"));

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

// 이동은 scrollIntoView — 제목의 scroll-margin-top(설정 '제목 이동 시 위쪽 여백')만큼 위를 남긴다. 소스 모드는 그 줄로
toc.addEventListener("click", (event) => {
  const a = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
  if (!a) return;
  event.preventDefault();
  if (mode === "source" && editor) {
    editor.scrollToLine(Number(a.dataset.line ?? 0));
    return;
  }
  document.getElementById(decodeURIComponent(a.hash.slice(1)))?.scrollIntoView({ block: "start" });
});

/** 문서 순서의 본문 제목과 목차 링크(제목 id → 링크). `renderView()`가 채운다 */
let headings: HTMLElement[] = [];
const tocLinks = new Map<string, HTMLAnchorElement>();
let activeLink: HTMLAnchorElement | null = null;

let headingTick = 0;
function updateActiveHeading(): void {
  let next: HTMLAnchorElement | null = null;
  if (mode === "source" && editor) {
    // 소스 모드: 화면 맨 위 줄 이하에서 시작한 마지막 제목
    const top = editor.topLine();
    let hit: TocEntry | undefined;
    for (const e of tocEntries) {
      if (e.line <= top) hit = e;
      else break;
    }
    next = hit ? (tocLinks.get(hit.id) ?? null) : null;
  } else {
    if (headings.length === 0) return;
    // 이동한 제목은 여백만큼 아래에 멈춘다 — 그 선까지 온 제목을 현재 제목으로 본다. 여백은 본문 줌을 따라 커진다
    const line = viewer.getBoundingClientRect().top + getSetting("headingScrollOffset") * zoom + 8;
    // 제목 위치는 문서 순서대로 커진다 — 선을 넘지 않은 첫 제목을 이진 탐색 (10 MB 샘플은 제목 2만 3천 개라 스크롤마다 전부 재면 끊긴다)
    let lo = 0;
    let hi = headings.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (headings[mid].getBoundingClientRect().top <= line) lo = mid + 1;
      else hi = mid;
    }
    next = lo > 0 ? (tocLinks.get(headings[lo - 1].id) ?? null) : null;
  }
  if (next === activeLink) return;
  activeLink?.classList.remove("active");
  next?.classList.add("active");
  activeLink = next;
}
viewer.addEventListener("scroll", () => {
  if (headingTick) return;
  headingTick = requestAnimationFrame(() => {
    headingTick = 0;
    updateActiveHeading();
  });
});

// ---- 찾기 (보기 모드, 2-5) ----------------------------------------------------------

const findBar = initFindBar(article, () => viewer.focus({ preventScroll: true }));

// ---- 줌·테마 ----------------------------------------------------------------------

function applyZoom(next: number): void {
  zoom = Math.min(3, Math.max(0.5, Math.round(next * 10) / 10));
  article.style.setProperty("zoom", String(zoom));
  editorHost.style.setProperty("--editor-zoom", String(zoom));
  editor?.view.requestMeasure();
  $("#status-zoom").textContent = `${Math.round(zoom * 100)}%`;
}

// 테마(S-2) — 설정 `theme`이 `system`이면 Windows 모드에 따라 라이트·다크 쌍(`themeLight`·`themeDark`) 중 하나
const systemDark = matchMedia("(prefers-color-scheme: dark)");

function effectiveTheme(): ThemeDef {
  const id = getSetting("theme");
  const wanted = id === "system" ? getSetting(systemDark.matches ? "themeDark" : "themeLight") : id;
  // 지워진 사용자 테마 등으로 못 찾으면 시스템 모드 쪽 내장 테마
  return findTheme(wanted) ?? findTheme(systemDark.matches ? "dark" : "light")!;
}

// 전환 연출(S-3): 보통 문서는 등록한 색 토큰(@property <color>)을 transition으로 보간하고, 큰 문서(노드 수십만)는
// 프레임마다 전체 스타일을 다시 계산하지 않도록 View Transitions 크로스페이드로 바꾼다. 첫 적용·0 ms·동작 줄이기는 즉시
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const canInterpolate = registerColorTokens();
let themeReady = false;
let themeAnimTimer = 0;

function themeTransitionMs(): number {
  return reducedMotion.matches ? 0 : getSetting("themeTransitionMs");
}

function applyEffectiveTheme(): void {
  const theme = resolveTheme(effectiveTheme());
  const ms = themeTransitionMs();
  const root = document.documentElement;
  if (!themeReady || ms === 0) {
    applyTheme(theme);
    return;
  }
  if (app.classList.contains("large-doc") && typeof document.startViewTransition === "function") {
    root.style.setProperty("--theme-transition-ms", `${ms}ms`);
    document.startViewTransition(() => applyTheme(theme));
    return;
  }
  if (!canInterpolate) {
    applyTheme(theme);
    return;
  }
  root.classList.add("theme-anim");
  applyTheme(theme);
  window.clearTimeout(themeAnimTimer);
  themeAnimTimer = window.setTimeout(() => root.classList.remove("theme-anim"), ms + 80);
}

function applyThemeTransition(): void {
  let style = document.getElementById("theme-anim") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "theme-anim";
    document.head.append(style);
  }
  style.textContent = themeTransitionCss(themeTransitionMs());
}
systemDark.addEventListener("change", () => {
  if (getSetting("theme") === "system") applyEffectiveTheme();
});
reducedMotion.addEventListener("change", applyThemeTransition);

/** Ctrl+Shift+D — 지금 테마의 반대쪽(라이트 ↔ 다크) 쌍 테마로 고정한다 */
function toggleTheme(): void {
  setSetting("theme", effectiveTheme().base === "dark" ? getSetting("themeLight") : getSetting("themeDark"));
}

// ---- 설정 적용 -------------------------------------------------------------------

function applySetting(key: SettingKey): void {
  const root = document.documentElement;
  if (key === "theme" || key === "themeLight" || key === "themeDark") {
    applyEffectiveTheme();
  } else if (key === "themeTransitionMs") {
    applyThemeTransition();
  } else if (key === "bodyMaxWidth") {
    root.style.setProperty("--body-max-width", `${getSetting("bodyMaxWidth")}px`);
    editor?.view.requestMeasure();
  } else if (key === "headingScrollOffset") {
    root.style.setProperty("--heading-scroll-offset", `${getSetting("headingScrollOffset")}px`);
    updateActiveHeading();
  } else if (key === "editorFontSize") {
    root.style.setProperty("--editor-font-size", `${getSetting("editorFontSize")}px`);
    editor?.view.requestMeasure();
  } else if (key === "editorLineWrap") {
    editor?.setLineWrapping(getSetting("editorLineWrap") === "wrap");
  } else if (key === "draftIntervalSec") {
    scheduleDrafts();
  }
}
SETTING_KEYS.forEach(applySetting);
themeReady = true; // 여기부터 테마 변경은 연출한다 — 시작 시 첫 적용은 즉시
onSettingChange(applySetting);
const settingsDialog = initSettingsDialog();
$("#open-settings").addEventListener("click", () => settingsDialog.open());

// 설정 '테마' 탭의 테마 목록·가져오기 (S-4). 폴더 목록이 바뀌면 선택지를 다시 채우고 적용 테마를 다시 고른다
const themePanel = createThemePanel({
  isTauri: IS_TAURI,
  currentThemeId: () => effectiveTheme().id,
  onListChanged() {
    for (const key of ["theme", "themeLight", "themeDark"] as const) settingsDialog.refreshOptions(key);
    applyEffectiveTheme();
  },
});
settingsDialog.addPanel("theme", themePanel.element);
void themePanel.reload();

async function pickAndOpen(): Promise<void> {
  const picked = await openDialog({
    multiple: false,
    directory: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mkdn", "mdwn", "txt"] }],
  });
  if (typeof picked === "string") await openPath(picked);
}

/** 이 크기 이상인 문서는 인쇄 전에 묻는다 (결정 D7, 기준은 사용자 지정 1 MB). 2 MB에서도 미리보기가 오래 멈췄다 */
const PRINT_WARN_SIZE = 1024 * 1024;

/** Ctrl+P — 큰 문서는 확인을 받은 뒤에만 인쇄한다. 미리보기가 멈춰 강제 종료하다 편집 중 내용을 잃는 사고를 막는다 */
async function printDocument(): Promise<void> {
  const size = current ? Math.max(current.info.byte_len, workingText().length) : 0;
  if (size >= PRINT_WARN_SIZE) {
    // primary 선택지가 없으면 처음 포커스는 취소
    const choice = await showChoice({
      title: "큰 문서 인쇄",
      message:
        `이 문서는 ${(size / 1024 / 1024).toFixed(1)} MB입니다. 큰 문서는 인쇄 미리보기가 오래 멈추거나 응답하지 않을 수 있습니다.` +
        (dirty ? " 저장하지 않은 변경이 있으니 먼저 저장해 두세요." : ""),
      choices: [{ value: "print", label: "계속" }],
      cancelLabel: "취소",
    });
    if (choice !== "print") return;
  }
  window.print();
}

// ---- 단축키 ------------------------------------------------------------------------
// 캡처 단계에서 받는다 — 편집기(CM6)가 먼저 가져가면 안 되는 앱 단축키(Ctrl+/·Ctrl+S 등)가 있다.
// 찾기(Ctrl+F)·바꾸기(Ctrl+H)는 소스 모드에서 편집기 몫이다.

window.addEventListener(
  "keydown",
  (event) => {
    if (event.isComposing || event.keyCode === 229) return;
    if (document.querySelector("dialog[open]")) return; // 팝업이 열려 있으면 팝업 몫
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const take = (): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    if (ctrl && key === "s") {
      take();
      void (event.shiftKey ? saveAs() : save());
    } else if (ctrl && (event.key === "/" || event.code === "Slash")) {
      take();
      setMode(mode === "view" ? "source" : "view");
    } else if (ctrl && !event.shiftKey && key === "f" && mode === "view" && current) {
      take();
      findBar.open();
    } else if (ctrl && key === "h" && mode === "view" && current) {
      take();
      setMode("source");
      editor?.openSearch();
    } else if (ctrl && key === "o") {
      take();
      void pickAndOpen();
    } else if (ctrl && key === "p") {
      take();
      void printDocument();
    } else if (ctrl && (event.key === "=" || event.key === "+")) {
      take();
      applyZoom(zoom + 0.1);
    } else if (ctrl && event.key === "-") {
      take();
      applyZoom(zoom - 0.1);
    } else if (ctrl && event.key === "0") {
      take();
      applyZoom(1);
    } else if (ctrl && event.shiftKey && key === "d") {
      take();
      toggleTheme();
    } else if (ctrl && event.key === "\\") {
      take();
      sidebar.hidden = !sidebar.hidden;
    } else if (ctrl && event.shiftKey && key === "e") {
      take();
      nav.toggle();
    } else if (ctrl && event.key === ",") {
      take();
      settingsDialog.open();
    } else if (key === "f5" && current) {
      take();
      void reload();
    }
  },
  { capture: true },
);

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

// ---- 열기 경로·외부 변경·닫기 연결 ---------------------------------------------------------

async function init(): Promise<void> {
  await listen<string[]>("open-file", (event) => {
    const [first] = event.payload;
    if (first) void openPath(first);
  });

  await listen<{ path: string; hash: string }>("file-changed", (event) => {
    if (!current || !samePath(event.payload.path, current.path)) return;
    if (event.payload.hash === current.hash) return; // 우리가 저장한 내용
    if (!dirty) {
      void reload({ discard: true });
      return;
    }
    // 편집 중에는 덮어쓰지 않는다 (2-3) — 고르게 하고, 유지하면 다음 저장에서 충돌 팝업이 뜬다
    showBanner(
      "다른 프로그램이 이 파일을 바꿨습니다. 편집한 내용은 아직 저장하지 않았습니다.",
      [
        { label: "다시 읽기 (내 변경 버림)", run: () => void reload({ discard: true }) },
        { label: "내 변경 유지", run: hideBanner },
      ],
      true,
    );
  });

  await listen<string>("file-missing", () => {
    showBanner(
      dirty
        ? "파일이 삭제되거나 이동됐습니다. 저장(Ctrl+S)하면 같은 자리에 다시 만들 수 있습니다."
        : "파일이 삭제되거나 이동됐습니다. 마지막으로 읽은 내용을 보여 줍니다.",
      [],
      true,
    );
  });

  await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "over" || event.payload.type === "enter") {
      viewer.classList.add("drag-over");
    } else if (event.payload.type === "drop") {
      viewer.classList.remove("drag-over");
      const paths = event.payload.paths;
      if (mode === "source" && current && paths.length > 0 && paths.every((p) => IMAGE_EXT_RE.test(p))) {
        void dropImages(paths, event.payload.position);
        return;
      }
      const [first] = paths;
      if (first) void openPath(first);
    } else {
      viewer.classList.remove("drag-over");
    }
  });

  // 저장하지 않은 변경이 있으면 창을 닫기 전에 묻는다 (제목 표시줄 닫기·Alt+F4 모두). 막지 않으면 API가 창을 없앤다
  await getCurrentWindow().onCloseRequested(async (event) => {
    if (!(await confirmLeave("close"))) event.preventDefault();
  });

  const pending = await invoke<string[]>("take_pending_paths");
  if (pending[0]) await openPath(pending[0]);
  void refreshDefaultAppStatus();
  // 관리자 권한 창에는 탐색기 더블클릭이 전달되지 않는다(UIPI) — 막을 수 없으니 상태바로 알린다 (스펙 경계 사례)
  $("#status-elevated").hidden = !(await invoke<boolean>("is_elevated").catch(() => false));
}

initSidebarResize();
// 저장된 열림 상태·폭을 적용한 첫 그림에서는 애니메이션을 끈다
requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("no-anim")));

if (IS_TAURI) {
  initTitlebar();
  void init();
} else {
  // Tauri 밖(브라우저에서 `npm run dev`)에서는 샘플을 직접 불러 렌더·테마를 눈으로 확인한다. ?mode=source 로 소스 모드
  const params = new URLSearchParams(location.search);
  void openPath(params.get("sample") ?? "samples/showcase.md").then(() => {
    if (params.get("mode") === "source") setMode("source");
  });
}
