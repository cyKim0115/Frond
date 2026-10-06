import { readFileSync } from "node:fs";
import MarkdownIt from "markdown-it";
import { describe, expect, it } from "vitest";
import { hasClosedFrontMatter, renderMarkdown, slugify } from "./index";
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

/** 셸(main.ts) 클릭 핸들러와 같은 조건: `closest("a[href]")`에 잡히고, http(s)·mailto·#이 아니면 `dataset.localPath`로 앱 내 열기 */
function localPathsAsShellSees(root: Element): (string | null)[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]")).map((a) => {
    const href = a.getAttribute("href") ?? "";
    if (href.startsWith("#") || /^(https?|mailto):/i.test(href)) return null;
    return a.dataset.localPath ?? null;
  });
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

  it("취소선·코드 펜스·원문 HTML 허용 목록", () => {
    expect(root.innerHTML).toContain("<s>취소선</s>");

    const csharp = root.querySelector("pre[data-line='50'] > code.language-csharp")!;
    expect(csharp.getAttribute("data-lang")).toBe("csharp");
    expect(csharp.textContent).toBe('public static string Greet(string name) => $"Hello, {name}!";\n');
    const plain = root.querySelector("pre[data-line='58'] > code")!;
    expect(plain.className).toBe("");
    expect(plain.textContent).toBe("언어 지정 없는 코드 블록\n    들여쓰기가 유지되어야 합니다\n");

    // 허용 태그는 렌더(블록 첫 태그가 data-line을 받는다), 목록 밖 태그·속성은 글자로 남거나 빠진다
    const details = root.querySelector("details[data-line='83']")!;
    expect(details.querySelector("summary")!.textContent).toBe("펼치기");
    expect(details.querySelector("p")!.textContent).toBe("접혀 있던 내용입니다.");
    expect(root.querySelectorAll("kbd")).toHaveLength(2);
    expect(root.querySelector("abbr")!.getAttribute("title")).toBe("HyperText Markup Language");
    const center = root.querySelector("p[align='center']")!;
    expect(center.querySelector("img")!.getAttribute("width")).toBe("120");
    expect(root.textContent).toContain("List<String>, <section>, <script>alert(1)</script>, <iframe src=\"x\"></iframe>.");
    expect(root.querySelector("script, iframe, section:not(.footnotes)")).toBeNull();
    const span = root.querySelector("span[title='툴팁']")!;
    expect(span.getAttributeNames()).toEqual(["title"]);
    expect(root.textContent).not.toContain("주석은 보이지 않습니다");
    expect(root.querySelector("a[href='http://www.github.com']")!.textContent).toBe("www.github.com");
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

  it("lazyImages(큰 문서)면 모든 이미지가 loading=lazy로 DOMPurify를 통과하고, 기본은 붙지 않는다", () => {
    expect(Array.from(root.querySelectorAll("img")).some((i) => i.hasAttribute("loading"))).toBe(false);
    const lazy = document.createElement("div");
    lazy.innerHTML = renderMarkdown(pathsMd, { ...OPTIONS, lazyImages: true }).html;
    const images = Array.from(lazy.querySelectorAll("img"));
    expect(images).toHaveLength(10);
    expect(images.every((i) => i.getAttribute("loading") === "lazy")).toBe(true);
  });
});

