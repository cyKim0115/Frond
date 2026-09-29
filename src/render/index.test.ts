import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import { renderMarkdown, slugify } from "./index";
import { sanitizeHtml } from "./sanitize";

// vitest root(= 프로젝트 루트) 기준. jsdom 환경에서는 import.meta.url이 file 스킴이 아니라 URL 조립을 쓰지 않는다
const showcase = readFileSync("samples/showcase.md", "utf8");
const pathsMd = readFileSync("samples/paths/paths.md", "utf8");

const BASE = "C:\\docs\\paths";
/** Tauri `convertFileSrc`가 Windows에서 내는 모양 그대로 */
const ASSET_PREFIX = "http://asset.localhost/";
const toAssetUrl = (absPath: string): string => ASSET_PREFIX + encodeURIComponent(absPath);
const OPTIONS = { baseDir: BASE, toAssetUrl };

function render(source: string) {
  const result = renderMarkdown(source, OPTIONS);
  const root = document.createElement("div");
  root.innerHTML = result.html;
  return { ...result, root };
}

function assetPath(img: Element): string {
  const src = img.getAttribute("src") ?? "";
  expect(src.startsWith(ASSET_PREFIX)).toBe(true);
  return decodeURIComponent(src.slice(ASSET_PREFIX.length));
}

describe("samples/showcase.md", () => {
  const { root, toc, frontMatter } = render(showcase);

  it("제목에 id가 붙고 목차가 순서·레벨·줄 번호를 갖는다", () => {
    expect(toc.length).toBeGreaterThanOrEqual(4);
    expect(toc.slice(0, 4)).toEqual([
      { level: 1, text: "제목 1", id: "제목-1", line: 5 },
      { level: 2, text: "제목 2", id: "제목-2", line: 7 },
      { level: 3, text: "제목 3", id: "제목-3", line: 9 },
      { level: 4, text: "제목 4", id: "제목-4", line: 11 },
    ]);
    expect(toc.find((e) => e.id === "표")).toEqual({ level: 2, text: "표", id: "표", line: 63 });

    const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    expect(headings.map((h) => h.id)).toEqual(toc.map((e) => e.id));
    expect(headings.map((h) => h.getAttribute("data-line"))).toEqual(toc.map((e) => String(e.line)));
  });

  it("체크리스트는 비활성 체크박스로, 체크 상태를 유지한다", () => {
    const items = root.querySelectorAll("li.task-list-item");
    expect(items).toHaveLength(2);
    const [done, todo] = Array.from(items);
    expect(done.getAttribute("data-line")).toBe("39");
    expect(todo.getAttribute("data-line")).toBe("40");
    const doneBox = done.querySelector("input")!;
    const todoBox = todo.querySelector("input")!;
    expect(doneBox.type).toBe("checkbox");
    expect(doneBox.disabled).toBe(true);
    expect(doneBox.checked).toBe(true);
    expect(todoBox.disabled).toBe(true);
    expect(todoBox.checked).toBe(false);
    expect(done.textContent).toContain("완료된 할 일");
    expect(done.parentElement!.classList.contains("contains-task-list")).toBe(true);
  });

  it("각주와 표가 렌더된다", () => {
    expect(root.querySelector("sup.footnote-ref a[href='#fn1']")).not.toBeNull();
    expect(root.querySelector("section.footnotes li#fn1")!.textContent).toContain("각주 내용입니다.");

    const table = root.querySelector("table")!;
    expect(table.getAttribute("data-line")).toBe("65");
    expect(table.querySelectorAll("thead th")).toHaveLength(3);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(table.querySelector("th:nth-child(2)")!.getAttribute("style")).toBe("text-align:center");
    expect(table.querySelector("th:nth-child(3)")!.getAttribute("style")).toBe("text-align:right");
  });

  it("최상위 블록마다 data-line이 있다 (각주 섹션은 소스 줄이 없어 제외)", () => {
    const blocks = Array.from(root.children).filter((el) => !el.classList.contains("footnotes-sep") && !el.classList.contains("footnotes"));
    expect(blocks.length).toBeGreaterThan(20);
    for (const el of blocks) expect(el.getAttribute("data-line"), el.outerHTML.slice(0, 80)).toMatch(/^\d+$/);
    expect(root.querySelector("blockquote[data-line='44'] > blockquote[data-line='46']")).not.toBeNull();
    expect(root.querySelector("hr[data-line='79']")).not.toBeNull();
    expect(root.querySelector("ul[data-line='22'] > li[data-line='22']")).not.toBeNull();
  });

  it("front matter는 잡아내고 표·hr로 렌더하지 않는다", () => {
    expect(frontMatter).toBe("title: 렌더링 샘플\ntags: [sample, gfm]");
    expect(root.firstElementChild!.tagName).toBe("H1");
    expect(root.querySelector("hr")!.getAttribute("data-line")).toBe("79");
    expect(root.querySelector("table")!.getAttribute("data-line")).toBe("65");
    expect(renderMarkdown("# a", OPTIONS).frontMatter).toBeUndefined();
  });

  it("취소선·코드 펜스·원문 HTML 이스케이프", () => {
    expect(root.innerHTML).toContain("<s>취소선</s>");

    const csharp = root.querySelector("pre[data-line='50'] > code.language-csharp")!;
    expect(csharp.getAttribute("data-lang")).toBe("csharp");
    expect(csharp.textContent).toBe('public static string Greet(string name) => $"Hello, {name}!";\n');
    const plain = root.querySelector("pre[data-line='58'] > code")!;
    expect(plain.className).toBe("");
    expect(plain.textContent).toBe("언어 지정 없는 코드 블록\n    들여쓰기가 유지되어야 합니다\n");

    // html: false — <details>는 글자 그대로 보인다
    expect(root.querySelector("details")).toBeNull();
    expect(root.textContent).toContain("<details>");
  });

  it("링크: 외부는 새 창 속성, 앵커·mailto는 그대로, 상대 .md는 data-local-path", () => {
    const external = root.querySelector("a[href='https://www.anthropic.com']")!;
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener");
    expect(external.hasAttribute("data-local-path")).toBe(false);

    const auto = root.querySelector("a[href='https://github.com']")!;
    expect(auto.textContent).toBe("https://github.com");
    expect(auto.getAttribute("target")).toBe("_blank");

    const anchor = root.querySelector("a[href='#%ED%91%9C']")!;
    expect(anchor.hasAttribute("target")).toBe(false);
    expect(decodeURIComponent(anchor.getAttribute("href")!.slice(1))).toBe("표");

    const local = root.querySelector("a[href='README.md']")!;
    expect(local.getAttribute("data-local-path")).toBe("C:\\docs\\paths\\README.md");
    expect(local.hasAttribute("target")).toBe(false);
  });

  it("없는 상대 이미지도 절대 경로로 바뀌고 alt를 유지한다", () => {
    const img = root.querySelector("img")!;
    expect(assetPath(img)).toBe("C:\\docs\\paths\\images\\missing.png");
    expect(img.getAttribute("alt")).toBe("없는 이미지");
  });
});

