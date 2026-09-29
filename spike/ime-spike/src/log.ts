/** 화면 하단 이벤트 로그. IME 관련 DOM 이벤트를 편집면 이름과 함께 남긴다. */

const MAX = 600;
const lines: string[] = [];
let pre: HTMLPreElement;
let counter: HTMLElement;
const t0 = performance.now();

export function initLog(preEl: HTMLPreElement, countEl: HTMLElement) {
  pre = preEl;
  counter = countEl;
}

export function log(surface: string, msg: string) {
  const t = ((performance.now() - t0) / 1000).toFixed(3).padStart(8);
  lines.push(`${t} [${surface}] ${msg}`);
  if (lines.length > MAX) lines.splice(0, lines.length - MAX);
  render();
}

export function clearLog() {
  lines.length = 0;
  render();
}

export function logText(): string {
  return lines.join("\n");
}

function render() {
  if (!pre) return;
  pre.textContent = lines.join("\n");
  pre.scrollTop = pre.scrollHeight;
  counter.textContent = `(${lines.length})`;
}

/** 요소 하나에 IME·입력 관련 이벤트 리스너를 붙인다. */
export function attachImeListeners(el: HTMLElement, surface: string) {
  el.addEventListener("compositionstart", (e) => log(surface, `compositionstart data=${JSON.stringify(e.data)}`));
  el.addEventListener("compositionupdate", (e) => log(surface, `compositionupdate data=${JSON.stringify(e.data)}`));
  el.addEventListener("compositionend", (e) => log(surface, `compositionend data=${JSON.stringify(e.data)}`));
  el.addEventListener("beforeinput", (e) => {
    const ie = e as InputEvent;
    log(surface, `beforeinput ${ie.inputType} data=${JSON.stringify(ie.data)} composing=${ie.isComposing}`);
  });
  el.addEventListener("input", (e) => {
    const ie = e as InputEvent;
    log(surface, `input ${ie.inputType ?? ""} data=${JSON.stringify(ie.data)} composing=${ie.isComposing}`);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Process" || e.keyCode === 229 || e.key === "Enter" || (e.ctrlKey && e.key.toLowerCase() === "s")) {
      log(surface, `keydown key=${e.key} code=${e.code} keyCode=${e.keyCode} isComposing=${e.isComposing}`);
    }
  });
  el.addEventListener("focusin", () => log(surface, "focus"));
  el.addEventListener("focusout", () => log(surface, "blur"));
}
