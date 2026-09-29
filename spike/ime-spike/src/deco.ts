/**
 * C면용 라이브프리뷰 데코레이션 — 제품(Phase 5)의 축소판.
 *
 * - ViewPlugin: `**`·`*`·`~~`·백틱 마크를 replace 데코로 숨기고 굵게/기울임 스타일을 입힌다.
 *   이미지 링크는 인라인 위젯으로 바꾼다. `visibleRanges`만 훑는다.
 * - StateField: 가로줄(`---`)을 블록 위젯으로 바꾼다 (블록 데코는 ViewPlugin에서 못 준다).
 * - IME 가드: 조합 중(`view.composing` 또는 `input.type.compose` 트랜잭션)에는 재빌드 대신 `map`만 하고,
 *   compositionend 뒤 빈 트랜잭션으로 flush한다. 체크박스로 끌 수 있어 차이를 볼 수 있다.
 * - 캐럿 줄 원문 노출: 선택 영역이 닿은 줄은 데코를 걸지 않는다 (Typora식). 끄면 위젯 바로 앞에서 조합하는 ⑧을 더 세게 시험한다.
 */

import { syntaxTree } from "@codemirror/language";
import { Annotation, EditorState, Range, RangeSet, StateField, Transaction } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { log } from "./log";

export const decoOptions = { imeGuard: true, revealCaretLine: true };

/** compositionend 뒤 flush용 빈 트랜잭션 표식. */
export const flushAnnotation = Annotation.define<boolean>();

class ImageWidget extends WidgetType {
  constructor(readonly alt: string) {
    super();
  }
  eq(other: ImageWidget) {
    return other.alt === this.alt;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-image-widget";
    span.textContent = `🖼 ${this.alt}`;
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

class HrWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const hr = document.createElement("div");
    hr.className = "cm-hr-widget";
    return hr;
  }
}

const strong = Decoration.mark({ class: "cm-md-strong" });
const em = Decoration.mark({ class: "cm-md-em" });
const strike = Decoration.mark({ class: "cm-md-strike" });
const code = Decoration.mark({ class: "cm-md-code" });
const hide = Decoration.replace({});

function isComposingTransaction(tr: Transaction) {
  return tr.isUserEvent("input.type.compose");
}

function caretLines(state: EditorState): Set<number> {
  const set = new Set<number>();
  if (!decoOptions.revealCaretLine) return set;
  for (const r of state.selection.ranges) {
    const from = state.doc.lineAt(r.from).number;
    const to = state.doc.lineAt(r.to).number;
    for (let n = from; n <= to; n++) set.add(n);
  }
  return set;
}

/** 문서 시작 `---` … `---` 구간. lang-markdown은 front matter를 모르므로 이 안에는 데코를 걸지 않는다. */
function frontMatterRange(state: EditorState): { from: number; to: number; lines: number } | null {
  if (state.doc.lines < 2 || state.doc.line(1).text !== "---") return null;
  for (let n = 2; n <= Math.min(state.doc.lines, 200); n++) {
    const l = state.doc.line(n);
    if (l.text === "---") return { from: 0, to: l.to, lines: n };
  }
  return null;
}

const frontMatterLine = Decoration.line({ class: "cm-frontmatter" });

function buildInline(view: EditorView): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const reveal = caretLines(view.state);
  const doc = view.state.doc;
  const fm = frontMatterRange(view.state);
  if (fm) for (let n = 1; n <= fm.lines; n++) ranges.push(frontMatterLine.range(doc.line(n).from));
  const onCaretLine = (from: number, to: number) => {
    const a = doc.lineAt(from).number;
    const b = doc.lineAt(to).number;
    for (let n = a; n <= b; n++) if (reveal.has(n)) return true;
    return false;
  };

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter(node) {
        if (fm && node.from < fm.to && node.name !== "Document") return false;
        switch (node.name) {
          case "StrongEmphasis":
          case "Emphasis":
          case "Strikethrough":
          case "InlineCode": {
            if (onCaretLine(node.from, node.to)) return false;
            const style =
              node.name === "StrongEmphasis" ? strong : node.name === "Emphasis" ? em : node.name === "Strikethrough" ? strike : code;
            ranges.push(style.range(node.from, node.to));
            // 자식 마크(EmphasisMark / CodeMark / StrikethroughMark)를 숨긴다
            const cursor = node.node.cursor();
            if (cursor.firstChild()) {
              do {
                if (/Mark$/.test(cursor.name)) ranges.push(hide.range(cursor.from, cursor.to));
              } while (cursor.nextSibling());
            }
            return false;
          }
          case "Image": {
            if (onCaretLine(node.from, node.to)) return false;
            const text = doc.sliceString(node.from, node.to);
            const alt = /!\[([^\]]*)\]/.exec(text)?.[1] ?? "";
            ranges.push(Decoration.replace({ widget: new ImageWidget(alt) }).range(node.from, node.to));
            return false;
          }
        }
        return undefined;
      },
    });
  }
  ranges.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  return RangeSet.of(ranges, true);
}

export const inlineDecorations = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildInline(view);
    }
    update(update: ViewUpdate) {
      const composing = update.view.composing || update.transactions.some(isComposingTransaction);
      if (composing && decoOptions.imeGuard) {
        this.decorations = this.decorations.map(update.changes);
        log("C", "deco: 조합 중 → map만 (재빌드 생략)");
        return;
      }
      if (update.docChanged || update.selectionSet || update.viewportChanged || update.transactions.some((t) => t.annotation(flushAnnotation))) {
        this.decorations = buildInline(update.view);
        if (composing) log("C", "deco: 조합 중 재빌드 (가드 OFF)");
      }
    }
  },
  { decorations: (v) => v.decorations },
);

function buildBlock(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const reveal = caretLines(state);
  const fm = frontMatterRange(state);
  syntaxTree(state).iterate({
    enter(node) {
      if (fm && node.from < fm.to && node.name !== "Document") return false;
      if (node.name === "HorizontalRule") {
        const line = state.doc.lineAt(node.from).number;
        if (!reveal.has(line)) {
          ranges.push(Decoration.replace({ widget: new HrWidget(), block: true }).range(node.from, node.to));
        }
        return false;
      }
      return undefined;
    },
  });
  return RangeSet.of(ranges, true);
}

export const blockDecorations = StateField.define<DecorationSet>({
  create: buildBlock,
  update(deco, tr) {
    if (isComposingTransaction(tr) && decoOptions.imeGuard) return deco.map(tr.changes);
    if (tr.docChanged || tr.selection || tr.annotation(flushAnnotation)) return buildBlock(tr.state);
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** compositionend 뒤 데코를 다시 계산하도록 빈 트랜잭션을 보낸다. */
export const flushOnCompositionEnd = EditorView.domEventHandlers({
  compositionend(_event, view) {
    // CM6가 조합 결과를 문서에 반영한 다음에 flush해야 하므로 한 틱 미룬다
    setTimeout(() => view.dispatch({ annotations: flushAnnotation.of(true) }), 0);
    return false;
  },
});
