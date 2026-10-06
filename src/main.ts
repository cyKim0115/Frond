/**
 * 앱 셸 — 파일 열기 경로(argv·두 번째 인스턴스·드롭·Ctrl+O·최근 파일), 탭, 보기(렌더)·소스(CM6) 모드, 저장·초안,
 * 목차·상태바·줌·테마, 외부 변경, 세션 복원. 파일 읽기·쓰기는 전부 Rust 커맨드(mdeditor-core)로 간다 — fs 플러그인 금지.
 * 제목 표시줄은 titlebar.ts, 탭 띠는 tabs.ts, 탐색 영역은 nav.ts, 목차 폭은 resize.ts, 설정은 settings.ts(+ settings-dialog.ts),
 * 소스 편집기는 editor.ts, 보기 모드 찾기는 find.ts, 테마는 theme/themes.ts, 세션 저장은 session.ts.
 *
 * 문서 상태는 탭(로드맵 3-1)마다 `Tab`에 있다. `tab.doc`은 디스크 기준(연 때·마지막 저장 때의 텍스트·해시·메타)이고,
 * 편집 중인 텍스트는 편집기 상태에만 있으며 `tab.dirty`가 둘의 차이를 나타낸다. 저장은 `tab.doc.hash`를 etag로 넘겨
 * 그 사이 바뀐 파일을 덮어쓰지 않는다(save.rs).
 * - 편집기(CM6 view)는 하나다. 탭을 바꾸면 그 탭의 `EditorState`로 갈아 끼운다 — 되돌리기 기록·커서·선택이 탭마다 남는다.
 *   `editorTab`이 지금 view에 올라 있는 탭이고, 나머지 탭의 편집 상태는 `tab.editorState`에 있다
 * - 보기 화면은 탭마다 `<article>`을 두고 활성 탭 것만 보인다 — 탭을 오가도 다시 그리지 않고 하이라이트·그림도 남는다
 */

import { type EditorState, type StateEffect, Text } from "@codemirror/state";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { showContextMenu } from "./context-menu";
import { showChoice, showDialog } from "./dialog";
import { createSourceEditor, type SourceEditor } from "./editor";
import { initFindBar } from "./find";
import { initInboxPanel } from "./inbox-panel";
import { initTreePanel } from "./tree-panel";
import { initNav } from "./nav";
import { docTitle, samePath } from "./recent";
import { CHUNK_CLASS, highlightCodeBlocks, LARGE_CHUNK_BLOCKS, LARGE_SOFT_LIMIT, renderMarkdown, type TocEntry } from "./render";
import { DIAGRAM_CLASS, renderDiagrams } from "./render/mermaid";
import { setBlocks } from "./render/morph";
import { initSidebarResize } from "./resize";
import { readSession, type Session, type SessionMode, writeSession } from "./session";
import { getSetting, onSettingChange, setSetting, SETTING_KEYS, type SettingKey } from "./settings";
import { initSettingsDialog } from "./settings-dialog";
import { buildSyncMap, initSplitResize, lineForY, type SyncMap, yForLine } from "./split";
import { initTabStrip } from "./tabs";
import { applyTheme, findTheme, registerColorTokens, resolveTheme, type ThemeDef, themeTransitionCss } from "./theme/themes";
import { createThemePanel } from "./theme-panel";
import { initTitlebar } from "./titlebar";
import { countText, type TextCount } from "./wordcount";
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
type Mode = SessionMode;

interface BannerAction {
  label: string;
  run: () => void;
}
interface BannerState {
  message: string;
  actions: BannerAction[];
  warn: boolean;
  /** 같은 종류의 배너를 골라 거둘 때 ("image" — 이미지 붙여넣기·놓기 실패, "missing" — 파일 사라짐) */
  kind: string;
}

