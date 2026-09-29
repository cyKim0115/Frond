/**
 * 브라우저에서 도는 Windows 경로 조립 — Node `path`를 쓰지 않는다.
 * 문서 폴더(`baseDir`) 기준 상대 경로를 절대 경로로 만들어 `convertFileSrc`·앱 내 열기에 넘긴다.
 */

const DRIVE_RE = /^[a-zA-Z]:(?=[\\/]|$)/;
const UNC_RE = /^[\\/]{2}[^\\/]+[\\/][^\\/]+/;

/** `%20`·`%5B` 같은 퍼센트 인코딩을 **한 번만** 푼다. 잘못된 시퀀스(`100%.png`)면 원문 유지 */
export function decodePercent(value: string): string {
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** `C:\…`·`C:/…`·`\\server\share\…` */
export function isAbsoluteWindowsPath(path: string): boolean {
  return DRIVE_RE.test(path) || UNC_RE.test(path);
}

/** 드라이브(`C:`)나 UNC 루트(`\\server\share`)를 떼어 낸다. 둘 다 아니면 prefix는 빈 문자열 */
function splitRoot(path: string): { prefix: string; rest: string } {
  const drive = DRIVE_RE.exec(path);
  if (drive) return { prefix: drive[0].toUpperCase(), rest: path.slice(drive[0].length) };
  const unc = UNC_RE.exec(path);
  if (unc) return { prefix: `\\\\${unc[0].slice(2)}`, rest: path.slice(unc[0].length) };
  return { prefix: "", rest: path };
}

/**
 * `baseDir` 기준으로 `rel`을 절대 Windows 경로로 만든다.
 * - `rel`은 markdown-it이 정규화한(퍼센트 인코딩된) 링크 목적지 그대로 넘긴다. 여기서 한 번 디코드한다
 * - `/`·`\` 둘 다 구분자, `.`·`..` 정리, `..`는 루트 위로 올라가지 않는다
 * - `rel`이 이미 절대 경로(`D:\x`, `\\server\share\x`)면 `baseDir`을 무시한다
 * - `#`·`?`는 파일명의 일부로 본다 (`hash/#tag.png`). URL 파싱을 하지 않는다
 */
export function resolvePath(baseDir: string, rel: string): string {
  const target = decodePercent(rel).replace(/\//g, "\\");
  const base = baseDir.replace(/\//g, "\\");

  let prefix: string;
  let rest: string;
  if (isAbsoluteWindowsPath(target)) {
    ({ prefix, rest } = splitRoot(target));
  } else {
    const root = splitRoot(base);
    prefix = root.prefix;
    rest = target.startsWith("\\") ? target : `${root.rest}\\${target}`;
  }

  const segments: string[] = [];
  for (const segment of rest.split("\\")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  const rooted = prefix !== "" || rest.startsWith("\\");
  return `${prefix}${rooted ? "\\" : ""}${segments.join("\\")}`;
}
