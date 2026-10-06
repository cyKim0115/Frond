import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./index";

const render = (source: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = renderMarkdown(source, { baseDir: "C:\\docs", toAssetUrl: (p) => p }).html;
  return root;
};
const inline = (root: HTMLElement): string[] => Array.from(root.querySelectorAll<HTMLElement>(".math-inline")).map((e) => e.dataset.tex!);
const blocks = (root: HTMLElement): string[] => Array.from(root.querySelectorAll<HTMLElement>(".math-display")).map((e) => e.dataset.tex!);

describe("수식 찾기 (로드맵 4-3, GitHub 규칙)", () => {
  it("인라인 $…$ — 원문이 자리 안에 남아 KaTeX 전에도 보인다", () => {
    const root = render("질량 $E = mc^2$ 과 $a_1$");
    expect(inline(root)).toEqual(["E = mc^2", "a_1"]);
    expect(root.querySelector(".math-inline")!.textContent).toBe("E = mc^2");
  });

  it("돈 표기·공백 붙은 $·이스케이프는 수식이 아니다", () => {
    expect(inline(render("값은 $5와 $10 사이"))).toEqual([]);
    expect(inline(render("$ x$ 와 $x $"))).toEqual([]);
    expect(inline(render("\\$x$ 는 글자"))).toEqual([]);
    expect(inline(render("`$x$` 는 코드"))).toEqual([]);
  });

  it("$`…`$ 백틱 표기", () => {
    expect(inline(render("값 $`\\sqrt{2}`$ 끝"))).toEqual(["\\sqrt{2}"]);
  });

  it("블록 $$ — 여러 줄·한 줄, ```math 펜스, data-line", () => {
    const root = render("앞\n\n$$\n\\sum_{i=1}^n i\n= x\n$$\n\n$$ y^2 $$\n\n```math\nz\n```\n");
    // DOMPurify가 속성 값 앞뒤 공백을 다듬는다 — KaTeX에는 상관없다
    expect(blocks(root)).toEqual(["\\sum_{i=1}^n i\n= x", "y^2", "z"]);
    expect(Array.from(root.querySelectorAll<HTMLElement>(".math-display")).map((e) => e.dataset.line)).toEqual(["2", "7", "9"]);
  });

  it("닫는 $$가 없으면 수식이 아니다", () => {
    const root = render("$$\n열기만\n");
    expect(blocks(root)).toEqual([]);
    expect(root.textContent).toContain("$$");
  });

  it("data-tex의 HTML은 이스케이프된다", () => {
    const root = render('$<img src=x onerror=alert(1)>$');
    expect(root.querySelector("img")).toBeNull();
    expect(inline(root)).toEqual(["<img src=x onerror=alert(1)>"]);
  });
});