/** 열린 문서 하나 (로드맵 3-1) */
interface Tab {
  id: number;
  doc: DocumentPayload;
  /** "해석만 바꾸기"로 고른 인코딩 — 같은 문서를 다시 읽을 때도 유지한다 */
  forcedEncoding?: string;
  mode: Mode;
  /** 편집기 상태 — `editorTab`이 아닐 때만 의미가 있다. 소스 모드에 한 번도 안 들어갔으면 null */
  editorState: EditorState | null;
  /** 편집기 기준 "저장된 내용" — 이것과 같으면 dirty가 아니다 */
  savedDoc: Text | null;
  dirty: boolean;
  /** 보기 화면에 마지막으로 그린 텍스트 — 같으면 모드 전환 때 다시 그리지 않는다 */
  renderedText: string | null;
  /** 아직 그리지 않았다 (세션 복원·백그라운드 다시 읽기) — 활성화할 때 그린다 */
  needsRender: boolean;
  /** 렌더 차례 — 비동기 후처리(그림)가 그사이 다시 그린 문서를 건드리지 않게 */
  renderSeq: number;
  /**
   * 소스 → 보기로 나갈 때 남긴 편집기 자리. 커서·선택은 편집기 상태에 그대로 남아 있으니 스크롤만 따로 둔다.
   * 편집기에 문서를 새로 올리면(`loadEditor`) 버린다 — 그때는 되살릴 자리가 없다
   */
  sourceMemo: { scroll: StateEffect<unknown>; viewLine: number } | null;
  article: HTMLElement;
  tocList: HTMLElement;
  tocEntries: TocEntry[];
  frontMatter?: string;
  tocLinks: Map<string, HTMLAnchorElement>;
  activeLink: HTMLAnchorElement | null;
  /** 문서 순서의 본문 제목. `renderView()`가 채운다 */
  headings: HTMLElement[];
  /** 큰 문서의 블록 묶음(render/chunks.ts)과, 묶음마다 그 묶음 이후 첫 제목의 `headings` 번호. 묶지 않은 문서는 빈 배열 */
  chunks: HTMLElement[];
  chunkHeadingStart: number[];
  large: boolean;
  textCount: TextCount | null;
  lastDraftText: string | null;
  banner: BannerState | null;
  /** 감시 중인 파일이 사라졌다는 배너를 띄웠다 — 다시 생기면 거둔다 */
  missing: boolean;
  /** 비활성 탭에서 기억한 자리 — 보기 스크롤(작은 문서)·보기 맨 위 줄(큰 문서·세션)·편집기 스크롤·편집기 맨 위 줄 */
  viewScroll: number;
  viewLine: number;
  editorScroll: StateEffect<unknown> | null;
  editorLine: number;
  /** 처음 그릴 때 이 줄로 (세션 복원·백그라운드 다시 읽기) */
  restoreLine: number | null;
  /** 초안 복구를 이미 물었다 */
  draftChecked: boolean;
  /** 디스크 내용과 비교 중 (로드맵 3-4) — 편집기 상태에 비교 표시가 들어 있다 */
  comparing: boolean;
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const viewer = $("#viewer");
const editorHost = $("#editor");
const panes = $("#panes");
const welcome = $("#welcome");
const banner = $("#banner");
const sidebar = $("#sidebar");
const toc = $("#toc");
const statusPath = $("#status-path");
const statusDefault = $<HTMLButtonElement>("#status-default");
const statusMode = $<HTMLButtonElement>("#status-mode");
const statusEncoding = $<HTMLButtonElement>("#status-encoding");
const statusEol = $<HTMLButtonElement>("#status-eol");
const statusCount = $<HTMLButtonElement>("#status-count");
const app = $("#app");

const IS_TAURI = "__TAURI_INTERNALS__" in window;
/** 브라우저 미리보기에서는 경로를 그대로 URL로 쓴다 (Vite가 프로젝트 파일을 서빙). `#`·공백은 조각으로 읽히지 않게 인코딩 */
const toAssetUrl = IS_TAURI
  ? convertFileSrc
  : (absPath: string) => absPath.split(/[\\/]/).map(encodeURIComponent).join("/");

let tabs: Tab[] = [];
let active: Tab | null = null;
let nextTabId = 1;
let editor: SourceEditor | null = null;
/** 편집기 view에 지금 올라 있는 탭 — 다른 탭으로 가면 그 탭의 상태로 갈아 끼운다 */
let editorTab: Tab | null = null;
/** 닫은 탭 경로 — Ctrl+Shift+T로 다시 연다 */
const closedPaths: string[] = [];
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

function watchDocument(tab: Tab): void {
  if (IS_TAURI) void invoke("watch_document", { path: tab.doc.path, hash: tab.doc.hash }).catch(() => undefined);
}

function unwatchDocument(path: string): void {
  if (IS_TAURI) void invoke("unwatch_document", { path }).catch(() => undefined);
}

const nav = initNav({ open: (path) => openPath(path).then(() => undefined), exists: fileExists });

/** 탐색 영역 '새 문서' — AI 훅이 만든 문서 받은 목록 (로드맵 3-6) */
const inbox = initInboxPanel({
  open: (path) => openPath(path).then(() => undefined),
  exists: fileExists,
  reveal: (path) =>
    revealItemInDir(path).catch((e) => void showDialog({ title: "파일 위치를 열 수 없습니다", message: String(e), detail: path })),
  async title(path) {
    try {
      return titleOf((await loadDocument(path)).text, null);
    } catch {
      return undefined;
    }
  },
  show: () => nav.show("inbox"),
});

/** 탐색 영역 '폴더' — 폴더 트리 (로드맵 3-2) */
const tree = initTreePanel({
  isTauri: IS_TAURI,
  open: (path) => openPath(path).then(() => undefined),
  reveal: (path) =>
    revealItemInDir(path).catch((e) => void showDialog({ title: "위치를 열 수 없습니다", message: String(e), detail: path })),
  copy: (text) => void navigator.clipboard.writeText(text).then(() => flashStatus("경로를 복사했습니다")),
});

/** 편집 중인 텍스트 (소스 모드에 한 번도 안 들어갔으면 디스크 텍스트) */
function workingText(tab: Tab | null = active): string {
  if (!tab) return "";
  if (editor && editorTab === tab) return editor.getText();
  return tab.editorState ? tab.editorState.doc.toString() : tab.doc.text;
}

/** 편집기 기준 지금 문서 (편집기에 한 번도 안 올렸으면 null) */
function editorDoc(tab: Tab): Text | null {
  if (editor && editorTab === tab) return editor.view.state.doc;
  return tab.editorState?.doc ?? null;
}

const findTab = (path: string): Tab | undefined => tabs.find((t) => samePath(t.doc.path, path));

// ---- 탭 (로드맵 3-1) ---------------------------------------------------------------

function createTab(doc: DocumentPayload, mode: Mode, index = active ? tabs.indexOf(active) + 1 : tabs.length): Tab {
  const article = document.createElement("article");
  article.className = "markdown-body doc";
  article.lang = "ko";
  article.hidden = true;
  viewer.append(article);
  articleResize.observe(article);
  const tocList = document.createElement("div");
  tocList.className = "toc-list";
  const tab: Tab = {
    id: nextTabId++,
    doc,
    mode,
    editorState: null,
    savedDoc: null,
    dirty: false,
    renderedText: null,
    needsRender: true,
    renderSeq: 0,
    sourceMemo: null,
    article,
    tocList,
    tocEntries: [],
    tocLinks: new Map(),
    activeLink: null,
    headings: [],
    chunks: [],
    chunkHeadingStart: [],
    large: false,
    textCount: null,
    lastDraftText: null,
    banner: null,
    missing: false,
    viewScroll: 0,
    viewLine: 0,
    editorScroll: null,
    editorLine: 0,
    restoreLine: null,
    draftChecked: false,
    comparing: false,
  };
  tabs.splice(Math.min(Math.max(0, index), tabs.length), 0, tab);
  return tab;
}

const tabStrip = initTabStrip($("#tabs"), {
  activate(id) {
    const tab = tabs.find((t) => t.id === id);
    if (tab) activate(tab);
  },
  close(id) {
    const tab = tabs.find((t) => t.id === id);
    if (tab) void closeTab(tab);
  },
  menu(id, event) {
    const tab = tabs.find((t) => t.id === id);
    if (tab) tabMenu(tab, event);
  },
  move(id, index) {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    tabs = tabs.filter((t) => t !== tab);
    tabs.splice(index, 0, tab);
    renderTabs();
    saveSession();
  },
});

function renderTabs(): void {
  tabStrip.render(
    tabs.map((t) => ({ id: t.id, name: t.doc.name, title: t.doc.path, dirty: t.dirty })),
    active?.id ?? null,
  );
}

/** 지금 탭의 화면 자리를 탭에 남긴다 — 다른 탭으로 가기 전에 */
function stash(tab: Tab): void {
  if (tab.mode !== "source" && !tab.needsRender) {
    tab.viewScroll = viewer.scrollTop;
    tab.viewLine = viewTopLine();
  }
  if (editor && editorTab === tab) {
    tab.editorState = editor.view.state;
    if (tab.mode !== "view") {
      tab.editorScroll = editor.view.scrollSnapshot();
      tab.editorLine = editor.topLine();
    }
  }
}

/** 탭을 앞으로 — 그 탭의 보기 화면·목차·모드·편집기 상태·배너·상태바로 바꾼다 */
function activate(tab: Tab): void {
  if (tab === active) return;
  if (active) stash(active);
  findBar.close();
  active = tab;
  for (const t of tabs) t.article.hidden = t !== tab;
  welcome.hidden = true;
  toc.replaceChildren(tab.tocList);
  const restore = tab.restoreLine;
  tab.restoreLine = null;
  if (tab.needsRender) renderView(tab, workingText(tab));
  app.classList.toggle("large-doc", tab.large);
  sidebar.hidden = tab.tocEntries.length === 0;
  showMode(tab.mode);
  if (tab.mode !== "view") {
    const ed = attachEditor(tab);
    ed.view.requestMeasure();
    if (restore !== null) ed.scrollToLine(restore);
    else if (tab.editorScroll) ed.view.dispatch({ effects: tab.editorScroll });
    // 분할 뷰는 편집기 자리에 미리보기를 맞춘다 (편집기 스크롤은 다음 측정 때 반영된다)
    if (tab.mode === "split") {
      viewer.scrollTop = tab.viewScroll;
      requestAnimationFrame(() => syncViewerFromEditor());
    }
  } else if (restore !== null) {
    scrollViewToLine(restore);
  } else if (tab.large) {
    // 큰 문서는 숨겼다 보이면 묶음 높이를 다시 재므로 스크롤 값 대신 보던 블록으로 돌아간다
    scrollViewToLine(tab.viewLine);
  } else {
    viewer.scrollTop = tab.viewScroll;
  }
  paintBanner(tab.banner);
  updateDocChrome();
  updateCount();
  updateActiveHeading();
  nav.setCurrent(tab.doc.path);
  tree.setCurrent(tab.doc.path);
  inbox.markRead(tab.doc.path);
  renderTabs();
  saveSession();
  // 다른 테마일 때 그린 그림은 지금 테마로 다시 그린다
  void renderDiagrams(tab.article, isDarkTheme());
  if (!tab.draftChecked) {
    tab.draftChecked = true;
    void offerDraft(tab);
  }
}

/** 열린 문서가 없을 때 — 처음 화면 */
function showWelcome(): void {
  active = null;
  for (const t of tabs) t.article.hidden = true;
  welcome.hidden = false;
  viewer.hidden = false;
  editorHost.hidden = true;
  viewer.scrollTop = 0;
  toc.replaceChildren();
  sidebar.hidden = true;
  app.classList.remove("large-doc");
  findBar.close();
  paintBanner(null);
  updateDocChrome();
  updateCount();
  nav.setCurrent(null);
  tree.setCurrent(null);
  renderTabs();
  saveSession();
}

interface OpenOptions {
  /** 탭만 만들고 앞으로 가져오지 않는다 (세션 복원) */
  background?: boolean;
  mode?: Mode;
  /** 처음 그릴 때 이 줄로 */
  line?: number;
  /** 새 탭 자리 (기본: 활성 탭 바로 뒤) */
  index?: number;
}

/**
 * 문서를 연다 (argv·두 번째 인스턴스·최근 파일·링크·Ctrl+O·드롭). 이미 열린 문서면 그 탭으로 가고, 아니면 새 탭.
 * 디스크에서 다시 읽는 것은 F5·외부 변경(`reload()`)
 */
async function openPath(path: string, options: OpenOptions = {}): Promise<Tab | null> {
  const existing = findTab(path);
  if (existing) {
    if (!options.background) {
      activate(existing);
      nav.remember(existing.doc.path, tabTitle(existing));
    }
    return existing;
  }
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(path);
  } catch (e) {
    if (!options.background) await showDialog({ title: "열 수 없습니다", message: String(e), detail: path });
    return null;
  }
  // 읽는 사이 같은 문서가 열렸으면(빠른 연속 열기) 그 탭으로
  const again = findTab(doc.path);
  if (again) {
    if (!options.background) activate(again);
    return again;
  }
  const tab = createTab(doc, options.mode ?? (getSetting("openMode") === "source" ? "source" : "view"), options.index);
  if (options.line !== undefined) tab.restoreLine = options.line;
  watchDocument(tab);
  if (options.background) {
    renderTabs();
    saveSession();
    return tab;
  }
  activate(tab);
  nav.remember(doc.path, tabTitle(tab));
  return tab;
}

/** 탭을 닫는다. 저장하지 않은 변경이 있으면 먼저 묻는다. 닫았으면 true */
async function closeTab(tab: Tab): Promise<boolean> {
  if (tab.dirty) {
    activate(tab);
    if (!(await confirmLeave(tab, "close"))) return false;
  }
  const i = tabs.indexOf(tab);
  if (i < 0) return true;
  if (active === tab) stash(tab);
  tabs.splice(i, 1);
  articleResize.unobserve(tab.article);
  tab.article.remove();
  if (editorTab === tab) editorTab = null;
  unwatchDocument(tab.doc.path);
  closedPaths.push(tab.doc.path);
  if (closedPaths.length > 20) closedPaths.shift();
  if (active === tab) {
    active = null;
    const next = tabs[i] ?? tabs[i - 1];
    if (next) activate(next);
    else showWelcome();
  } else {
    renderTabs();
    saveSession();
  }
  return true;
}

/** 여러 탭을 차례로 닫는다 — 저장 확인에서 취소하면 멈춘다 */
async function closeTabs(list: Tab[]): Promise<void> {
  for (const tab of list) if (!(await closeTab(tab))) return;
}

function tabMenu(tab: Tab, event: MouseEvent): void {
  const i = tabs.indexOf(tab);
  const others = tabs.filter((t) => t !== tab);
  const right = tabs.slice(i + 1);
  showContextMenu(event, [
    { label: "닫기", action: () => void closeTab(tab) },
    ...(others.length ? [{ label: "다른 탭 모두 닫기", action: () => void closeTabs(others) }] : []),
    ...(right.length ? [{ label: "오른쪽 탭 모두 닫기", action: () => void closeTabs(right) }] : []),
    { label: "경로 복사", action: () => void navigator.clipboard.writeText(tab.doc.path).then(() => flashStatus("경로를 복사했습니다")) },
    ...(IS_TAURI
      ? [
          {
            label: "파일 위치 열기",
            action: () =>
              void revealItemInDir(tab.doc.path).catch((e) => showDialog({ title: "파일 위치를 열 수 없습니다", message: String(e), detail: tab.doc.path })),
          },
        ]
      : []),
  ]);
}

function cycleTab(step: number): void {
  if (!active || tabs.length < 2) return;
  const i = tabs.indexOf(active);
  activate(tabs[(i + step + tabs.length) % tabs.length]);
}

async function reopenClosedTab(): Promise<void> {
  while (closedPaths.length > 0) {
    const path = closedPaths.pop()!;
    if (findTab(path)) continue;
    if (await fileExists(path)) {
      await openPath(path);
      return;
    }
  }
  flashStatus("다시 열 탭이 없습니다");
}

// ---- 다시 읽기·화면에 올리기 ---------------------------------------------------------

