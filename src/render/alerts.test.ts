import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./index";

const render = (source: string): HTMLElement => {
  const root = document.createElement("div");
  root.innerHTML = renderMarkdown(source, { baseDir: "C:\\docs", toAssetUrl: (p) => p }).html;
  return root;
};

describe("GitHub Alerts (로드맵 4-2)", () => {
  it("다섯 종류가 GitHub과 같은 틀·제목으로 바뀌고 내용 첫 줄부터 남는다", () => {
    const types = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
    const root = render(types.map((t) => `> [!${t}]\n> ${t} 내용 **굵게**`).join("\n\n"));
    const alerts = Array.from(root.querySelectorAll(".markdown-alert"));
    expect(alerts.map((a) => a.className)).toEqual(types.map((t) => `markdown-alert markdown-alert-${t.toLowerCase()}`));
    expect(alerts.map((a) => a.querySelector(".markdown-alert-title")?.textContent)).toEqual(["Note", "Tip", "Important", "Warning", "Caution"]);
    expect(alerts[0].querySelector("p:not(.markdown-alert-title)")?.innerHTML).toBe("NOTE 내용 <strong>굵게</strong>");
    expect(root.querySelector("blockquote")).toBeNull();
  });

  it("소문자 표시도 되고, 원래 인용의 data-line은 틀이 갖는다", () => {
    const root = render("문단\n\n> [!tip]\n> 내용");
    const alert = root.querySelector(".markdown-alert-tip")!;
    expect(alert.getAttribute("data-line")).toBe("2");
  });

  it("같은 줄에 글이 있거나 표시뿐이거나 목록 안이면 보통 인용", () => {
    const root = render("> [!NOTE] 같은 줄\n\n> [!WARNING]\n\n- 항목\n  > [!TIP]\n  > 목록 안");
    expect(root.querySelectorAll(".markdown-alert")).toHaveLength(0);
    expect(root.querySelectorAll("blockquote")).toHaveLength(3);
    expect(root.textContent).toContain("[!NOTE] 같은 줄");
  });

  it("두 번째 문단부터는 그대로 문단이다", () => {
    const root = render("> [!IMPORTANT]\n> 첫 문단\n>\n> 둘째 문단");
    const paras = Array.from(root.querySelectorAll(".markdown-alert > p:not(.markdown-alert-title)")).map((p) => p.textContent);
    expect(paras).toEqual(["첫 문단", "둘째 문단"]);
  });

  it("Mermaid 펜스는 보통 코드 블록(data-lang=mermaid)으로 나온다 — 그림은 셸이 DOM에 넣은 뒤 그린다", () => {
    const root = render("```mermaid\ngraph LR\n  A --> B\n```");
    const code = root.querySelector("pre > code[data-lang='mermaid']");
    expect(code?.textContent).toBe("graph LR\n  A --> B\n");
    expect(root.querySelector("svg")).toBeNull();
  });
});
