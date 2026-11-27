#!/usr/bin/env node
// 발행 없는 업데이트 E2E용 정적 서버 (결정 20261127-app-update §7) — 127.0.0.1에만 묶는다. 의존성 없음.
//
//   node scripts/update-e2e/serve.mjs --root <폴더> --port 18733 --log <server.log>
//
// - <폴더> 안 파일을 그대로 내준다(`/latest.json` → <폴더>/latest.json). 시나리오는 그 파일을 바꿔 끼워 「새 버전」을 흉내 낸다
// - 요청마다 시각·메서드·경로·상태·헤더를 JSON 한 줄로 로그에 남긴다 — 업데이터가 무엇을 보내는지(개인정보 문구 근거)
// - `..`·절대 경로는 막는다

import { createReadStream, appendFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, normalize, resolve, sep } from "node:path";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const root = resolve(args.root ?? ".");
const port = Number(args.port ?? 18733);
const log = args.log ?? join(root, "..", "server.log");

function record(entry) {
  appendFileSync(log, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n", "utf8");
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[\\/]+/, "");
  const file = resolve(root, rel);
  const entry = { method: req.method, path: url.pathname, headers: req.headers };
  if (!file.startsWith(root + sep) || rel.includes("..")) {
    res.writeHead(403).end();
    record({ ...entry, status: 403 });
    return;
  }
  let size;
  try {
    const st = statSync(file);
    if (!st.isFile()) throw new Error("not a file");
    size = st.size;
  } catch {
    res.writeHead(404).end();
    record({ ...entry, status: 404 });
    return;
  }
  const type = file.endsWith(".json") ? "application/json" : "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Cache-Control": "no-store" });
  if (req.method === "HEAD") {
    res.end();
  } else {
    createReadStream(file).pipe(res);
  }
  record({ ...entry, status: 200, size });
});

server.listen(port, "127.0.0.1", () => {
  record({ event: "listen", port, root });
  console.log(`serve: http://127.0.0.1:${port}/ → ${root}`);
});