/** 같은 문서를 디스크에서 다시 읽는다 (F5·외부 변경·"다시 읽기"·인코딩 다시 열기). 보던 위치를 지킨다 */
async function reload(options: { discard?: boolean; encoding?: string } = {}, tab: Tab | null = active): Promise<boolean> {
  if (!tab) return false;
  if (tab !== active) return reloadInBackground(tab, options.encoding);
  if (!options.discard && !(await confirmLeave(tab, "reload"))) return false;
  const encoding = options.encoding ?? tab.forcedEncoding;
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(tab.doc.path, encoding);
  } catch (e) {
    showBanner(`다시 읽을 수 없습니다: ${e}`, [], true, "", tab);
    return false;
  }
  if (tab !== active) return true; // 읽는 사이 탭을 바꿨다 — 그 탭은 다음에 다시 읽힌다
  tab.forcedEncoding = encoding;
  const scrollTop = viewer.scrollTop;
  const line = tab.mode !== "view" && editor ? editor.topLine() : null;
  const cursor = tab.mode !== "view" && editor ? editor.view.state.selection.main.head : null;
  hideBanner(tab);
  adopt(tab, doc, tab.mode);
  if (tab.mode !== "source") viewer.scrollTop = scrollTop;
  if (tab.mode !== "view" && editor && line !== null) {
    editor.scrollToLine(line);
    if (cursor !== null) editor.view.dispatch({ selection: { anchor: Math.min(cursor, editor.view.state.doc.length) } });
  }
  nav.retitle(doc.path, tabTitle(tab));
  watchDocument(tab);
  return true;
}

/** 뒤에 있는(저장하지 않은 변경이 없는) 탭을 조용히 다시 읽는다 — 앞으로 가져올 때 보던 줄로 그린다 */
async function reloadInBackground(tab: Tab, encoding = tab.forcedEncoding): Promise<boolean> {
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(tab.doc.path, encoding);
  } catch {
    return false;
  }
  if (tab === active || !tabs.includes(tab) || tab.dirty) return false;
  const line = tab.needsRender ? tab.restoreLine : tab.mode === "view" ? tab.viewLine : tab.editorLine;
  tab.forcedEncoding = encoding;
  adopt(tab, doc, tab.mode);
  tab.restoreLine = line;
  watchDocument(tab);
  renderTabs();
  return true;
}

/** 디스크에서 읽은 문서를 탭에 올린다 — 편집 상태는 버린다. 뒤 탭이면 앞으로 올 때 그린다 */
function adopt(tab: Tab, doc: DocumentPayload, nextMode: Mode): void {
  tab.doc = doc;
  tab.missing = false;
  tab.comparing = false;
  tab.editorState = null;
  tab.savedDoc = null;
  tab.renderedText = null;
  tab.editorScroll = null;
  tab.sourceMemo = null;
  if (editorTab === tab) editorTab = null;
  tab.mode = nextMode;
  setDirty(tab, false);
  if (tab !== active) {
    tab.needsRender = true;
    return;
  }
  if (nextMode !== "view") loadEditor(tab, doc.text);
  renderView(tab, doc.text);
  showMode(nextMode);
  updateDocChrome();
}

/** 제목(front matter title → 첫 H1) — 큰 문서는 파싱을 아끼고 그린 목차만 쓴다 */
function titleOf(text: string, tab: Tab | null = active): string | undefined {
  if (text.length > LARGE_SOFT_LIMIT / 2) return tab?.tocEntries.length ? docTitle(tab.tocEntries) : undefined;
  if (tab && tab.renderedText === text) return docTitle(tab.tocEntries, tab.frontMatter);
  const result = renderMarkdown(text, { baseDir: "", toAssetUrl: (p) => p });
  return docTitle(result.toc, result.frontMatter);
}

const tabTitle = (tab: Tab): string | undefined => (tab.needsRender ? undefined : docTitle(tab.tocEntries, tab.frontMatter));

// ---- 보기 모드 (렌더) --------------------------------------------------------------

function isDarkTheme(): boolean {
  return effectiveTheme().base === "dark";
}

function renderView(tab: Tab, text: string): void {
  // 2 MB(스펙 largeSoftLimit)를 넘는 문서는 하이라이트를 생략하고, 이미지는 지연 로드,
  // 큰 문서 모드(블록 묶음 단위로 화면 밖 레이아웃 생략·패널 애니메이션 끔)로 그린다
  const large = tab.doc.info.byte_len > LARGE_SOFT_LIMIT || text.length > LARGE_SOFT_LIMIT;
  const result = renderMarkdown(text, {
    baseDir: tab.doc.dir,
    toAssetUrl,
    lazyImages: large,
    chunkBlocks: large ? LARGE_CHUNK_BLOCKS : undefined,
  });
  tab.large = large;
  tab.article.classList.toggle("large", large);
  // 작은 문서는 바뀐 블록만 갈아 끼운다(render/morph.ts) — 편집 중 미리보기에서 이미지가 깜빡이거나 그림을 다시 그리지 않게.
  // 큰 문서는 블록 묶음(chunks)째 한 번에 넣는다
  if (large) tab.article.innerHTML = result.html;
  else setBlocks(tab.article, result.html, true);
  if (syncCache?.tab === tab) syncCache = null;
  const seq = ++tab.renderSeq;
  if (!large) void highlightCodeBlocks(tab.article);
  void renderDiagrams(tab.article, isDarkTheme(), () => tab.renderSeq !== seq || !tab.article.isConnected);
  tab.renderedText = text;
  tab.needsRender = false;
  tab.tocEntries = result.toc;
  tab.frontMatter = result.frontMatter;

  tab.tocLinks.clear();
  tab.activeLink = null;
  tab.tocList.replaceChildren(
    ...result.toc.map((e) => {
      const a = document.createElement("a");
      a.href = `#${e.id}`;
      a.textContent = e.text;
      a.dataset.level = String(e.level);
      a.dataset.line = String(e.line);
      tab.tocLinks.set(e.id, a);
      return a;
    }),
  );
  tab.headings = Array.from(tab.article.querySelectorAll<HTMLElement>("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]"));
  indexChunks(tab);
  recount(tab);
  if (tab !== active) return;
  app.classList.toggle("large-doc", large);
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
  if (!active) return { top: 0, bottom: Infinity };
  const rect = viewer.getBoundingClientRect();
  let top: number | null = null;
  for (const child of active.article.children as HTMLCollectionOf<HTMLElement>) {
    let blocks: Iterable<HTMLElement> = [child];
    if (child.classList.contains(CHUNK_CLASS)) {
      // 큰 문서의 묶음은 묶음 상자로 먼저 거른다 — 화면 밖 묶음 안의 블록을 재면 그 묶음을 배치하게 된다
      const box = child.getBoundingClientRect();
      if (top === null && box.bottom <= rect.top + 4) continue;
      if (top !== null && box.top >= rect.bottom) {
        const first = child.querySelector<HTMLElement>(":scope > [data-line]");
        if (first) return { top, bottom: Number(first.dataset.line) };
        continue;
      }
      blocks = child.children as HTMLCollectionOf<HTMLElement>;
    }
    for (const el of blocks) {
      if (el.dataset.line === undefined) continue;
      const box = el.getBoundingClientRect();
      if (top === null && box.bottom > rect.top + 4) top = Number(el.dataset.line);
      else if (top !== null && box.top >= rect.bottom) return { top, bottom: Number(el.dataset.line) };
    }
  }
  return { top: top ?? 0, bottom: Infinity };
}

