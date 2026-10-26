import { describe, expect, it } from "vitest";
import { buildSafeDoc, htmlTitle, isHtmlPath, messageTarget, safeCsp, VIEW_ORIGIN, viewTarget } from "./html-view";

const BASE = `${VIEW_ORIGIN}/0123456789abcdef0123456789abcdef/`;

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("isHtmlPath", () => {
  it(".html·.htm만 (대소문자 무시)", () => {
    expect(isHtmlPath("C:\\a\\보고서.HTML")).toBe(true);
    expect(isHtmlPath("x.htm")).toBe(true);
    expect(isHtmlPath("x.md")).toBe(false);
    expect(isHtmlPath("x.xhtml")).toBe(false);
    expect(isHtmlPath("x.html.md")).toBe(false);
  });
});

describe("buildSafeDoc — 안전 보기 srcdoc", () => {
  const source = `<!DOCTYPE html><html lang="ko"><head><meta charset="euc-kr"><base href="https://evil.example/">
<meta http-equiv="refresh" content="0;url=https://evil.example/">
<link rel="preconnect" href="https://fonts.gstatic.com"><link rel="stylesheet" href="style.css">
<script>alert(1)</script><script src="https://cdn.example/x.js"></script></head>
<body onload="alert(2)"><p id="p" onclick="alert(3)" style="color:red">본문</p>
<a id="j" href=" java&#9;script:alert(4)">j</a><a id="ok" href="next.html">next</a>
<svg><script>alert(5)</script><a id="s" xlink:href="javascript:alert(6)"><text>t</text></a></svg>
<form id="f" action="javascript:alert(7)"><button formaction="javascript:alert(8)">b</button></form>
<iframe id="i" srcdoc="&lt;script&gt;alert(9)&lt;/script&gt;"></iframe>
<img id="img" src="img/a.png"></body></html>`;
  const { html, blocked } = buildSafeDoc(source, BASE, "#1f6feb");
  const doc = parse(html);

  it("doctype을 지키고 head 맨 앞에 CSP·base·찾기 스타일을 넣는다", () => {
    expect(html.startsWith("<!DOCTYPE html><html lang=\"ko\"><head><meta http-equiv=\"Content-Security-Policy\"")).toBe(true);
    const head = Array.from(doc.head.children).map((el) => el.localName);
    expect(head.slice(0, 3)).toEqual(["meta", "base", "style"]);
    expect(doc.head.querySelector("meta[http-equiv]")!.getAttribute("content")).toBe(safeCsp(VIEW_ORIGIN));
    expect(doc.querySelectorAll("base")).toHaveLength(1);
    expect(doc.querySelector("base")!.getAttribute("href")).toBe(BASE);
    expect(doc.head.querySelector("style[data-frond]")!.textContent).toContain("::highlight(find-current)");
  });

  it("스크립트·이벤트 처리기·javascript: URL·meta refresh·미리 연결을 지운다", () => {
    expect(doc.querySelectorAll("script")).toHaveLength(0);
    expect(blocked.scripts).toBe(3);
    expect(doc.body.hasAttribute("onload")).toBe(false);
    expect(doc.getElementById("p")!.hasAttribute("onclick")).toBe(false);
    expect(doc.getElementById("p")!.getAttribute("style")).toBe("color:red");
    expect(blocked.handlers).toBe(2);
    expect(doc.getElementById("j")!.hasAttribute("href")).toBe(false);
    expect(doc.getElementById("ok")!.getAttribute("href")).toBe("next.html");
    expect(doc.getElementById("s")!.getAttributeNames().some((n) => n.endsWith("href"))).toBe(false);
    expect(doc.getElementById("f")!.hasAttribute("action")).toBe(false);
    expect(doc.querySelector("button")!.hasAttribute("formaction")).toBe(false);
    expect(doc.querySelector("meta[http-equiv=refresh]")).toBeNull();
    expect(doc.querySelector("link[rel=preconnect]")).toBeNull();
    expect(doc.querySelector("link[rel=stylesheet]")!.getAttribute("href")).toBe("style.css");
    // 중첩 srcdoc은 샌드박스를 물려받아 돌지 않지만, 문자열로 남은 스크립트도 표시하지 않는다 — 속성째 둔다(문서 모양 유지)
    expect(doc.getElementById("i")).not.toBeNull();
    expect(doc.getElementById("img")!.getAttribute("src")).toBe("img/a.png");
  });

  it("외부 리소스가 있으면 알린다 — 링크(a)는 리소스가 아니다", () => {
    expect(blocked.remote).toBe(true);
    expect(buildSafeDoc('<a href="https://x.example/">x</a><img src="a.png">', BASE).blocked.remote).toBe(false);
    expect(buildSafeDoc('<img srcset="a.png 1x, https://x.example/b.png 2x">', BASE).blocked.remote).toBe(true);
    expect(buildSafeDoc("<style>@import url('//cdn.example/a.css');</style>", BASE).blocked.remote).toBe(true);
    expect(buildSafeDoc('<div style="background:url(https://t.example/p.gif)"></div>', BASE).blocked.remote).toBe(true);
    expect(buildSafeDoc('<link rel="canonical" href="https://x.example/">', BASE).blocked.remote).toBe(false);
  });

  it("doctype 없는 문서는 그대로(호환 모드), 조각만 있어도 head·body를 만든다", () => {
    const { html } = buildSafeDoc("<p>조각</p>", BASE);
    expect(html.startsWith("<html><head><meta")).toBe(true);
    expect(parse(html).body.textContent).toBe("조각");
    expect(buildSafeDoc('<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><p>x', BASE).html).toMatch(
      /^<!DOCTYPE html PUBLIC "-\/\/W3C\/\/DTD HTML 4\.01\/\/EN" "http:\/\/www\.w3\.org\/TR\/html4\/strict\.dtd"><html>/,
    );
  });

  it("CSP는 리소스 origin만 열고 스크립트·연결·폼을 막는다", () => {
    const csp = safeCsp(VIEW_ORIGIN);
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain(`img-src ${VIEW_ORIGIN} data:`);
    expect(csp).not.toMatch(/https:|ipc|asset/);
  });
});