describe("보안", () => {
  it("원문 <script>는 이스케이프되고 DOMPurify가 금지 태그를 걷어낸다", () => {
    const { html, root } = render("앞\n\n<script>alert(1)</script>\n\n뒤 <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
    // img는 허용 태그지만 이벤트 속성은 버리고 src는 상대 경로 재작성을 거친다
    const img = root.querySelector("img")!;
    expect(img.getAttributeNames()).toEqual(["src"]);
    expect(assetPath(img)).toBe("C:\\docs\\paths\\x");

    const cleaned = sanitizeHtml(
      '<p data-line="1">x<script>alert(1)</script><iframe src="x"></iframe><style>p{}</style><object></object><embed></p><form action="x"><input type="text"></form>',
    );
    expect(cleaned).toBe('<p data-line="1">x</p><input type="text">');
    expect(cleaned).not.toMatch(/<(script|iframe|form|style|object|embed)/);
  });

  it("javascript:·vbscript:·data:·비문서 file: 링크와 이미지는 만들어지지 않는다", () => {
    const { html, root } = render(
      "[a](javascript:alert(1)) [b](vbscript:x) [c](data:text/html,x) [d](file:///C:/a.exe) [e](JAVASCRIPT:x) [f](%6Aavascript:x) [g](//evil.example) [h](file:///C:/a.md.txt) [i](FILE:///C:/x.png) [k](%66ile:///C:/a.md) <file:///C:/run.bat>\n\n![i](data:image/png;base64,AAAA) ![j](file:///C:/x.png)",
    );
    expect(root.querySelectorAll("a")).toHaveLength(0);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    expect(html).not.toMatch(/href=|src=/);
    expect(sanitizeHtml('<a href="javascript:alert(1)">j</a>')).toBe("<a>j</a>");
    expect(sanitizeHtml('<a href="file:///C:/a.exe">f</a><a href="file:///C:/a.md.txt">g</a>')).toBe("<a>f</a><a>g</a>");
  });

  it("http(s) 이미지는 유지되고 asset URL은 새니타이즈를 통과한다", () => {
    const { root } = render("![r](https://example.com/a.png) ![l](img/한글%20그림.png)");
    const [remote, local] = Array.from(root.querySelectorAll("img"));
    expect(remote.getAttribute("src")).toBe("https://example.com/a.png");
    expect(local.getAttribute("src")).toBe("http://asset.localhost/C%3A%5Cdocs%5Cpaths%5Cimg%5C%ED%95%9C%EA%B8%80%20%EA%B7%B8%EB%A6%BC.png");
  });

  it("asset URL·data-local-path·target·checkbox·드라이브/file: 문서 href가 DOMPurify를 살아남는다", () => {
    const html =
      '<h2 id="title">T</h2><a href="http://x/" target="_blank" rel="noopener" data-local-path="C:\\a b\\x.md" data-line="3">x</a>' +
      '<img src="http://asset.localhost/C%3A%5Cdocs%5C%ED%95%9C.png" alt="h"><input class="task-list-item-checkbox" type="checkbox" disabled="" checked="">' +
      '<a href="C:%5Cother%5Cz.md" data-local-path="C:\\other\\z.md">c</a><a href="D:/x/y.markdown#s" data-local-path="D:\\x\\y.markdown">d</a>' +
      '<a href="file:///C:/a%20b.md#s" data-local-path="C:\\a b.md">e</a><a href="file://srv/share/x.MD?q=1" data-local-path="\\\\srv\\share\\x.MD">f</a>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe("링크 경로", () => {
  it("상대 .md 링크는 ..·하위 폴더·퍼센트 인코딩·조각을 처리하고, 셸의 a[href] 클릭 경로로 열린다", () => {
    const { root } = render("[a](../notes/plan.md#sec) [b](sub%20dir/한글.markdown?x=1) [c](C:\\other\\z.md) [d](notes/plan.txt) [e](mailto:x@y.z) [f](README.MD) [g](c:/Other/z.md)");
    expect(root.querySelectorAll("a")).toHaveLength(7);
    // main.ts가 보는 그대로: href가 살아 있고(DOMPurify 통과) data-local-path가 있어야 열린다
    expect(localPathsAsShellSees(root)).toEqual([
      "C:\\docs\\notes\\plan.md",
      "C:\\docs\\paths\\sub dir\\한글.markdown",
      "C:\\other\\z.md",
      null,
      null,
      "C:\\docs\\paths\\README.MD",
      "C:\\Other\\z.md",
    ]);
    expect(root.querySelector("a[href='C:%5Cother%5Cz.md']")!.getAttribute("data-local-path")).toBe("C:\\other\\z.md");
    expect(root.querySelector("a[href='mailto:x@y.z']")!.hasAttribute("target")).toBe(false);
  });

  it("file: URL은 .md/.markdown 문서만 링크가 되고 절대 경로 data-local-path로 앱 내에서 연다 (스펙 §47·§152)", () => {
    const { root } = render(
      "[a](file:///C:/a.md) [b](<file:///C:/a b/한글.markdown#sec>) [c](file://server/share/x.md?q=1) [d](file://localhost/D:/x.MD) [e](FILE:///C:/y.md) <file:///C:/z.md> [g](file:///C:/a.md%23x) [h](file:///a.md)",
    );
    expect(localPathsAsShellSees(root)).toEqual(["C:\\a.md", "C:\\a b\\한글.markdown", "\\\\server\\share\\x.md", "D:\\x.MD", "C:\\y.md", "C:\\z.md"]);
    const first = root.querySelector("a[href='file:///C:/a.md']")!;
    expect(first.hasAttribute("target")).toBe(false);
    expect(first.getAttribute("data-local-path")).toBe("C:\\a.md");
    expect(root.querySelector("a[href^='file:///C:/a%20b/']")).not.toBeNull();
    // 경로 안의 #(`.md%23x`)·드라이브 없는 file:///a.md는 링크가 아니다
    expect(root.textContent).toContain("[g](file:///C:/a.md%23x)");
    expect(root.textContent).toContain("[h](file:///a.md)");
  });

  it("파일명 같은 평문은 자동 링크하지 않는다 (GitHub과 동일)", () => {
    const { root } = render("paths.md와 example.com은 링크가 아니고 https://github.com 은 링크다. 메일 a@b.co 도.");
    const hrefs = Array.from(root.querySelectorAll("a")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://github.com", "mailto:a@b.co"]);
  });

  it("`www.`로 시작하는 주소만 스킴 없이 자동 링크한다 (GFM 확장 autolink, 결정 D2)", () => {
    const { root } = render("www.example.com/a?b=1 과 WWW.Test.org, 그리고 sub.www.example.com·readme.md·a.co.kr 은 글자.");
    const links = Array.from(root.querySelectorAll("a"));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["http://www.example.com/a?b=1", "http://WWW.Test.org"]);
    expect(links.map((a) => a.textContent)).toEqual(["www.example.com/a?b=1", "WWW.Test.org"]);
    expect(links.every((a) => a.getAttribute("target") === "_blank")).toBe(true);
    // 링크로 다 걸러진 문단도 글자는 그대로 남는다
    expect(render("readme.md 와 a.co.kr").root.textContent?.trim()).toBe("readme.md 와 a.co.kr");
  });

  it("samples/paths/paths.md에는 스킴 없는 자동 링크가 생기지 않는다", () => {
    // 스킴 없는 자동 링크는 href에 `http://`가 붙고 글자에는 스킴이 없다
    const { root } = render(pathsMd);
    const fuzzy = Array.from(root.querySelectorAll("a")).filter((a) => a.getAttribute("href")?.startsWith("http://") && !a.textContent?.startsWith("http"));
    expect(fuzzy.map((a) => a.outerHTML)).toEqual([]);
  });
});

describe("원문 HTML 허용 목록 (결정 D1)", () => {
  it("허용 태그만 HTML이 되고, 목록 밖 태그는 이스케이프돼 글자로 보인다", () => {
    const { root, html } = render(
      "a <kbd>K</kbd> <u>u</u> <s>s</s> <sub>1</sub> <custom-el>x</custom-el> <svg onload=alert(1)></svg> <input value=1> <style>p{}</style>",
    );
    expect(Array.from(root.querySelectorAll("kbd, u, s, sub")).map((e) => e.tagName)).toEqual(["KBD", "U", "S", "SUB"]);
    expect(root.querySelector("custom-el, svg, input, style")).toBeNull();
    expect(root.textContent?.trim()).toBe("a K u s 1 <custom-el>x</custom-el> <svg onload=alert(1)></svg> <input value=1> <style>p{}</style>");
    expect(html).not.toMatch(/<(svg|input|style|custom-el)/);
  });

  it("목록 밖 태그로 시작하는 블록은 문단이 되고 마크다운이 그대로 살아 있다", () => {
    const { root } = render("<section>\n**굵게**\n</section>\n\n<script>\nalert(1)\n</script>");
    const [first, second] = Array.from(root.querySelectorAll("p"));
    expect(first.innerHTML).toBe("&lt;section&gt;\n<strong>굵게</strong>\n&lt;/section&gt;");
    expect(second.textContent).toBe("<script>\nalert(1)\n</script>");
  });

  it("허용 블록 안의 금지 태그는 글자, 빈 줄 뒤 마크다운은 렌더", () => {
    const { root } = render('<div align="center" class="x" style="color:red">\n<iframe src="https://e.x"></iframe> 1 < 2 &amp; &copy;\n</div>\n\n<details open>\n<summary>요약</summary>\n\n**본문**\n\n</details>');
    const div = root.querySelector("div[data-line='0']")!;
    expect(div.getAttributeNames().sort()).toEqual(["align", "data-line"]);
    expect(div.textContent).toBe('\n<iframe src="https://e.x"></iframe> 1 < 2 & ©\n');
    const details = root.querySelector("details")!;
    expect(details.hasAttribute("open")).toBe(true);
    expect(details.getAttribute("data-line")).toBe("4");
    expect(details.querySelector("strong")!.textContent).toBe("본문");
  });

  it("a href·img src는 마크다운 링크·이미지와 같은 검증·재작성을 거친다", () => {
    const { root } = render(
      '<a href="https://x.y/?a=1&amp;b=2" onclick="x">외부</a> <a href="javascript:alert(1)">j</a> <a href="other.md#s">문서</a> <a name="n">이름</a> ' +
        '<img src="data:image/png;base64,AAAA" alt="d"> <img src="img/a&amp;b%20c.png" width="50%" height=20 alt="상대"> <img src="https://x.y/a.png">' +
        ' <span href="https://x.y" src="a.png">s</span> <a src="a.png" href="https://x.y/2">2</a>',
    );
    const links = Array.from(root.querySelectorAll("a"));
    expect(links.map((a) => [a.getAttribute("href"), a.getAttribute("target"), a.dataset.localPath ?? null])).toEqual([
      ["https://x.y/?a=1&b=2", "_blank", null],
      [null, null, null],
      ["other.md#s", null, "C:\\docs\\paths\\other.md"],
      [null, null, null],
      ["https://x.y/2", "_blank", null],
    ]);
    expect(links.every((a) => !a.hasAttribute("onclick") && !a.hasAttribute("src") && !a.hasAttribute("name"))).toBe(true);
    const [data, local, remote] = Array.from(root.querySelectorAll("img"));
    expect(data.hasAttribute("src")).toBe(false);
    expect(assetPath(local)).toBe("C:\\docs\\paths\\img\\a&b c.png");
    expect([local.getAttribute("width"), local.getAttribute("height"), local.getAttribute("alt")]).toEqual(["50%", "20", "상대"]);
    expect(remote.getAttribute("src")).toBe("https://x.y/a.png");
    expect(root.querySelector("span")!.getAttributeNames()).toEqual([]);
  });

  it("역슬래시 드라이브 경로는 그대로, 큰 문서면 img도 loading=lazy", () => {
    const html = renderMarkdown('<img src="C:\\(old)\\a_b.png">', { ...OPTIONS, lazyImages: true }).html;
    const root = document.createElement("div");
    root.innerHTML = html;
    const img = root.querySelector("img")!;
    expect(assetPath(img)).toBe("C:\\(old)\\a_b.png");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("주석은 숨기고, 닫히지 않은 주석은 문서를 삼키지 않고 글자로 남는다", () => {
    expect(render("앞 <!-- 메모 --> 뒤").root.textContent?.trim()).toBe("앞  뒤");
    expect(render("<!--\n여러 줄\n-->\n\n본문").root.textContent?.trim()).toBe("본문");
    const open = render("<!-- 열림\n\n# 제목").root;
    expect(open.textContent).toContain("<!-- 열림");
    expect(open.querySelector("h1")!.textContent).toBe("제목");
  });

  it("코드 안의 태그는 HTML이 아니다", () => {
    const { root } = render("`<kbd>x</kbd>`\n\n```\n<details>\n```");
    expect(root.querySelector("kbd, details")).toBeNull();
    expect(root.querySelector("code")!.textContent).toBe("<kbd>x</kbd>");
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

describe("front matter 경계", () => {
  it("첫 줄 --- 뒤에 닫는 표식이 없으면 front matter가 아니라 <hr>이고 본문이 렌더된다 (GitHub과 동일)", () => {
    const { html, frontMatter, toc, root } = render("---\n\n# Title\n\nbody text");
    expect(frontMatter).toBeUndefined();
    expect(html).not.toBe("");
    expect(root.firstElementChild!.outerHTML).toBe('<hr data-line="0">');
    expect(toc).toEqual([{ level: 1, text: "Title", id: "title", line: 2 }]);
    expect(root.querySelector("p")!.textContent).toBe("body text");
  });

  it("본문 중간의 ---는 닫는 표식이 아니라 두 번째 <hr>이다", () => {
    const { frontMatter, root } = render("---\n\n# Title\n\nbody\n\n---\n\nafter");
    expect(frontMatter).toBeUndefined();
    expect(Array.from(root.children).map((el) => `${el.tagName}:${el.getAttribute("data-line")}`)).toEqual(["HR:0", "H1:2", "P:4", "HR:6", "P:8"]);
    expect(root.querySelector("h1")!.textContent).toBe("Title");
  });

  it("닫힌 YAML 해시만 front matter다: CRLF·... 종결·빈 본문·중첩 키는 잡고, 짧은 닫는 줄·첫 줄 뒤 글자·키 없는 본문은 아니다", () => {
    expect(hasClosedFrontMatter("---\na: 1\n---\n# H")).toBe(true);
    expect(hasClosedFrontMatter("---\r\na: 1\r\n---\r\n# H")).toBe(true);
    expect(hasClosedFrontMatter("---\na: 1\n...\n# H")).toBe(true);
    expect(hasClosedFrontMatter("---\n---")).toBe(true);
    expect(hasClosedFrontMatter("---\n\n---")).toBe(true);
    expect(hasClosedFrontMatter("---   \na: 1\n---   ")).toBe(true);
    expect(hasClosedFrontMatter("---\n# comment\nfoo:\n  bar: 1\n---")).toBe(true);
    expect(hasClosedFrontMatter('---\n"quoted key": x\ntags: [a, b]\n---')).toBe(true);
    expect(hasClosedFrontMatter("---\n# H")).toBe(false);
    expect(hasClosedFrontMatter("----\na: 1\n---\n")).toBe(false);
    expect(hasClosedFrontMatter("--- x\na: 1\n---\n")).toBe(false);
    expect(hasClosedFrontMatter("# H\n---\n")).toBe(false);
    expect(hasClosedFrontMatter("")).toBe(false);
    // 닫는 줄은 있지만 YAML 해시가 아닌 것 — GitHub도 표가 아니라 <hr>로 그린다
    expect(hasClosedFrontMatter("---\n\n# Title\n\nbody\n\n---\n\nafter")).toBe(false);
    expect(hasClosedFrontMatter("---\n- a\n- b\n---")).toBe(false);
    expect(hasClosedFrontMatter("---\nsee http://example.com and C:\\x\n---")).toBe(false);

    const crlf = render("---\r\ntitle: x\r\n---\r\n\r\n# H\r\n\r\n---\r\n");
    expect(crlf.frontMatter).toBe("title: x");
    expect(Array.from(crlf.root.children).map((el) => el.tagName)).toEqual(["H1", "HR"]);
  });
});

describe("큰 문서 블록 묶음 (chunkBlocks)", () => {
  function chunked(source: string, size: number) {
    const root = document.createElement("div");
    root.innerHTML = renderMarkdown(source, { ...OPTIONS, chunkBlocks: size }).html;
    return root;
  }
  const tags = (el: Element) => Array.from(el.children).map((c) => c.tagName);

  it("최상위 블록만 size개씩 묶고, 블록·data-line·내용은 그대로다", () => {
    const source = Array.from({ length: 7 }, (_, i) => `문단 ${i}`).join("\n\n");
    const plain = render(source).root;
    const root = chunked(source, 3);
    expect(Array.from(root.children).every((c) => c.tagName === "DIV" && c.className === "md-chunk")).toBe(true);
    expect(Array.from(root.children).map((c) => c.children.length)).toEqual([3, 3, 1]);
    const inner = Array.from(root.querySelectorAll(":scope > .md-chunk > *"));
    expect(inner.map((el) => el.outerHTML)).toEqual(Array.from(plain.children).map((el) => el.outerHTML));
  });

  it("묶지 않으면 지금처럼 블록이 바로 자식이다", () => {
    expect(render("a\n\nb").root.querySelector(".md-chunk")).toBeNull();
  });

  it("제목·구분선 앞에서는 묶음을 나누지 않고 다음 블록까지 늘린다 (경계 여백이 겹치지 않으므로)", () => {
    const root = chunked("a\n\nb\n\n# 제목\n\n---\n\nc\n\nd\n\ne", 2);
    expect(Array.from(root.children).map(tags)).toEqual([["P", "P", "H1", "HR"], ["P", "P"], ["P"]]);
  });

  it("주석만 있는 원문 HTML은 세지 않고 거기서 시작하지도 않는다 — 바로 뒤 제목이 묶음 맨 위가 되지 않게", () => {
    const root = chunked("a\n\nb\n\n<!-- 숨은 주석 -->\n\n## 제목\n\nc\n\n<hr>\n\nd", 2);
    expect(Array.from(root.children).map(tags)).toEqual([["P", "P", "H2"], ["P", "HR"], ["P"]]);
  });

  it("목록·표·코드·인용은 블록 하나로 센다 — 안쪽 블록으로 쪼개지 않는다", () => {
    const root = chunked("- a\n- b\n\n> q\n>\n> r\n\n| x |\n|---|\n| 1 |\n\n```\ncode\n```\n\n끝", 2);
    expect(Array.from(root.children).map(tags)).toEqual([["UL", "BLOCKQUOTE"], ["TABLE", "PRE"], ["P"]]);
  });

  it("원문 HTML이 여러 블록에 걸쳐 열려 있는 동안은 나누지 않는다", () => {
    const root = chunked("a\n\n<details>\n<summary>열기</summary>\n\n안 **굵게**\n\n둘째\n\n</details>\n\nb\n\nc", 1);
    const details = root.querySelector("details")!;
    expect(details.querySelector("summary")!.textContent).toBe("열기");
    expect(details.querySelectorAll("p")).toHaveLength(2);
    expect(details.parentElement!.className).toBe("md-chunk");
    expect(details.nextElementSibling).toBeNull(); // details 뒤 b는 다음 묶음
    expect(root.lastElementChild!.textContent!.trim()).toBe("c");
  });

  it("각주 섹션은 마지막 묶음 안에 통째로 들어간다", () => {
    const root = chunked("본문[^1]\n\n둘째\n\n[^1]: 각주 내용", 1);
    const section = root.querySelector("section.footnotes")!;
    expect(section.parentElement!.className).toBe("md-chunk");
    expect(section.querySelector("li")!.textContent).toContain("각주 내용");
    expect(root.querySelectorAll(".md-chunk .md-chunk")).toHaveLength(0);
  });
});
