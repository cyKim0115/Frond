/**
 * 소스 편집기 (로드맵 2-1) — CodeMirror 6 plain + Markdown(GFM) 문법 색.
 * 문서 텍스트는 LF 정규화 텍스트(`load_document`의 `text`)를 그대로 받고, 저장도 `getText()`(LF)를 코어에 넘긴다 —
 * 줄바꿈·인코딩 복원은 코어(`save_to`)가 원본 EOL 맵으로 한다. 그래서 편집기의 `lineSeparator`는 LF 고정이다.
 * 색은 테마 토큰(src/theme/themes.ts의 문서 토큰, `.cm-editor`에도 적용됨)을 CSS 변수로 쓴다. 커서·선택 색은 theme/dark.css.
 */

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, keymap, placeholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";

export interface EditorHooks {
  /** 문서 내용이 바뀔 때마다 (입력·되돌리기·바꾸기) */
  onChange(): void;
  /** 붙여넣은 이미지 파일 — 처리했으면 삽입할 마크다운 텍스트를 돌려준다 */
  onPasteImages(files: File[]): Promise<string | null>;
}

const v = (name: string) => `var(--${name})`;

/** 마크다운 문법 색 — github-markdown 팔레트(prettylights) 토큰을 그대로 쓴다 */
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, color: v("color-prettylights-syntax-markup-heading"), fontWeight: "600" },
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: v("fgColor-accent") },
  { tag: tags.monospace, color: v("color-prettylights-syntax-string") },
  { tag: tags.quote, color: v("fgColor-muted") },
  { tag: tags.list, color: v("color-prettylights-syntax-markup-list") },
  { tag: [tags.processingInstruction, tags.meta, tags.contentSeparator], color: v("fgColor-muted") },
  { tag: tags.comment, color: v("color-prettylights-syntax-comment") },
]);

/** 검색 패널 등 CM6 문구 — 한국어 */
const PHRASES = EditorState.phrases.of({
  Find: "찾기",
  Replace: "바꿀 내용",
  next: "다음",
  previous: "이전",
  all: "모두",
  "match case": "대소문자 구분",
  "by word": "단어 단위",
  regexp: "정규식",
  replace: "바꾸기",
  "replace all": "모두 바꾸기",
  close: "닫기",
  "current match": "현재 일치",
  "replaced $ matches": "$개 바꿈",
  "replaced match on line $": "$행에서 바꿈",
  "on line": "행",
  "Go to line": "줄로 이동",
  go: "이동",
  "Control character": "제어 문자",
});

export interface SourceEditor {
  view: EditorView;
  getText(): string;
  /** 문서를 통째로 바꾼다 — 되돌리기 기록도 새로 시작한다 */
  setText(text: string): void;
  /**
   * 다른 탭의 편집기 상태로 갈아 끼운다 (로드맵 3-1 — 탭마다 되돌리기 기록·커서·선택이 남는다).
   * 줄바꿈 설정은 탭과 관계없으니 지금 값으로 다시 맞춘다. 읽기 전용은 탭(문서)마다라 호출자가 `setReadOnly`로 맞춘다
   */
  setState(state: EditorState): void;
  setReadOnly(readOnly: boolean): void;
  setLineWrapping(wrap: boolean): void;
  /** 화면 맨 위에 보이는 줄 (0 기준) */
  topLine(): number;
  /** `line`(0 기준)을 화면 맨 위로. `moveCursor`면 커서도 그 줄 첫머리로 */
  scrollToLine(line: number, moveCursor?: boolean): void;
  insertAtCursor(text: string): void;
  focus(): void;
  openSearch(): void;
}

export function createSourceEditor(parent: HTMLElement, hooks: EditorHooks): SourceEditor {
  const readOnly = new Compartment();
  const wrapping = new Compartment();
  // setText가 상태를 새로 만들어도 유지할 값
  let readOnlyOn = false;
  let wrapOn = true;

  const baseExtensions = (): Extension[] => [
    history(),
    drawSelection(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    search({ top: true }),
    markdown({ base: markdownLanguage }),
    syntaxHighlighting(markdownHighlight),
    PHRASES,
    placeholder("빈 문서"),
    EditorState.lineSeparator.of("\n"),
    readOnly.of(EditorState.readOnly.of(readOnlyOn)),
    wrapping.of(wrapOn ? EditorView.lineWrapping : []),
    keymap.of([{ key: "Mod-h", run: openSearchPanel }, ...searchKeymap, ...historyKeymap, ...defaultKeymap, indentWithTab]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) hooks.onChange();
    }),
    EditorView.domEventHandlers({
      paste(event, view) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0 || view.state.readOnly) return false;
        event.preventDefault();
        void hooks.onPasteImages(files).then((text) => {
          if (text) insert(view, text);
        });
        return true;
      },
    }),
    EditorView.contentAttributes.of({ spellcheck: "false", "aria-label": "Markdown 소스" }),
  ];

  const view = new EditorView({ parent, state: EditorState.create({ doc: "", extensions: baseExtensions() }) });

  function insert(target: EditorView, text: string): void {
    const { from, to } = target.state.selection.main;
    target.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
      scrollIntoView: true,
      userEvent: "input.paste",
    });
  }

  return {
    view,
    getText: () => view.state.doc.toString(),
    setText(text) {
      // 새 상태로 갈아 끼워 되돌리기 기록을 끊는다 (다른 파일·다시 읽기로 넘어가 되돌리기 하는 사고 방지)
      view.setState(EditorState.create({ doc: text, extensions: baseExtensions() }));
    },
    setState(state) {
      view.setState(state);
      view.dispatch({ effects: wrapping.reconfigure(wrapOn ? EditorView.lineWrapping : []) });
    },
    setReadOnly(value) {
      readOnlyOn = value;
      view.dispatch({ effects: readOnly.reconfigure(EditorState.readOnly.of(value)) });
    },
    setLineWrapping(wrap) {
      wrapOn = wrap;
      view.dispatch({ effects: wrapping.reconfigure(wrap ? EditorView.lineWrapping : []) });
    },
    topLine() {
      const top = Math.max(0, view.scrollDOM.scrollTop - view.documentPadding.top);
      let block = view.lineBlockAtHeight(top);
      // 반 줄도 안 보이는 윗줄은 건너뛴다 — scrollToLine의 위쪽 여백(scrollIntoView yMargin)으로 앞 빈 줄이 몇 px
      // 걸치면 그 줄을 맨 위로 쳐서, 보기 ↔ 소스 왕복 때 보기 화면이 한 블록 앞으로 밀렸다 (Phase 2 실기 B-1)
      if (block.bottom - top < view.defaultLineHeight / 2 && block.to < view.state.doc.length) {
        block = view.lineBlockAt(block.to + 1);
      }
      return view.state.doc.lineAt(block.from).number - 1;
    },
    scrollToLine(line, moveCursor = false) {
      const doc = view.state.doc;
      const pos = doc.line(Math.min(doc.lines, Math.max(1, line + 1))).from;
      view.dispatch({
        ...(moveCursor ? { selection: { anchor: pos } } : {}),
        effects: EditorView.scrollIntoView(pos, { y: "start" }),
      });
    },
    insertAtCursor: (text) => insert(view, text),
    focus: () => view.focus(),
    openSearch: () => void openSearchPanel(view),
  };
}
