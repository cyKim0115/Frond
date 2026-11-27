#!/usr/bin/env node
// latest.json 만들기 (결정 20261127-app-update §6) — Tauri updater가 읽는 정적 JSON. E2E(scripts/update-e2e)와 릴리스가 같이 쓴다.
//
//   node scripts/release/make-latest-json.mjs --version 0.2.1 --notes-file notes.md \
//     --sig Frond_0.2.1_x64-setup.exe.sig --url https://github.com/…/Frond_0.2.1_x64-setup.exe --out latest.json
//
// - signature 값은 .sig 파일 **내용** 그대로(base64 한 줄)다. 경로가 아니다
// - pub_date는 RFC 3339(지금 시각, --date로 바꿀 수 있음). version은 semver(앞 v 없이)
// - 의존성 없음(node: 내장 모듈만)

import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** 인수 → 검증된 latest.json 값. 틀리면 던진다 */
export function makeLatest({ version, notes, signature, url, date = new Date() }) {
  if (!SEMVER.test(version ?? "")) throw new Error(`version이 semver가 아닙니다: ${version}`);
  const sig = (signature ?? "").trim();
  if (!/^[A-Za-z0-9+/=]+$/.test(sig) || sig.length < 100) throw new Error("signature가 .sig 파일 내용(base64)이 아닙니다");
  // .sig 내용은 base64로 싼 minisign 서명 — 풀면 untrusted comment 줄로 시작한다
  if (!Buffer.from(sig, "base64").toString("utf8").startsWith("untrusted comment:")) throw new Error("signature를 풀어도 minisign 서명이 아닙니다");
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`url이 주소가 아닙니다: ${url}`);
  }
  if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(`url은 http(s)만: ${url}`);
  const pubDate = new Date(date);
  if (Number.isNaN(pubDate.getTime())) throw new Error(`날짜가 틀렸습니다: ${date}`);
  return {
    version,
    notes: (notes ?? "").replace(/\r\n/g, "\n").trim(),
    pub_date: pubDate.toISOString().replace(/\.\d{3}Z$/, "Z"),
    platforms: { "windows-x86_64": { signature: sig, url: parsed.href } },
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`알 수 없는 인수: ${a}`);
    const v = argv[i + 1];
    if (v === undefined) throw new Error(`${a} 값이 없습니다`);
    out[a.slice(2)] = v;
    i++;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  for (const need of ["version", "sig", "url", "out"]) if (!args[need]) throw new Error(`--${need}가 필요합니다`);
  const latest = makeLatest({
    version: args.version.replace(/^v/, ""),
    notes: args["notes-file"] ? readFileSync(args["notes-file"], "utf8") : "",
    signature: readFileSync(args.sig, "utf8"),
    url: args.url,
    date: args.date ?? new Date(),
  });
  writeFileSync(args.out, JSON.stringify(latest, null, 2) + "\n", "utf8");
  console.log(`${args.out} — ${latest.version} → ${latest.platforms["windows-x86_64"].url}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (e) {
    console.error(`make-latest-json: ${e.message}`);
    process.exit(1);
  }
}