/** 소스 줄 `line`(0 기준) 이하에서 시작하는 마지막 최상위 블록을 화면 맨 위로 */
function scrollViewToLine(line: number): void {
  if (!active) return;
  const blocks = Array.from(
    active.article.querySelectorAll<HTMLElement>(`:scope > [data-line], :scope > .${CHUNK_CLASS} > [data-line]`),
  );
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

// ---- 소스 모드 (CM6, 로드맵 2-1) ---------------------------------------------------

let headingTick = 0;

function ensureEditor(): SourceEditor {
  if (editor) return editor;
  editor = createSourceEditor(editorHost, { onChange: onEditorChange, onPasteImages: pasteImages, onCompareChange });
  editor.setLineWrapping(getSetting("editorLineWrap") === "wrap");
  editor.setDark(effectiveTheme().base === "dark");
  editor.view.scrollDOM.addEventListener("scroll", () => {
    saveSession();
    onPaneScroll("editor");
    if (headingTick) return;
    headingTick = requestAnimationFrame(() => {
      headingTick = 0;
      updateActiveHeading();
    });
  });
  return editor;
}

/** 탭의 편집 상태를 편집기에 올린다 (이미 올라 있으면 그대로) */
function attachEditor(tab: Tab): SourceEditor {
  const ed = ensureEditor();
  if (editorTab === tab) return ed;
  if (editorTab) editorTab.editorState = ed.view.state;
  if (tab.editorState) {
    ed.setState(tab.editorState);
    ed.setReadOnly(tab.doc.info.lossy);
    editorTab = tab;
  } else {
    loadEditor(tab, tab.doc.text);
  }
  return ed;
}

/** 편집기에 텍스트를 올린다. 디스크 텍스트와 다르면(초안 복구) 바로 dirty */
function loadEditor(tab: Tab, text: string): void {
  const ed = ensureEditor();
  if (editorTab && editorTab !== tab) editorTab.editorState = ed.view.state;
  editorTab = tab;
  ed.setText(tab.doc.text);
  tab.savedDoc = ed.view.state.doc;
  if (text !== tab.doc.text) ed.view.dispatch({ changes: { from: 0, to: ed.view.state.doc.length, insert: text } });
  // 손실 디코드 문서는 저장할 수 없으니 편집도 막는다 (스펙 경계 사례)
  ed.setReadOnly(tab.doc.info.lossy);
  tab.editorState = null;
  tab.sourceMemo = null;
  setDirty(tab, text !== tab.doc.text);
}

const MODE_LABEL: Record<Mode, string> = { view: "보기", source: "소스", split: "분할" };

function showMode(next: Mode): void {
  if (active) active.mode = next;
  viewer.hidden = next === "source";
  editorHost.hidden = next === "view";
  panes.dataset.mode = next;
  statusMode.hidden = !active;
  statusMode.textContent = MODE_LABEL[next];
  if (next !== "view") findBar.close();
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

/**
 * Ctrl+/ 보기 ↔ 소스, Ctrl+Shift+/ 분할(로드맵 3-3) — 보던 위치를 `data-line`으로 맞춰 오간다 (T1).
 * 보기에서 크게 움직이지 않았으면 커서도 되살린다. 분할은 소스(왼쪽)가 기준이고 미리보기가 따라간다
 */
function setMode(next: Mode): void {
  const tab = active;
  if (!tab || next === tab.mode) return;
  const prev = tab.mode;
  if (prev !== "view" && next !== "view") {
    // 소스 ↔ 분할 — 편집기는 그대로, 미리보기만 보이거나 숨긴다
    if (next === "split") {
      const text = workingText(tab);
      if (text !== tab.renderedText) renderView(tab, text);
    }
    showMode(next);
    editor?.view.requestMeasure();
    if (next === "split") requestAnimationFrame(() => syncViewerFromEditor());
    editor?.focus();
    saveSession();
    return;
  }
  if (next !== "view") {
    // 보기 화면은 숨기기 전에 잰다
    const range = viewLineRange();
    const ed = attachEditor(tab);
    const memo = tab.sourceMemo;
    tab.sourceMemo = null;
    showMode(next);
    // 숨겨져 있던 편집기는 크기를 다시 재야 한다. scrollIntoView 효과는 그 측정 때 반영된다
    ed.view.requestMeasure();
    const { state } = ed.view;
    const choice = memo ? cursorReturn(state.doc.lineAt(state.selection.main.head).number - 1, memo.viewLine, range.top, range.bottom) : "follow";
    if (choice === "restore") ed.view.dispatch({ effects: memo!.scroll });
    // follow면 커서도 보던 줄로 — 바로 입력하면 보던 자리에 들어간다
    else ed.scrollToLine(range.top, choice === "follow");
    ed.focus();
    if (next === "split") requestAnimationFrame(() => syncViewerFromEditor());
  } else {
    const line = editor && editorTab === tab ? editor.topLine() : 0;
    // 편집기는 숨겨지면 스크롤을 잃는다 — 문서 위치 기준 스냅샷으로 남긴다
    const scroll = editor && editorTab === tab ? editor.view.scrollSnapshot() : null;
    const text = workingText(tab);
    if (text !== tab.renderedText) renderView(tab, text);
    showMode("view");
    // 분할에서 오면 미리보기가 이미 그 자리에 있다
    if (prev === "source") scrollViewToLine(line);
    tab.sourceMemo = scroll ? { scroll, viewLine: viewTopLine() } : null;
    viewer.focus({ preventScroll: true });
  }
  saveSession();
}

let dirtyTimer = 0;
let previewTimer = 0;
/** 편집 → 미리보기 갱신 대기 (ms). 분할 뷰는 화면에 보이므로 짧게 */
const PREVIEW_DELAY = 700;
const PREVIEW_DELAY_SPLIT = 120;
function onEditorChange(): void {
  const tab = editorTab;
  if (!tab) return;
  // 첫 입력은 바로 표시하고, 되돌리기로 원래대로 돌아왔는지는 잠시 뒤 정확히 잰다
  if (!tab.dirty) setDirty(tab, true);
  window.clearTimeout(dirtyTimer);
  dirtyTimer = window.setTimeout(() => {
    const doc = editorDoc(tab);
    if (doc && tab.savedDoc) setDirty(tab, !doc.eq(tab.savedDoc));
  }, 250);
  if (tab.comparing) onCompareChange();
  // 작은 문서는 목차·보기 화면을 편집을 따라 갱신한다 (큰 문서는 보기로 돌아갈 때·분할에서는 저장할 때 한 번).
  // 분할 뷰는 바로 보이니 짧게 기다린다 — 갱신은 바뀐 블록만(render/morph.ts)
  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(
    () => {
      if (editorTab !== tab || tab !== active || !editor) return;
      const text = editor.getText();
      if (text.length <= LARGE_SOFT_LIMIT / 4 && text !== tab.renderedText) {
        const keep = viewer.scrollTop;
        renderView(tab, text);
        if (tab.mode === "split") syncViewerFromEditor();
        else viewer.scrollTop = keep;
        updateActiveHeading();
      }
    },
    tab.mode === "split" ? PREVIEW_DELAY_SPLIT : PREVIEW_DELAY,
  );
}

// ---- 비교 (로드맵 3-4, 결정 D5) ---------------------------------------------------------
// 편집 중에 다른 프로그램이 파일을 바꿨을 때 디스크 내용과 편집 중 내용의 차이를 편집기 안에 보인다(editor.ts `setCompare`).
// 비교를 시작하면 탭의 기준을 디스크의 새 내용으로 옮긴다(etag·저장된 내용) — 그래서 저장해도 충돌 팝업이 다시 뜨지 않고,
// 모든 부분을 '디스크 것으로' 고르면 저장할 것이 없어진다

async function startCompare(tab: Tab): Promise<void> {
  if (!IS_TAURI) return;
  let disk: DocumentPayload;
  try {
    disk = await loadDocument(tab.doc.path, tab.forcedEncoding);
  } catch (e) {
    showBanner(`비교할 디스크 내용을 읽지 못했습니다: ${e}`, [], true, "", tab);
    return;
  }
  if (!tabs.includes(tab)) return;
  activate(tab);
  if (tab.mode === "view") setMode("source");
  const ed = attachEditor(tab);
  tab.doc = disk;
  tab.missing = false;
  tab.savedDoc = Text.of(disk.text.split("\n"));
  tab.comparing = true;
  ed.setCompare(disk.text);
  setDirty(tab, !ed.view.state.doc.eq(tab.savedDoc));
  watchDocument(tab);
  updateDocChrome();
  showBanner(
    "비교 중 — 빨간 줄은 디스크(다른 프로그램이 저장한 내용), 초록 줄은 편집 중인 내용입니다. 부분마다 고르고, 저장하면 편집기 내용으로 파일을 씁니다.",
    [
      { label: "비교 끝내기", run: () => endCompare(tab) },
      {
        label: "디스크 내용으로 (내 변경 버림)",
        run: () => {
          endCompare(tab);
          void reload({ discard: true }, tab);
        },
      },
    ],
    false,
    "compare",
    tab,
  );
  if (ed.compareChunks() === 0) endCompare(tab, "차이가 없습니다");
}

function endCompare(tab: Tab, message?: string): void {
  tab.comparing = false;
  if (editor && editorTab === tab) editor.setCompare(null);
  if (tab.banner?.kind === "compare") hideBanner(tab);
  if (message) flashStatus(message);
}

/** 모든 차이를 골랐으면 비교를 끝낸다 */
function onCompareChange(): void {
  const tab = editorTab;
  if (tab?.comparing && editor?.compareChunks() === 0) endCompare(tab, "차이를 모두 골랐습니다");
}

function setDirty(tab: Tab, next: boolean): void {
  if (tab.dirty === next) return;
  tab.dirty = next;
  if (tab === active) updateTitle();
  renderTabs();
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
  const tab = active;
  if (!tab) return null;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 이미지를 저장할 수 없습니다.");
    return null;
  }
  clearImageBanner();
  const links: string[] = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) continue;
    const stem = `image-${timestamp()}`;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const rel = await invoke<string>("save_pasted_image", bytes, {
        headers: { "x-doc-dir": encodeURIComponent(tab.doc.dir), "x-stem": encodeURIComponent(stem), "x-ext": ext },
      });
      links.push(markdownImage("", rel));
    } catch (e) {
      showBanner(`이미지를 저장하지 못했습니다: ${e}`, [], true, "image", tab);
    }
  }
  return links.length ? links.join("\n") : null;
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

/** 지난 붙여넣기·끌어다 놓기의 실패 배너는 다음 시도 때 거둔다 — 성공해도 예전 실패가 남아 보이지 않게 */
function clearImageBanner(): void {
  if (active?.banner?.kind === "image") hideBanner(active);
}

async function dropImages(paths: string[], position: { x: number; y: number }): Promise<void> {
  const tab = active;
  if (!tab || !editor || editorTab !== tab) return;
  const at = editor.view.posAtCoords({ x: position.x / devicePixelRatio, y: position.y / devicePixelRatio });
  if (at !== null) editor.view.dispatch({ selection: { anchor: at } });
  clearImageBanner();
  const links: string[] = [];
  for (const source of paths) {
    try {
      const rel = await invoke<string>("copy_image_to_assets", { docDir: tab.doc.dir, source });
      const alt = source.replace(/^.*[\\/]/, "").replace(IMAGE_EXT_RE, "");
      links.push(markdownImage(alt, rel));
    } catch (e) {
      showBanner(`이미지를 복사하지 못했습니다: ${e}`, [], true, "image", tab);
    }
  }
  if (links.length && editorTab === tab) editor.insertAtCursor(links.join("\n"));
  editor.focus();
}

// ---- 저장 (2-2·2-3) -------------------------------------------------------------

/** 조합 중인 한글을 확정시킨다 — 저장·닫기 직전 (G17·G18). `refocus`면 확정 뒤 편집기로 포커스를 돌려 바로 이어 쓴다 */
async function flushComposition(refocus = false): Promise<void> {
  if (!editor?.view.composing) return;
  editor.view.contentDOM.blur();
  await new Promise((r) => setTimeout(r, 60));
  if (refocus) editor.focus();
}

interface SaveOptions {
  force?: boolean;
  convertTo?: string;
  bom?: boolean;
  /** 모든 줄의 줄바꿈을 이것으로 바꿔 저장한다 (`LF`·`CRLF`) */
  eol?: string;
}

