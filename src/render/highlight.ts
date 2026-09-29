/**
 * highlight.js core + 언어별 지연 로드 (brief R13).
 * `renderMarkdown`은 `<pre><code class="language-xxx" data-lang="xxx">`만 내고, 셸이 DOM에 넣은 뒤
 * `highlightCodeBlocks(article)`를 부른다. 언어 모듈은 처음 만날 때 한 번만 import → 등록. 모르는 언어는 그대로 둔다.
 * (2 MB 초과 문서에서 생략하는 판단은 셸 몫 — 스펙 `largeSoftLimit`)
 */

import type { LanguageFn } from "highlight.js";
import hljs from "highlight.js/lib/core";

type LanguageModule = { default: LanguageFn };

/**
 * Vite가 빌드 시 언어별 청크로 쪼개는 지연 로더 맵 (`eager` 아님 — 전부 미리 싣지 않는다).
 * `exhaustive`가 없으면 Vite가 `node_modules`를 glob에서 제외한다. ESM 빌드(`es/`)를 써야 dev 서버가 CJS 변환 없이 서빙한다.
 */
const loaders = import.meta.glob<LanguageModule>(
  // hljs 11은 `abnf.js.js` 같은 deprecation 심(shim, 경고 후 재export)을 함께 배포한다 — glob에서 빼야 빌드 청크가 두 배로 안 나온다
  ["/node_modules/highlight.js/es/languages/*.js", "!**/*.js.js"],
  { exhaustive: true },
);

const loaderByName = new Map<string, () => Promise<LanguageModule>>();
for (const [path, load] of Object.entries(loaders)) {
  const file = path.slice(path.lastIndexOf("/") + 1);
  loaderByName.set(file.replace(/\.js$/, ""), load);
}

/** 펜스 info → hljs 파일명. 로드 전에는 hljs가 alias를 모르므로 흔한 것만 여기서 푼다. Map이라 `constructor` 같은 프로토타입 이름에 안전 */
const ALIASES = new Map<string, string>(Object.entries({
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hh: "cpp",
  h: "c",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "shell",
  ps: "powershell",
  ps1: "powershell",
  pwsh: "powershell",
  bat: "dos",
  cmd: "dos",
  yml: "yaml",
  py: "python",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  golang: "go",
  html: "xml",
  xhtml: "xml",
  svg: "xml",
  md: "markdown",
  mkd: "markdown",
  mkdown: "markdown",
  jsonc: "json",
  json5: "json",
  docker: "dockerfile",
}));

const PLAIN = new Set(["text", "txt", "plain", "plaintext", "none", "nohighlight"]);

/** 펜스 언어 표기 → 로드할 hljs 언어 이름. 빈 값·평문 표기는 `undefined` (하이라이트 생략) */
export function resolveLanguage(requested: string): string | undefined {
  const key = requested.trim().toLowerCase();
  if (key === "" || PLAIN.has(key)) return undefined;
  return ALIASES.get(key) ?? key;
}

const pending = new Map<string, Promise<boolean>>();

/** 언어를 (필요하면 import해서) 등록한다. 모르는 언어·로드 실패는 `false` */
async function ensureLanguage(name: string): Promise<boolean> {
  const load = loaderByName.get(name);
  if (!load) return false; // 배포 언어 파일에 없는 이름은 hljs에 묻지 않는다
  if (hljs.getLanguage(name)) return true;
  const inFlight = pending.get(name);
  if (inFlight) return inFlight;
  const job = load()
    .then((mod) => {
      if (!hljs.getLanguage(name)) hljs.registerLanguage(name, mod.default);
      return true;
    })
    .catch(() => false);
  pending.set(name, job);
  return job;
}

/** `root` 안의 `pre > code.language-*`를 제자리에서 하이라이트한다. 모르는 언어는 평문 그대로 */
export async function highlightCodeBlocks(root: HTMLElement): Promise<void> {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('pre > code[class*="language-"]'));
  await Promise.all(blocks.map(highlightBlock));
}

/** 한 블록의 실패(로드·하이라이트 예외)는 그 블록만 평문으로 남기고 나머지·호출자에게 번지지 않는다 */
async function highlightBlock(code: HTMLElement): Promise<void> {
  if (code.classList.contains("hljs")) return;
  const requested = code.dataset.lang ?? /(?:^|\s)language-(\S+)/.exec(code.className)?.[1] ?? "";
  const name = resolveLanguage(requested);
  if (!name) return;
  try {
    if (!(await ensureLanguage(name))) return;
    const { value } = hljs.highlight(code.textContent ?? "", { language: name, ignoreIllegals: true });
    code.innerHTML = value;
    code.classList.add("hljs");
  } catch {
    // 평문 유지
  }
}