describe("samples/paths/paths.md", () => {
  const { root } = render(pathsMd);

  it("퍼센트 인코딩·꺾쇠·인코딩 없는 [·# 경로가 한글·공백·[·#를 보존한 절대 경로가 된다", () => {
    const images = Array.from(root.querySelectorAll("img"));
    const expected = [
      "C:\\docs\\paths\\한글 폴더\\한글 그림.png",
      "C:\\docs\\paths\\space dir\\with space.png",
      "C:\\docs\\paths\\brackets\\[img].png",
      "C:\\docs\\paths\\hash\\#tag.png",
    ];
    expect(images.map(assetPath)).toEqual([...expected, ...expected, expected[2], expected[3]]);
    expect(images.map((i) => i.getAttribute("alt"))).toEqual(["한글", "공백", "대괄호", "해시", "한글", "공백", "대괄호", "해시", "대괄호 raw", "해시 raw"]);
  });

  it("인코딩 없는 공백 경로는 CommonMark대로 이미지가 아니다 (Open decision 1: GitHub과 동일)", () => {
    expect(root.textContent).toContain("![한글 raw](한글 폴더/한글 그림.png)");
  });
});

describe("보안", () => {
  it("원문 <script>는 이스케이프되고 DOMPurify가 금지 태그를 걷어낸다", () => {
    const { html, root } = render("앞\n\n<script>alert(1)</script>\n\n뒤 <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
    expect(root.querySelector("img")).toBeNull();

    const cleaned = sanitizeHtml(
      '<p data-line="1">x<script>alert(1)</script><iframe src="x"></iframe><style>p{}</style><object></object><embed></p><form action="x"><input type="text"></form>',
    );
    expect(cleaned).toBe('<p data-line="1">x</p><input type="text">');
    expect(cleaned).not.toMatch(/<(script|iframe|form|style|object|embed)/);
  });

  it("javascript:·vbscript:·data:·file: 링크와 이미지는 만들어지지 않는다", () => {
    const { html, root } = render(
      "[a](javascript:alert(1)) [b](vbscript:x) [c](data:text/html,x) [d](file:///C:/a.md) [e](JAVASCRIPT:x) [f](%6Aavascript:x) [g](//evil.example)\n\n![i](data:image/png;base64,AAAA) ![j](file:///C:/x.png)",
    );
    expect(root.querySelectorAll("a")).toHaveLength(0);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    expect(html).not.toMatch(/href=|src=/);
    expect(sanitizeHtml('<a href="javascript:alert(1)">j</a>')).toBe("<a>j</a>");
  });

  it("http(s) 이미지는 유지되고 asset URL은 새니타이즈를 통과한다", () => {
    const { root } = render("![r](https://example.com/a.png) ![l](img/한글%20그림.png)");
    const [remote, local] = Array.from(root.querySelectorAll("img"));
    expect(remote.getAttribute("src")).toBe("https://example.com/a.png");
    expect(local.getAttribute("src")).toBe("http://asset.localhost/C%3A%5Cdocs%5Cpaths%5Cimg%5C%ED%95%9C%EA%B8%80%20%EA%B7%B8%EB%A6%BC.png");
  });

  it("asset URL·data-local-path·target·checkbox 속성이 DOMPurify를 살아남는다", () => {
    const html =
      '<h2 id="title">T</h2><a href="http://x/" target="_blank" rel="noopener" data-local-path="C:\\a b\\x.md" data-line="3">x</a>' +
      '<img src="http://asset.localhost/C%3A%5Cdocs%5C%ED%95%9C.png" alt="h"><input class="task-list-item-checkbox" type="checkbox" disabled="" checked="">';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe("링크 경로", () => {
  it("상대 .md 링크는 ..·하위 폴더·퍼센트 인코딩·조각을 처리한다", () => {
    const { root } = render("[a](../notes/plan.md#sec) [b](sub%20dir/한글.markdown?x=1) [c](C:\\other\\z.md) [d](notes/plan.txt) [e](mailto:x@y.z) [f](README.MD)");
    const paths = Array.from(root.querySelectorAll("a")).map((a) => a.getAttribute("data-local-path"));
    expect(paths).toEqual(["C:\\docs\\notes\\plan.md", "C:\\docs\\paths\\sub dir\\한글.markdown", "C:\\other\\z.md", null, null, "C:\\docs\\paths\\README.MD"]);
    expect(root.querySelector("a[href='mailto:x@y.z']")!.hasAttribute("target")).toBe(false);
  });

  it("파일명 같은 평문은 자동 링크하지 않는다 (GitHub과 동일)", () => {
    const { root } = render("paths.md와 example.com은 링크가 아니고 https://github.com 은 링크다. 메일 a@b.co 도.");
    const hrefs = Array.from(root.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://github.com", "mailto:a@b.co"]);
  });
});

describe("CJK·슬러그", () => {
  it("cjk-friendly: 한글 단어 안·문장 부호 뒤의 **가 굵게 된다", () => {
    expect(render("**한글**뒤 그리고 **굵게**, 끝").html).toContain("<strong>한글</strong>뒤");
    // 순정 CommonMark는 닫는 ** 앞이 문장 부호이고 뒤가 한글이면 닫지 못한다 — 플러그인이 실제로 바꾸는 사례
    const plain = new MarkdownIt();
    for (const source of ["**한글.**뒤", "**「한글」**뒤", "**한글(설명)**뒤", "**“한글”**뒤"]) {
      expect(plain.render(source), source).not.toContain("<strong>");
      expect(render(source).html, source).toMatch(/^<p data-line="0"><strong>.+<\/strong>뒤<\/p>/);
    }
  });

  it("슬러그는 한글을 유지하고, 영어 제목 id가 DOMPurify에 지워지지 않으며, 중복은 -1", () => {
    const { root, toc } = render("## Title\n\n## Links\n\n## 같은 제목\n\n## 같은 제목\n\n## ???\n\n## `code` **bold** [link](https://x.y)");
    expect(toc.map((e) => e.id)).toEqual(["title", "links", "같은-제목", "같은-제목-1", "section", "code-bold-link"]);
    expect(toc[5].text).toBe("code bold link");
    expect(Array.from(root.querySelectorAll("h2")).map((h) => h.id)).toEqual(toc.map((e) => e.id));
    expect(slugify("  수식·다이어그램 (지원 여부) ")).toBe("수식다이어그램-지원-여부");
  });

  it("BOM이 남아 있어도 front matter를 잡는다", () => {
    const { frontMatter, root } = render("\ufeff---\na: 1\n---\n\n# H");
    expect(frontMatter).toBe("a: 1");
    expect(root.firstElementChild!.tagName).toBe("H1");
  });
});