/** Ctrl+S. 성공(또는 저장할 것 없음)이면 true */
async function save(options: SaveOptions = {}, tab: Tab | null = active): Promise<boolean> {
  if (!tab) return false;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 저장할 수 없습니다. 앱(npm run app:dev)에서 저장하세요.");
    return false;
  }
  await flushComposition();
  const doc = tab.doc;
  const text = workingText(tab);
  if (!tab.dirty && !options.force && !options.convertTo && !options.eol) {
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
    if (options.convertTo) tab.forcedEncoding = undefined;
    const now = editorDoc(tab);
    if (now) tab.savedDoc = now;
    setDirty(tab, false);
    tab.lastDraftText = null;
    void invoke("delete_draft", { path: doc.path }).catch(() => undefined);
    hideBanner(tab);
    if (tab === active) updateDocChrome();
    // 큰 문서는 분할 뷰에서도 편집을 따라 그리지 않는다 — 저장할 때 한 번
    if (tab === active && tab.mode === "split" && tab.large && text !== tab.renderedText) {
      renderView(tab, text);
      syncViewerFromEditor();
    }
    nav.retitle(doc.path, titleOf(text, tab));
    flashStatus("저장됨");
    return true;
  } catch (error) {
    return handleSaveFailure(error as SaveFailure | string, tab);
  }
}

async function handleSaveFailure(failure: SaveFailure | string, tab: Tab): Promise<boolean> {
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
        detail: tab.doc.path,
        choices: [
          ...(failure.missing ? [] : [{ value: "compare", label: "비교" }]),
          { value: "save-as", label: "다른 이름으로 저장…" },
          { value: "force", label: failure.missing ? "다시 만들기" : "덮어쓰기", kind: failure.missing ? "primary" : "danger" },
        ],
        cancelLabel: "취소",
        focus: "save-as",
      });
      if (choice === "force") return save({ force: true }, tab);
      if (choice === "save-as") return saveAs(tab);
      if (choice === "compare") void startCompare(tab);
      return false;
    }
    case "unmappable": {
      const ok = await showDialog({
        title: `${failure.encoding}로 저장할 수 없는 문자`,
        message: `"${failure.ch}" (${failure.line}행 ${failure.col}열)은 ${failure.encoding}에 없는 문자입니다. 파일을 UTF-8로 변환해 저장할까요? 다른 프로그램이 ${failure.encoding}을 기대하면 글자가 깨져 보일 수 있습니다.`,
        confirmLabel: "UTF-8로 변환해 저장",
        cancelLabel: "취소",
      });
      return ok ? save({ convertTo: "UTF-8", bom: false }, tab) : false;
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

/** Ctrl+Shift+S — 원래 파일의 인코딩·줄바꿈을 그대로 가져가 새 파일로 저장하고, 이 탭이 그 파일을 보게 한다 */
async function saveAs(tab: Tab | null = active): Promise<boolean> {
  if (!tab) return false;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 저장할 수 없습니다.");
    return false;
  }
  await flushComposition();
  const target = await saveDialog({
    defaultPath: tab.doc.path,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "txt"] }],
  });
  if (!target) return false;
  const text = workingText(tab);
  const from = tab.doc.path;
  try {
    await invoke<SavedPayload>("save_document_as", { sourcePath: from, targetPath: target, text });
  } catch (error) {
    return handleSaveFailure(error as SaveFailure | string, tab);
  }
  void invoke("delete_draft", { path: from }).catch(() => undefined);
  let doc: DocumentPayload;
  try {
    doc = await loadDocument(target);
  } catch (e) {
    await showDialog({ title: "저장한 파일을 열 수 없습니다", message: String(e), detail: target });
    return false;
  }
  // 저장한 자리를 다른 탭이 보고 있었으면 그 탭은 닫는다(방금 덮어썼다) — 그 탭에 저장하지 않은 편집이 있으면 둔다
  const other = tabs.find((t) => t !== tab && samePath(t.doc.path, doc.path));
  if (other && !other.dirty) await closeTab(other);
  if (!samePath(from, doc.path)) unwatchDocument(from);
  tab.forcedEncoding = undefined;
  tab.lastDraftText = null;
  hideBanner(tab);
  adopt(tab, doc, tab.mode);
  watchDocument(tab);
  nav.remember(doc.path, tabTitle(tab));
  if (tab === active) {
    nav.setCurrent(doc.path);
    tree.setCurrent(doc.path);
  }
  renderTabs();
  saveSession();
  return true;
}

/** 수정 중이면 저장할지 묻는다. 계속해도 되면 true */
async function confirmLeave(tab: Tab, reason: "reload" | "close"): Promise<boolean> {
  if (!tab.dirty) return true;
  await flushComposition();
  const choice = await showChoice({
    title: "저장하지 않은 변경",
    message:
      reason === "reload"
        ? `${tab.doc.name}을(를) 디스크에서 다시 읽으면 편집한 내용이 사라집니다.`
        : `${tab.doc.name}의 변경 내용을 저장할까요?`,
    choices:
      reason === "reload"
        ? [{ value: "discard", label: "변경 버리고 다시 읽기", kind: "danger" }]
        : [
            { value: "discard", label: "저장 안 함", kind: "danger" },
            { value: "save", label: "저장", kind: "primary" },
          ],
    cancelLabel: "취소",
  });
  if (choice === "save") return save({}, tab);
  if (choice === "discard") {
    discardDraft(tab);
    return true;
  }
  return false;
}

function discardDraft(tab: Tab): void {
  void invoke("delete_draft", { path: tab.doc.path }).catch(() => undefined);
  tab.lastDraftText = null;
  setDirty(tab, false);
}

/** 창을 닫기 전 — 저장하지 않은 탭이 하나면 그 탭을, 여럿이면 한 번에 묻는다 */
async function confirmCloseWindow(): Promise<boolean> {
  const dirtyTabs = tabs.filter((t) => t.dirty);
  if (dirtyTabs.length === 0) return true;
  if (dirtyTabs.length === 1) {
    activate(dirtyTabs[0]);
    return confirmLeave(dirtyTabs[0], "close");
  }
  await flushComposition();
  const choice = await showChoice({
    title: "저장하지 않은 변경",
    message: `문서 ${dirtyTabs.length}개에 저장하지 않은 변경이 있습니다. 모두 저장할까요?`,
    detail: dirtyTabs.map((t) => t.doc.name).join(", "),
    choices: [
      { value: "discard", label: "모두 저장 안 함", kind: "danger" },
      { value: "save", label: "모두 저장", kind: "primary" },
    ],
    cancelLabel: "취소",
  });
  if (choice === "save") {
    for (const tab of dirtyTabs) {
      activate(tab);
      if (!(await save({}, tab))) return false;
    }
    return true;
  }
  if (choice === "discard") {
    for (const tab of dirtyTabs) discardDraft(tab);
    return true;
  }
  return false;
}

// ---- 초안 백업 (2-4) ---------------------------------------------------------------

let draftTimer = 0;

function scheduleDrafts(): void {
  window.clearInterval(draftTimer);
  const sec = getSetting("draftIntervalSec");
  if (sec > 0 && IS_TAURI) draftTimer = window.setInterval(() => void writeDrafts(), sec * 1000);
}

/** 저장하지 않은 탭마다 초안을 남긴다 */
async function writeDrafts(): Promise<void> {
  for (const tab of tabs) {
    if (!tab.dirty) continue;
    const text = workingText(tab);
    if (text === tab.lastDraftText) continue;
    try {
      await invoke("write_draft", { path: tab.doc.path, text, baseHash: tab.doc.hash });
      tab.lastDraftText = text;
    } catch {
      // 초안은 보조 수단 — 실패해도 편집은 계속한다
    }
  }
}

/** 연 문서에 초안이 남아 있으면 복구를 제안한다 (탭이 처음 앞으로 올 때) */
async function offerDraft(tab: Tab): Promise<void> {
  if (!IS_TAURI) return;
  const doc = tab.doc;
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
  if (choice !== "recover" || !tabs.includes(tab)) return;
  activate(tab);
  loadEditor(tab, draft.text);
  renderView(tab, draft.text);
  showMode("source");
  editor?.focus();
  showBanner("초안을 복구했습니다. 저장(Ctrl+S)해야 파일에 반영됩니다.", [], false, "", tab);
  saveSession();
}

// ---- 상태바·제목 ----------------------------------------------------------------------

function updateTitle(): void {
  const title = active ? `${active.dirty ? "● " : ""}${active.doc.name} — MdEditor` : "MdEditor";
  document.title = title;
  if (IS_TAURI) void getCurrentWindow().setTitle(title);
}

function updateDocChrome(): void {
  updateTitle();
  const tab = active;
  statusMode.hidden = !tab;
  statusEncoding.hidden = !tab;
  statusEol.hidden = !tab;
  if (!tab) {
    statusPath.textContent = "";
    statusPath.title = "";
    return;
  }
  const { info } = tab.doc;
  statusPath.textContent = tab.doc.path;
  statusPath.title = tab.doc.path;
  statusEncoding.textContent = `${info.bom ? `${info.encoding} BOM` : info.encoding}${tab.forcedEncoding ? " (지정)" : ""}`;
  statusEncoding.classList.toggle("warn", info.lossy);
  statusEncoding.title = info.lossy
    ? "일부 바이트를 해석하지 못했습니다 (손실 디코드, 읽기 전용) — 눌러서 다른 인코딩으로 다시 열기"
    : "인코딩 — 눌러서 다른 인코딩으로 다시 열기·변환";
  statusEol.textContent = info.mixed_eol ? `${info.eol} (혼합)` : info.eol;
  statusEol.title = info.mixed_eol
    ? `줄바꿈이 섞여 있습니다 (가장 많은 것: ${info.eol}) — 눌러서 한 가지로 변환`
    : "줄바꿈 — 눌러서 LF·CRLF로 변환";
}

// ---- 상태바 글자 수 (wordcount.ts) ---------------------------------------------------

let countTimer = 0;
const COUNT_CYCLE = ["words", "chars", "charsNoSpace"] as const;
/** 셀 때 빼는 것 — 그림(Mermaid SVG 안 스타일·라벨)과 수식의 MathML 사본(화면 글자와 겹침) */
const UNCOUNTED = `.${DIAGRAM_CLASS}, .katex-mathml, style`;

/** 보기 화면에 그린 본문 글자 — 그림·수식 사본은 뺀다 */
function countableText(root: HTMLElement): string {
  if (!root.querySelector(UNCOUNTED)) return root.textContent ?? "";
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeType === Node.ELEMENT_NODE && (node as Element).matches(UNCOUNTED) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeType === Node.TEXT_NODE) text += (n as CharacterData).data;
  return text;
}

