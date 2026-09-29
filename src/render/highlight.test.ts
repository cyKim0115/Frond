import hljs from "highlight.js/lib/core";
import { describe, expect, it } from "vitest";
import { highlightCodeBlocks, resolveLanguage } from "./highlight";

describe("highlightCodeBlocks", () => {
  it("언어를 지연 로드해 제자리에서 하이라이트하고, 모르는 언어와 언어 없는 블록은 그대로 둔다", async () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<pre><code class="language-typescript" data-lang="typescript">const a: number = 1;</code></pre>' +
      '<pre><code class="language-nope" data-lang="nope">const b = 2;</code></pre>' +
      '<pre><code class="language-ts" data-lang="ts">let c = 3;</code></pre>' +
      '<pre><code class="language-csharp" data-lang="csharp">public static string Greet(string name) =&gt; $"Hello, {name}!";</code></pre>' +
      "<pre><code>plain &lt;x&gt;</code></pre>";

    expect(hljs.listLanguages()).not.toContain("typescript");
    await highlightCodeBlocks(root);

    const codes = root.querySelectorAll("code");
    expect(codes[0].classList.contains("hljs")).toBe(true);
    expect(codes[0].innerHTML).toContain('class="hljs-');
    expect(codes[0].textContent).toBe("const a: number = 1;");

    expect(codes[1].classList.contains("hljs")).toBe(false);
    expect(codes[1].innerHTML).toBe("const b = 2;");

    expect(codes[2].classList.contains("hljs")).toBe(true);
    expect(codes[3].classList.contains("hljs")).toBe(true);
    expect(codes[3].innerHTML).toContain('class="hljs-');
    expect(codes[3].textContent).toBe('public static string Greet(string name) => $"Hello, {name}!";');

    expect(codes[4].classList.contains("hljs")).toBe(false);
    expect(codes[4].innerHTML).toBe("plain &lt;x&gt;");

    const loaded = hljs.listLanguages();
    expect(loaded).toContain("typescript");
    expect(loaded).toContain("csharp");
    expect(loaded).not.toContain("python");
    expect(loaded.length).toBeLessThan(10);
  });

  it("프로토타입 이름·.js.js 심(shim) 이름의 펜스 언어는 평문으로 두고 호출은 reject되지 않는다", async () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<pre><code class="language-constructor" data-lang="constructor">x</code></pre>' +
      '<pre><code class="language-__proto__" data-lang="__proto__">y</code></pre>' +
      '<pre><code class="language-toString" data-lang="toString">z</code></pre>' +
      '<pre><code class="language-abnf.js" data-lang="abnf.js">w</code></pre>' +
      '<pre><code class="language-json" data-lang="json">{"k": 1}</code></pre>';
    await expect(highlightCodeBlocks(root)).resolves.toBeUndefined();
    const codes = Array.from(root.querySelectorAll("code"));
    expect(codes.slice(0, 4).map((c) => c.classList.contains("hljs"))).toEqual([false, false, false, false]);
    expect(codes.slice(0, 4).map((c) => c.innerHTML)).toEqual(["x", "y", "z", "w"]);
    expect(codes[4].classList.contains("hljs")).toBe(true);
    expect(hljs.listLanguages()).not.toContain("constructor");
  });

  it("두 번 불러도 이미 하이라이트한 블록은 다시 건드리지 않는다", async () => {
    const root = document.createElement("div");
    root.innerHTML = '<pre><code class="language-json" data-lang="json">{"a": 1}</code></pre>';
    await highlightCodeBlocks(root);
    const once = root.querySelector("code")!.innerHTML;
    await highlightCodeBlocks(root);
    expect(root.querySelector("code")!.innerHTML).toBe(once);
  });
});

describe("resolveLanguage", () => {
  it("흔한 별칭을 hljs 파일명으로, 평문 표기는 undefined로", () => {
    expect(resolveLanguage("TS")).toBe("typescript");
    expect(resolveLanguage("c#")).toBe("csharp");
    expect(resolveLanguage("yml")).toBe("yaml");
    expect(resolveLanguage("html")).toBe("xml");
    expect(resolveLanguage("rust")).toBe("rust");
    expect(resolveLanguage("unknownlang")).toBe("unknownlang");
    expect(resolveLanguage("constructor")).toBe("constructor");
    expect(resolveLanguage("__proto__")).toBe("__proto__");
    expect(resolveLanguage("text")).toBeUndefined();
    expect(resolveLanguage("")).toBeUndefined();
  });
});
