import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./index";
import { setBlocks, transferKey } from "./morph";

const html = (source: string): string => renderMarkdown(source, { baseDir: "C:\\docs", toAssetUrl: (p) => p }).html;

describe("미리보기 부분 갱신 (로드맵 3-3)", () => {
  const doc = "# 제목\n\n첫 문단\n\n![그림](a.png)\n\n```js\nlet a = 1;\n```\n\n- 하나\n- 둘\n";

  it("바뀐 블록만 새로 넣고 나머지 DOM은 그대로 둔다", () => {
    const root = document.createElement("div");
    setBlocks(root, html(doc), true);
    const [h1, p1, img, pre, ul] = Array.from(root.children);
    // 하이라이트가 DOM을 바꿔도 짝짓기는 처음 HTML로 한다
    pre.querySelector("code")!.innerHTML = '<span class="hljs-keyword">let</span> a = 1;';
    const result = setBlocks(root, html(doc.replace("첫 문단", "고친 문단")), true);
    expect(result).toEqual({ inserted: 1, removed: 1 });
    const after = Array.from(root.children);
    expect(after[0]).toBe(h1);
    expect(after[1]).not.toBe(p1);
    expect(after[1].textContent).toBe("고친 문단");
    expect(after.slice(2)).toEqual([img, pre, ul]);
    expect(pre.querySelector(".hljs-keyword")).not.toBeNull();
  });

  it("위에 줄을 더하면 아래 블록은 그대로 두고 줄 번호(자손 포함)만 고친다", () => {
    const root = document.createElement("div");
    setBlocks(root, html(doc), true);
    const ul = root.lastElementChild!;
    expect(ul.querySelector("li")!.getAttribute("data-line")).toBe("10");
    const result = setBlocks(root, html(`새 줄\n\n${doc}`), true);
    expect(result).toEqual({ inserted: 1, removed: 0 });
    expect(root.lastElementChild).toBe(ul);
    expect(ul.getAttribute("data-line")).toBe("12");
    expect(ul.querySelector("li")!.getAttribute("data-line")).toBe("12");
    expect(root.firstElementChild!.textContent).toBe("새 줄");
  });

  it("블록 순서를 바꾸면 옮기기만 한다", () => {
    const root = document.createElement("div");
    setBlocks(root, html("A\n\nB\n\nC\n"), true);
    const [a, b, c] = Array.from(root.children);
    setBlocks(root, html("C\n\nA\n\nB\n"), true);
    expect(Array.from(root.children)).toEqual([c, a, b]);
  });

  it("그림으로 바꿔 끼운 블록은 키를 넘겨 다음 갱신에서도 그대로 둔다", () => {
    const root = document.createElement("div");
    const source = "앞\n\n```mermaid\ngraph LR\n  A --> B\n```\n";
    setBlocks(root, html(source), true);
    const pre = root.children[1];
    const box = document.createElement("div");
    box.className = "mermaid-diagram";
    box.setAttribute("data-line", pre.getAttribute("data-line")!);
    transferKey(pre, box);
    pre.replaceWith(box);
    setBlocks(root, html(source.replace("앞", "앞앞")), true);
    expect(root.children[1]).toBe(box);
  });

  it("patch가 아니면 통째로 바꾼다", () => {
    const root = document.createElement("div");
    setBlocks(root, html("A\n\nB\n"), true);
    const first = root.firstElementChild;
    const result = setBlocks(root, html("A\n\nB\n"), false);
    expect(result).toEqual({ inserted: 2, removed: 2 });
    expect(root.firstElementChild).not.toBe(first);
  });
});