/** 보기 화면에 그린 본문을 센다. 큰 문서는 그린 뒤 잠시 있다가 (10 MB 약 0.2 s) */
function recount(tab: Tab | null = active): void {
  if (!tab) return;
  window.clearTimeout(countTimer);
  tab.textCount = null;
  if (tab === active) updateCount();
  if (getSetting("statusCount") === "off") return;
  const run = (): void => {
    tab.textCount = countText(countableText(tab.article));
    if (tab === active) updateCount();
  };
  if (tab.large) countTimer = window.setTimeout(run, 300);
  else run();
}

function updateCount(): void {
  const kind = getSetting("statusCount");
  const count = active?.textCount ?? null;
  statusCount.hidden = !active || kind === "off" || !count;
  if (statusCount.hidden || !count) return;
  const n = (v: number): string => v.toLocaleString("ko-KR");
  const { words, chars, charsNoSpace } = count;
  statusCount.textContent =
    kind === "words" ? `${n(words)}단어` : kind === "chars" ? `${n(chars)}자` : `${n(charsNoSpace)}자 (공백 제외)`;
  statusCount.title = `단어 ${n(words)} · 글자 ${n(chars)} (공백 제외 ${n(charsNoSpace)})\n보기 화면에 그린 본문 기준 — 눌러서 표시 바꾸기`;
}

statusCount.addEventListener("click", () => {
  const kind = getSetting("statusCount");
  const i = COUNT_CYCLE.indexOf(kind as (typeof COUNT_CYCLE)[number]);
  setSetting("statusCount", COUNT_CYCLE[(i + 1) % COUNT_CYCLE.length]);
});

let flashTimer = 0;
/** 상태바 경로 자리에 잠깐 알림을 띄운다 */
function flashStatus(message: string): void {
  statusPath.textContent = message;
  window.clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => {
    statusPath.textContent = active?.doc.path ?? "";
  }, 1600);
}

/** 배너 — 탭마다 따로 기억하고 활성 탭 것만 보인다. `tab`이 null이면(열린 문서 없음) 화면에만 */
function showBanner(message: string, actions: BannerAction[] = [], warn = false, kind = "", tab: Tab | null = active): void {
  const state: BannerState = { message, actions, warn, kind };
  if (tab) tab.banner = state;
  if (tab === active) paintBanner(state);
}

function paintBanner(state: BannerState | null): void {
  if (!state) {
    banner.hidden = true;
    return;
  }
  $("#banner-text").textContent = state.message;
  $("#banner-actions").replaceChildren(
    ...state.actions.map((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = a.label;
      b.addEventListener("click", a.run);
      return b;
    }),
  );
  banner.classList.toggle("warn", state.warn);
  banner.hidden = false;
}

function hideBanner(tab: Tab | null = active): void {
  if (tab) tab.banner = null;
  if (tab !== active) return;
  // 배너 버튼으로 닫으면 누른 버튼이 숨으면서 포커스가 body로 빠진다 — 보던 화면으로 돌려 바로 이어서 입력하게
  const hadFocus = banner.contains(document.activeElement);
  banner.hidden = true;
  if (!hadFocus) return;
  if (active && active.mode !== "view" && editor) editor.focus();
  else viewer.focus({ preventScroll: true });
}

/** 인코딩 메뉴 — "다시 열기"는 바이트를 두고 해석만(Encode in), "변환"은 저장 바이트를 바꾼다(Convert to) */
async function encodingMenu(): Promise<void> {
  if (!active) return;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 인코딩을 바꿀 수 없습니다.");
    return;
  }
  const tab = active;
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
  if (!choice || tab !== active) return;
  const [action, label, bom] = choice.split(":");
  if (action === "reopen") {
    await reload({ encoding: label }, tab);
    return;
  }
  const ok = await showDialog({
    title: "인코딩 변환",
    message: `이 파일을 ${label}${bom ? " BOM" : ""}(으)로 변환해 저장합니다. 파일 바이트가 바뀝니다.`,
    confirmLabel: "변환해 저장",
    cancelLabel: "취소",
  });
  if (ok) await save({ convertTo: label, bom: bom === "bom" }, tab);
}

/** 줄바꿈 메뉴 — 모든 줄을 LF 또는 CRLF로 바꿔 바로 저장한다 (결정 D5). 평소 저장은 줄별 원래 줄바꿈을 지킨다 */
async function eolMenu(): Promise<void> {
  if (!active) return;
  if (!IS_TAURI) {
    showBanner("브라우저 미리보기에서는 줄바꿈을 바꿀 수 없습니다.");
    return;
  }
  const tab = active;
  const { info } = tab.doc;
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
  if (!choice || tab !== active) return;
  if (!info.mixed_eol && info.eol === choice) {
    flashStatus(`이미 모든 줄이 ${choice}입니다`);
    return;
  }
  const ok = await showDialog({
    title: "줄바꿈 변환",
    message: `이 파일의 모든 줄바꿈을 ${choice}(으)로 바꿔 저장합니다. 파일 바이트가 바뀝니다.${tab.dirty ? " 저장하지 않은 편집도 함께 저장됩니다." : ""}`,
    confirmLabel: "변환해 저장",
    cancelLabel: "취소",
  });
  if (ok) await save({ eol: choice }, tab);
}

statusEncoding.addEventListener("click", () => void encodingMenu());
statusEol.addEventListener("click", () => void eolMenu());
statusMode.addEventListener("click", (event) => {
  if (!active) return;
  const now = active.mode;
  const item = (mode: Mode, label: string) => ({ label: `${mode === now ? "✓ " : "　"}${label}`, action: () => setMode(mode) });
  showContextMenu(event, [
    item("view", "보기 (Ctrl+/)"),
    item("source", "소스 (Ctrl+/)"),
    item("split", "분할 — 소스 | 미리보기 (Ctrl+Shift+/)"),
  ]);
});

// ---- 링크 ------------------------------------------------------------------

/** 활성 본문 안의 id — 탭마다 본문이 따로라 `document.getElementById`는 다른 탭의 같은 id를 집을 수 있다 */
function findInActive(id: string): HTMLElement | null {
  return active?.article.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ?? null;
}

viewer.addEventListener("click", (event) => {
  // 로컬 .md 링크는 DOMPurify가 href를 떼도 data-local-path로 열린다
  const a = (event.target as HTMLElement).closest("a[href], a[data-local-path]") as HTMLAnchorElement | null;
  if (!a || !active?.article.contains(a)) return;
  const href = a.getAttribute("href") ?? "";
  event.preventDefault();
  if (a.dataset.localPath) {
    void openPath(a.dataset.localPath);
  } else if (href.startsWith("#")) {
    findInActive(decodeURIComponent(href.slice(1)))?.scrollIntoView({ block: "start" });
  } else if (/^(https?|mailto):/i.test(href)) {
    void openUrl(href);
  }
});

// ---- 목차 -----------------------------------------------------------------------

// 이동은 scrollIntoView — 제목의 scroll-margin-top(설정 '제목 이동 시 위쪽 여백')만큼 위를 남긴다. 소스 모드는 그 줄로
toc.addEventListener("click", (event) => {
  const a = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
  if (!a || !active) return;
  event.preventDefault();
  if (active.mode !== "view" && editor) {
    // 분할 뷰는 편집기를 옮기면 미리보기가 따라온다
    editor.scrollToLine(Number(a.dataset.line ?? 0));
    return;
  }
  findInActive(decodeURIComponent(a.hash.slice(1)))?.scrollIntoView({ block: "start" });
});

function indexChunks(tab: Tab): void {
  const { headings } = tab;
  tab.chunks = Array.from(tab.article.children as HTMLCollectionOf<HTMLElement>).filter((el) => el.classList.contains(CHUNK_CLASS));
  const chunkIndex = new Map(tab.chunks.map((c, i) => [c as Element, i]));
  const start = new Array<number>(tab.chunks.length).fill(headings.length);
  for (let h = headings.length - 1; h >= 0; h--) {
    const c = chunkIndex.get(headings[h].closest(`.${CHUNK_CLASS}`)!);
    if (c !== undefined) start[c] = h;
  }
  // 제목 없는 묶음은 다음 묶음의 시작 번호를 물려받는다
  for (let c = start.length - 2; c >= 0; c--) start[c] = Math.min(start[c], start[c + 1]);
  tab.chunkHeadingStart = start;
}

function updateActiveHeading(): void {
  const tab = active;
  if (!tab) return;
  let next: HTMLAnchorElement | null = null;
  if (tab.mode !== "view" && editor && editorTab === tab) {
    // 소스 모드: 화면 맨 위 줄 이하에서 시작한 마지막 제목
    const top = editor.topLine();
    let hit: TocEntry | undefined;
    for (const e of tab.tocEntries) {
      if (e.line <= top) hit = e;
      else break;
    }
    next = hit ? (tab.tocLinks.get(hit.id) ?? null) : null;
  } else {
    const { headings, chunks, chunkHeadingStart } = tab;
    if (headings.length === 0) return;
    // 이동한 제목은 여백만큼 아래에 멈춘다 — 그 선까지 온 제목을 현재 제목으로 본다. 여백은 본문 줌을 따라 커진다
    const line = viewer.getBoundingClientRect().top + getSetting("headingScrollOffset") * zoom + 8;
    // 제목 위치는 문서 순서대로 커진다 — 선을 넘지 않은 첫 제목을 이진 탐색 (10 MB 샘플은 제목 2만 3천 개라 스크롤마다 전부 재면 끊긴다)
    let lo = 0;
    let hi = headings.length;
    if (chunks.length > 0) {
      // 화면 밖(건너뛴) 묶음 안 제목은 묶음 상자 밖으로 넘친 자리를 돌려준다 — 선이 걸린 묶음을 상자로 먼저 찾고 그 안에서만 잰다
      let a = 0;
      let b = chunks.length;
      while (a < b) {
        const mid = (a + b) >> 1;
        if (chunks[mid].getBoundingClientRect().top <= line) a = mid + 1;
        else b = mid;
      }
      const c = a - 1;
      lo = c < 0 ? 0 : chunkHeadingStart[c];
      hi = c < 0 ? 0 : (chunkHeadingStart[c + 1] ?? headings.length);
    }
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (headings[mid].getBoundingClientRect().top <= line) lo = mid + 1;
      else hi = mid;
    }
    next = lo > 0 ? (tab.tocLinks.get(headings[lo - 1].id) ?? null) : null;
  }
  if (next === tab.activeLink) return;
  tab.activeLink?.classList.remove("active");
  next?.classList.add("active");
  tab.activeLink = next;
}
viewer.addEventListener("scroll", () => {
  saveSession();
  onPaneScroll("viewer");
  if (headingTick) return;
  headingTick = requestAnimationFrame(() => {
    headingTick = 0;
    updateActiveHeading();
  });
});

