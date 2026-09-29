/** 세 편집면 생성. 각 면은 같은 API(getText/setText/lineCount/focus)를 가진다. */

import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { blockDecorations, flushOnCompositionEnd, inlineDecorations } from "./deco";
import { attachImeListeners, log } from "./log";

export interface Surface {
  id: "A" | "B" | "C";
  getText(): string;
  setText(text: string): void;
  lineCount(): number;
  focus(): void;
  onChange(cb: () => void): void;
}

/** Ctrl+S 카운터. 제품 규칙(G18)대로 isComposing이면 무시하되, 무시했다는 사실을 로그로 남긴다. */
export const saveCounts: Record<string, number> = { A: 0, B: 0, C: 0 };
let onSave: (id: string) => void = () => {};
export function setSaveHandler(cb: (id: string) => void) {
  onSave = cb;
}

function handleSaveShortcut(id: string, isComposing: boolean) {
  if (isComposing) {
    log(id, "Ctrl+S 무시 (isComposing=true)");
    return;
  }
  saveCounts[id]++;
  log(id, `Ctrl+S 처리 → ${saveCounts[id]}회`);
  onSave(id);
}

export function createTextarea(el: HTMLTextAreaElement): Surface {
  attachImeListeners(el, "A");
  const listeners: (() => void)[] = [];
  el.addEventListener("input", () => listeners.forEach((f) => f()));
  el.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSaveShortcut("A", e.isComposing);
    }
  });
  return {
    id: "A",
    getText: () => el.value,
    setText: (t) => {
      el.value = t;
      listeners.forEach((f) => f());
    },
    lineCount: () => el.value.split("\n").length,
    focus: () => el.focus(),
    onChange: (cb) => listeners.push(cb),
  };
}

function createCodeMirror(id: "B" | "C", host: HTMLElement, extra: import("@codemirror/state").Extension[]): Surface {
  const listeners: (() => void)[] = [];
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: "",
      extensions: [
        history(),
        markdown({ base: markdownLanguage }),
        EditorView.lineWrapping,
        keymap.of([
          {
            key: "Mod-s",
            run: () => {
              handleSaveShortcut(id, false);
              return true;
            },
          },
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) listeners.forEach((f) => f());
        }),
        ...extra,
      ],
    }),
  });
  attachImeListeners(view.contentDOM, id);
  // CM6 keymap은 조합 중 Ctrl+S를 어떻게 다루는지 별도로 본다: DOM 레벨 keydown에서 isComposing을 기록
  view.contentDOM.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "s" && e.isComposing) log(id, "Ctrl+S keydown 중 isComposing=true (CM6 keymap 도달 여부는 위 로그로 확인)");
  });
  return {
    id,
    getText: () => view.state.doc.toString(),
    setText: (t) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } }),
    lineCount: () => view.state.doc.lines,
    focus: () => view.focus(),
    onChange: (cb) => listeners.push(cb),
  };
}

export function createPlain(host: HTMLElement): Surface {
  return createCodeMirror("B", host, []);
}

export function createDecorated(host: HTMLElement): Surface {
  return createCodeMirror("C", host, [inlineDecorations, blockDecorations, flushOnCompositionEnd]);
}