describe("htmlTitle", () => {
  it("<title> → 없으면 첫 <h1>, 공백을 접고 엔티티를 푼다", () => {
    expect(htmlTitle("<html><head><title>\n  보고서 &amp; 결론 </title></head></html>")).toBe("보고서 & 결론");
    expect(htmlTitle("<body><h1>첫 <em>제목</em></h1><h1>둘째</h1></body>")).toBe("첫 제목");
    expect(htmlTitle("<title></title><h1>대신</h1>")).toBe("대신");
    expect(htmlTitle("<p>없음</p>")).toBeUndefined();
    expect(htmlTitle(`<title>${"가".repeat(200)}</title>`)!.length).toBe(120);
  });
});

describe("viewTarget — 안전 보기 링크", () => {
  const dir = "C:\\docs\\r";
  it("조각·외부·문서·그 밖", () => {
    expect(viewTarget("#%ED%91%9C", dir)).toEqual({ kind: "fragment", id: "표" });
    expect(viewTarget("https://example.com/a b", dir)).toEqual({ kind: "external", url: "https://example.com/a%20b" });
    expect(viewTarget("mailto:a@b.co", dir)).toEqual({ kind: "external", url: "mailto:a@b.co" });
    expect(viewTarget("next.html#x", dir)).toEqual({ kind: "doc", path: "C:\\docs\\r\\next.html" });
    expect(viewTarget("../README.md", dir)).toEqual({ kind: "doc", path: "C:\\docs\\README.md" });
    expect(viewTarget("file:///D:/x/y.htm", dir)).toEqual({ kind: "doc", path: "D:\\x\\y.htm" });
    expect(viewTarget("data.json", dir)).toEqual({ kind: "none" });
    expect(viewTarget("javascript:alert(1)", dir)).toEqual({ kind: "none" });
    expect(viewTarget("file:///C:/x.exe", dir)).toEqual({ kind: "none" });
    expect(viewTarget("", dir)).toEqual({ kind: "none" });
  });
});

describe("messageTarget — 스크립트 허용 보기 도우미 메시지", () => {
  const dir = "C:\\docs\\r";
  it("href 원문을 문서 폴더 기준으로 — 폴더 위(../)도, 조각은 무시, 외부는 브라우저", () => {
    expect(messageTarget("../showcase.md", `${VIEW_ORIGIN}/showcase.md`, dir)).toEqual({ kind: "doc", path: "C:\\docs\\showcase.md" });
    expect(messageTarget("sub/보.html#a", `${BASE}sub/%EB%B3%B4.html#a`, dir)).toEqual({ kind: "doc", path: "C:\\docs\\r\\sub\\보.html" });
    expect(messageTarget("data.json", `${BASE}data.json`, dir)).toEqual({ kind: "none" });
    expect(messageTarget("#x", `${BASE}a.html#x`, dir)).toEqual({ kind: "none" });
    expect(messageTarget("https://example.com/", "https://example.com/", dir)).toEqual({ kind: "external", url: "https://example.com/" });
    expect(messageTarget("javascript:alert(1)", "javascript:alert(1)", dir)).toEqual({ kind: "none" });
  });
  it("원문이 없으면 외부 절대 주소만", () => {
    expect(messageTarget(undefined, "https://example.com/a", dir)).toEqual({ kind: "external", url: "https://example.com/a" });
    expect(messageTarget(undefined, `${BASE}notes.md`, dir)).toEqual({ kind: "none" });
    expect(messageTarget(42, "file:///C:/x.html", dir)).toEqual({ kind: "none" });
  });
});