// ---- 찾기 (보기 모드, 2-5) ----------------------------------------------------------

const findBar = initFindBar(
  () => active?.article ?? null,
  () => viewer.focus({ preventScroll: true }),
);

// ---- 줌·테마 ----------------------------------------------------------------------

function applyZoom(next: number): void {
  zoom = Math.min(3, Math.max(0.5, Math.round(next * 10) / 10));
  viewer.style.setProperty("--doc-zoom", String(zoom));
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
  // 그림(Mermaid)은 라이트·다크 팔레트가 따로라 바뀐 쪽으로 다시 그린다 (뒤 탭은 앞으로 올 때)
  if (active) void renderDiagrams(active.article, theme.base === "dark");
  editor?.setDark(theme.base === "dark");
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
  } else if (key === "statusCount") {
    if (!active || active.textCount) updateCount();
    else recount(active);
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
    multiple: true,
    directory: false,
    filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mkdn", "mdwn", "txt"] }],
  });
  const paths = typeof picked === "string" ? [picked] : (picked ?? []);
  for (const path of paths) await openPath(path);
}

/** 이 크기 이상인 문서는 인쇄 전에 묻는다 (결정 D7, 기준은 사용자 지정 1 MB). 2 MB에서도 미리보기가 오래 멈췄다 */
const PRINT_WARN_SIZE = 1024 * 1024;

/** Ctrl+P — 큰 문서는 확인을 받은 뒤에만 인쇄한다. 미리보기가 멈춰 강제 종료하다 편집 중 내용을 잃는 사고를 막는다 */
async function printDocument(): Promise<void> {
  const tab = active;
  const size = tab ? Math.max(tab.doc.info.byte_len, workingText(tab).length) : 0;
  if (size >= PRINT_WARN_SIZE) {
    // primary 선택지가 없으면 처음 포커스는 취소
    const choice = await showChoice({
      title: "큰 문서 인쇄",
      message:
        `이 문서는 ${(size / 1024 / 1024).toFixed(1)} MB입니다. 큰 문서는 인쇄 미리보기가 오래 멈추거나 응답하지 않을 수 있습니다.` +
        (tabs.some((t) => t.dirty) ? " 저장하지 않은 변경이 있으니 먼저 저장해 두세요." : ""),
      choices: [{ value: "print", label: "계속" }],
      cancelLabel: "취소",
    });
    if (choice !== "print") return;
  }
  window.print();
}

// ---- 세션 복원 (로드맵 3-5) -------------------------------------------------------------

let sessionTimer = 0;
/** 세션을 시작 때 다시 열기 전에는 저장하지 않는다 — 빈 탭 목록으로 지난 세션을 덮지 않게 */
let sessionReady = false;

function saveSession(): void {
  if (!sessionReady) return;
  window.clearTimeout(sessionTimer);
  sessionTimer = window.setTimeout(saveSessionNow, 500);
}

/** 탭이 지금 보는 소스 줄 — 활성 탭은 화면에서 재고, 뒤 탭은 떠날 때 남긴 값 */
function sessionLine(tab: Tab): number {
  if (tab.needsRender) return tab.restoreLine ?? (tab.mode === "view" ? tab.viewLine : tab.editorLine);
  if (tab !== active) return tab.mode === "view" ? tab.viewLine : tab.editorLine;
  if (tab.mode === "view") return viewTopLine();
  return editor && editorTab === tab ? editor.topLine() : tab.editorLine;
}

// ---- 분할 뷰 스크롤 동기 (로드맵 3-3) ---------------------------------------------------
// 편집기 맨 위 줄(소수)을 미리보기 블록 닻(`data-line`)으로 보간해 맞추고, 미리보기를 스크롤하면 거꾸로 맞춘다.
// 한쪽을 맞추면 그쪽에서도 스크롤 이벤트가 오므로 잠깐 그 방향을 잠근다. 닻 위치는 본문 크기가 바뀌면(이미지 로드·
// 그림·줌·폭) 다시 잰다. 큰 문서(블록 묶음)는 화면 밖 블록 위치를 믿을 수 없어 블록 단위로 맞춘다

let syncCache: { tab: Tab; map: SyncMap; margin: number } | null = null;
let syncLock: { from: "editor" | "viewer"; until: number } | null = null;
let syncFrame = 0;
const SYNC_LOCK_MS = 120;
const articleResize = new ResizeObserver(() => {
  syncCache = null;
});

function syncMapFor(tab: Tab): { map: SyncMap; margin: number } {
  if (syncCache?.tab === tab) return syncCache;
  const base = viewer.scrollTop - viewer.getBoundingClientRect().top;
  const anchors: { line: number; y: number }[] = [];
  for (const el of tab.article.children as HTMLCollectionOf<HTMLElement>) {
    if (el.dataset.line !== undefined) anchors.push({ line: Number(el.dataset.line), y: el.getBoundingClientRect().top + base });
  }
  // 끝 닻 — 문서 마지막 줄과 스크롤 끝
  const lines = editor && editorTab === tab ? editor.view.state.doc.lines : workingText(tab).split("\n").length;
  anchors.push({ line: lines, y: viewer.scrollHeight });
  const map = buildSyncMap(anchors);
  // 첫 블록 위 여백(본문 안쪽 여백)만큼은 맞춘 자리에서 빼 맨 위에서 맨 위로 가게 한다
  syncCache = { tab, map, margin: map.ys[0] ?? 0 };
  return syncCache;
}

const syncLocked = (from: "editor" | "viewer"): boolean => syncLock !== null && syncLock.from !== from && performance.now() < syncLock.until;

function syncViewerFromEditor(): void {
  const tab = active;
  if (!tab || tab.mode !== "split" || !editor || editorTab !== tab) return;
  syncLock = { from: "editor", until: performance.now() + SYNC_LOCK_MS };
  if (tab.large) {
    scrollViewToLine(editor.topLine());
    return;
  }
  const { map, margin } = syncMapFor(tab);
  viewer.scrollTop = Math.max(0, yForLine(map, editor.topLineFraction()) - margin);
}

function syncEditorFromViewer(): void {
  const tab = active;
  if (!tab || tab.mode !== "split" || !editor || editorTab !== tab) return;
  syncLock = { from: "viewer", until: performance.now() + SYNC_LOCK_MS };
  if (tab.large) {
    editor.scrollToLine(viewTopLine());
    return;
  }
  const { map, margin } = syncMapFor(tab);
  editor.scrollToLineFraction(lineForY(map, viewer.scrollTop + margin));
}

function onPaneScroll(from: "editor" | "viewer"): void {
  if (active?.mode !== "split" || syncLocked(from)) return;
  cancelAnimationFrame(syncFrame);
  syncFrame = requestAnimationFrame(from === "editor" ? syncViewerFromEditor : syncEditorFromViewer);
}

function saveSessionNow(): void {
  window.clearTimeout(sessionTimer);
  if (!sessionReady || !IS_TAURI) return;
  const session: Session = {
    tabs: tabs.map((t) => ({ path: t.doc.path, mode: t.mode, line: sessionLine(t) })),
    active: active ? Math.max(0, tabs.indexOf(active)) : 0,
  };
  writeSession(session.tabs.length ? session : null);
}

/**
 * 지난 세션의 탭을 다시 연다. 문서는 읽어 두되 그리기는 탭이 앞으로 올 때 한다(탭 20개도 시작이 느려지지 않게).
 * `activateSaved`면 지난 활성 탭을 앞으로, 아니면(더블클릭으로 연 파일이 있으면) 그 파일 앞에 끼워 둔다
 */
async function restoreSession(session: Session, activateSaved: boolean): Promise<void> {
  let missing = 0;
  let wanted: Tab | null = null;
  let index = 0;
  for (let i = 0; i < session.tabs.length; i++) {
    const saved = session.tabs[i];
    if (findTab(saved.path)) continue;
    const tab = await openPath(saved.path, { background: true, mode: saved.mode, line: saved.line, index: index });
    if (!tab) {
      missing++;
      continue;
    }
    index = tabs.indexOf(tab) + 1;
    if (i === session.active) wanted = tab;
  }
  if (activateSaved) {
    const tab = wanted ?? tabs[0];
    if (tab) activate(tab);
  } else renderTabs();
  if (missing > 0) {
    const message = `지난번에 열어 둔 파일 ${missing}개를 찾을 수 없어 다시 열지 않았습니다.`;
    if (active) showBanner(message, [{ label: "닫기", run: () => hideBanner() }]);
    else flashStatus(message);
  }
}

// ---- 단축키 ------------------------------------------------------------------------
// 캡처 단계에서 받는다 — 편집기(CM6)가 먼저 가져가면 안 되는 앱 단축키(Ctrl+/·Ctrl+S 등)가 있다.
// 찾기(Ctrl+F)·바꾸기(Ctrl+H)는 소스 모드에서 편집기 몫이다.

