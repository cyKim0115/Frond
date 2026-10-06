/**
 * 수식 그리기 (로드맵 4-3) — math.ts가 남긴 자리(`.math-inline`·`.math-display`의 `data-tex`)를 KaTeX로 그린다.
 * KaTeX(JS·CSS·글꼴)는 문서에 수식이 있을 때 처음 한 번만 싣는다. 글꼴은 앱에 번들된다(Vite가 CSS의 글꼴을 함께 내보냄).
 * `trust: false`(\href·\url 등 막음), 오류는 던지지 않고 빨간 원문으로 둔다. 그린 자리는 `data-rendered`로 다시 그리지 않는다
 */

type Katex = typeof import("katex").default;

let loading: Promise<Katex> | null = null;

const SELECTOR = ".math-inline:not([data-rendered]), .math-display:not([data-rendered])";

export function hasMath(root: ParentNode): boolean {
  return root.querySelector(".math-inline, .math-display") !== null;
}

function loadKatex(): Promise<Katex> {
  loading ??= Promise.all([import("katex"), import("katex/dist/katex.min.css")])
    .then(([mod]) => mod.default)
    .catch((e) => {
      loading = null;
      throw e;
    });
  return loading;
}

/** `root` 안의 아직 안 그린 수식을 그린다. 많으면 조금씩 나눠 화면이 멈추지 않게 한다 */
export async function renderMath(root: HTMLElement, isStale: () => boolean = () => false): Promise<void> {
  if (!root.querySelector(SELECTOR)) return;
  let katex: Katex;
  try {
    katex = await loadKatex();
  } catch {
    return; // 원문 그대로 둔다
  }
  const targets = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR));
  for (let i = 0; i < targets.length; i++) {
    if (isStale()) return;
    const el = targets[i];
    if (!el.isConnected || el.dataset.rendered) continue;
    const display = el.classList.contains("math-display");
    try {
      katex.render(el.dataset.tex ?? "", el, { displayMode: display, throwOnError: false, output: "htmlAndMathml", strict: "ignore", trust: false });
    } catch {
      // throwOnError false라도 내부 오류는 날 수 있다 — 원문 유지
    }
    el.dataset.rendered = "1";
    if (i % 200 === 199) await new Promise((r) => setTimeout(r, 0));
  }
}