window.addEventListener(
  "keydown",
  (event) => {
    if (event.isComposing || event.keyCode === 229) {
      // 조합 중 Ctrl+S·Ctrl+P — 글자를 먼저 확정하고 저장·인쇄한다. 그냥 두면 Ctrl+P는 웹뷰 기본 인쇄로 가서
      // 큰 문서 확인(D7)을 건너뛰고, Ctrl+S는 확정만 되고 저장은 안 된다 (fidelity-report Priority fix 1·4)
      if ((event.ctrlKey || event.metaKey) && (event.code === "KeyS" || event.code === "KeyP") && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        event.stopPropagation();
        const isSave = event.code === "KeyS";
        const shift = event.shiftKey;
        void flushComposition(isSave).then(() => {
          if (isSave) void (shift ? saveAs() : save());
          else void printDocument();
        });
      }
      return;
    }
    if (document.querySelector("dialog[open]")) return; // 팝업이 열려 있으면 팝업 몫
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const take = (): void => {
      event.preventDefault();
      event.stopPropagation();
    };
    const mode = active?.mode ?? "view";
    if (ctrl && key === "s") {
      take();
      void (event.shiftKey ? saveAs() : save());
    } else if (ctrl && event.shiftKey && (event.code === "Slash" || event.key === "?")) {
      take();
      setMode(mode === "split" ? "source" : "split");
    } else if (ctrl && (event.key === "/" || event.code === "Slash")) {
      take();
      setMode(mode === "view" ? "source" : "view");
    } else if (ctrl && !event.shiftKey && key === "f" && mode === "view" && active) {
      take();
      findBar.open();
    } else if (ctrl && (key === "f" || key === "h") && mode === "split" && editor) {
      // 분할 뷰의 찾기·바꾸기는 소스 편집기 몫 — 포커스가 미리보기에 있어도
      take();
      editor.focus();
      editor.openSearch();
    } else if (ctrl && key === "h" && mode === "view" && active) {
      take();
      setMode("source");
      editor?.openSearch();
    } else if (ctrl && key === "o") {
      take();
      void pickAndOpen();
    } else if (ctrl && key === "p") {
      take();
      void printDocument();
    } else if (ctrl && key === "w") {
      take();
      if (active) void closeTab(active);
    } else if (ctrl && event.shiftKey && key === "t") {
      take();
      void reopenClosedTab();
    } else if (ctrl && (key === "tab" || key === "pagedown" || key === "pageup")) {
      take();
      cycleTab(key === "pageup" || (key === "tab" && event.shiftKey) ? -1 : 1);
    } else if (ctrl && !event.shiftKey && !event.altKey && /^Digit[1-9]$/.test(event.code)) {
      take();
      const n = Number(event.code.slice(5));
      const tab = n === 9 ? tabs[tabs.length - 1] : tabs[n - 1];
      if (tab) activate(tab);
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
      if (active?.tocEntries.length) sidebar.hidden = !sidebar.hidden;
    } else if (ctrl && event.shiftKey && key === "e") {
      take();
      nav.toggle();
    } else if (ctrl && event.key === ",") {
      take();
      settingsDialog.open();
    } else if (key === "f5" && active) {
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

/** 디스크의 문서가 바뀌었다 (watch.rs) — 저장하지 않은 변경이 없으면 조용히 다시 읽고, 있으면 고르게 한다 */
function onFileChanged(path: string, hash: string): void {
  const tab = findTab(path);
  if (!tab) return;
  if (tab.missing) {
    // 사라졌던 파일이 다시 생겼다 — 같은 내용이면 배너만 거두고, 다르면 아래로 이어서 다시 읽기·배너
    tab.missing = false;
    if (tab.banner?.kind === "missing") hideBanner(tab);
  }
  if (hash === tab.doc.hash) return; // 우리가 저장한 내용
  if (!tab.dirty) {
    void reload({ discard: true }, tab);
    return;
  }
  // 편집 중에는 덮어쓰지 않는다 (2-3) — 고르게 하고, 유지하면 다음 저장에서 충돌 팝업이 뜬다
  showBanner(
    "다른 프로그램이 이 파일을 바꿨습니다. 편집한 내용은 아직 저장하지 않았습니다.",
    [
      { label: "비교", run: () => void startCompare(tab) },
      { label: "다시 읽기 (내 변경 버림)", run: () => void reload({ discard: true }, tab) },
      { label: "내 변경 유지", run: () => hideBanner(tab) },
    ],
    true,
    "changed",
    tab,
  );
}

/**
 * AI 훅이 만든 문서 (로드맵 3-6, lib.rs `hook-file`) — 백엔드는 창을 앞으로 가져오지 않고 작업 표시줄만 깜빡인다.
 * 설정 '새 문서 목록에 쌓기'면 보던 문서를 그대로 두고 목록에만, '뒤 탭'이면 뒤 탭으로도, '바로 열기'면 예전처럼 앞으로.
 * 열린 문서가 없으면 볼 것이 없으니 바로 연다
 */
async function receiveHookFiles(paths: string[], source: string): Promise<void> {
  const how = getSetting("hookDocs");
  for (const path of paths) {
    const shown = active !== null && samePath(active.doc.path, path);
    if (!active || how === "open") {
      const tab = await openPath(path);
      inbox.add(tab?.doc.path ?? path, source, tab !== null);
      if (how === "open" && IS_TAURI) {
        const win = getCurrentWindow();
        await win.unminimize().catch(() => undefined);
        await win.setFocus().catch(() => undefined);
      }
    } else if (how === "background") {
      const tab = await openPath(path, { background: true });
      inbox.add(tab?.doc.path ?? path, source, shown);
    } else {
      inbox.add(findTab(path)?.doc.path ?? path, source, shown);
    }
  }
}

function onFileMissing(path: string): void {
  const tab = findTab(path);
  if (!tab) return;
  tab.missing = true;
  showBanner(
    tab.dirty
      ? "파일이 삭제되거나 이동됐습니다. 저장(Ctrl+S)하면 같은 자리에 다시 만들 수 있습니다."
      : "파일이 삭제되거나 이동됐습니다. 마지막으로 읽은 내용을 보여 줍니다.",
    [],
    true,
    "missing",
    tab,
  );
}

async function init(): Promise<void> {
  await listen<string[]>("open-file", (event) => {
    void (async () => {
      for (const path of event.payload) await openPath(path);
    })();
  });

  await listen<{ paths: string[]; source: string }>("hook-file", (event) => void receiveHookFiles(event.payload.paths, event.payload.source));
  await listen<{ path: string; hash: string }>("file-changed", (event) => onFileChanged(event.payload.path, event.payload.hash));
  await listen<string>("file-missing", (event) => onFileMissing(event.payload));

  // 웹뷰 기본 오른쪽 클릭 메뉴의 '인쇄'도 Ctrl+P와 같은 큰 문서 확인을 거친다 (print_menu.rs)
  await listen("print-requested", () => void printDocument());

  await getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "over" || event.payload.type === "enter") {
      viewer.classList.add("drag-over");
    } else if (event.payload.type === "drop") {
      viewer.classList.remove("drag-over");
      const paths = event.payload.paths;
      if (active && active.mode !== "view" && paths.length > 0 && paths.every((p) => IMAGE_EXT_RE.test(p))) {
        void dropImages(paths, event.payload.position);
        return;
      }
      void (async () => {
        for (const path of paths.filter((p) => !IMAGE_EXT_RE.test(p))) await openPath(path);
      })();
    } else {
      viewer.classList.remove("drag-over");
    }
  });

  // 저장하지 않은 변경이 있으면 창을 닫기 전에 묻는다 (제목 표시줄 닫기·Alt+F4 모두). 막지 않으면 API가 창을 없앤다
  await getCurrentWindow().onCloseRequested(async (event) => {
    if (!(await confirmCloseWindow())) {
      event.preventDefault();
      return;
    }
    saveSessionNow();
  });

  const pending = await invoke<string[]>("take_pending_paths");
  const session = getSetting("restoreSession") === "restore" ? readSession() : null;
  // 더블클릭으로 연 파일을 먼저 보이고, 지난 세션 탭은 그 앞에 뒤에서 채운다
  for (const path of pending) await openPath(path);
  if (session) await restoreSession(session, pending.length === 0);
  sessionReady = true;
  if (!active) showWelcome();
  saveSession();
  void refreshDefaultAppStatus();
  // 관리자 권한 창에는 탐색기 더블클릭이 전달되지 않는다(UIPI) — 막을 수 없으니 상태바로 알린다 (스펙 경계 사례)
  $("#status-elevated").hidden = !(await invoke<boolean>("is_elevated").catch(() => false));
  void checkWebviewVersion();
}

/** 설치기의 최소 WebView2(150)보다 낮은 런타임이면 알린다 — 한글 IME·렌더 수정이 그 버전에 기대고 있다 (스펙 경계 사례) */
const MIN_WEBVIEW2_MAJOR = 150;
async function checkWebviewVersion(): Promise<void> {
  const version = await invoke<string | null>("webview_version").catch(() => null);
  const major = Number(version?.split(".")[0]);
  if (!version || !Number.isFinite(major) || major >= MIN_WEBVIEW2_MAJOR) return;
  const message = `WebView2 런타임이 ${version}입니다. ${MIN_WEBVIEW2_MAJOR} 이상에서 시험했습니다 — 한글 입력·렌더가 어긋나면 Microsoft Edge WebView2 런타임을 업데이트하세요.`;
  if (active) showBanner(message, [], true);
  else flashStatus(message);
}

initSidebarResize();
initSplitResize(() => {
  syncCache = null;
  editor?.view.requestMeasure();
});
updateDocChrome();
// 저장된 열림 상태·폭을 적용한 첫 그림에서는 애니메이션을 끈다
requestAnimationFrame(() => requestAnimationFrame(() => app.classList.remove("no-anim")));

if (IS_TAURI) {
  initTitlebar();
  void init();
} else {
  // Tauri 밖(브라우저에서 `npm run dev`)에서는 샘플을 직접 불러 렌더·테마를 눈으로 확인한다.
  // ?sample=a.md,b.md 로 여러 탭, ?mode=source 로 소스 모드
  const params = new URLSearchParams(location.search);
  void (async () => {
    for (const sample of (params.get("sample") ?? "samples/showcase.md").split(",")) await openPath(sample);
    if (params.get("mode") === "source") setMode("source");
    sessionReady = true;
    if (!active) showWelcome();
  })();
}
