#!/usr/bin/env node
// 앱 버전 한 번에 올리기 (결정 20261127-app-update §6)
//
//   node scripts/release/bump-version.mjs 0.2.1        # 고치고 서로 같은지 확인
//   node scripts/release/bump-version.mjs --check      # 고치지 않고 같은지만 (release-build.ps1)
//
// 고치는 곳: package.json·package-lock.json(npm version), src-tauri/tauri.conf.json `version`, src-tauri/Cargo.toml [package],
// Cargo.lock의 frond 항목(cargo check -p frond가 갱신). crates/frond-core는 앱 버전과 묶지 않는다.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const file = (p) => join(REPO, p);

export function readVersions() {
  const pkg = JSON.parse(readFileSync(file("package.json"), "utf8"));
  const lock = JSON.parse(readFileSync(file("package-lock.json"), "utf8"));
  const conf = JSON.parse(readFileSync(file("src-tauri/tauri.conf.json"), "utf8"));
  const cargo = readFileSync(file("src-tauri/Cargo.toml"), "utf8");
  const cargoLock = readFileSync(file("Cargo.lock"), "utf8");
  return {
    "package.json": pkg.version,
    "package-lock.json": lock.version,
    'package-lock.json packages[""]': lock.packages?.[""]?.version,
    "src-tauri/tauri.conf.json": conf.version,
    "src-tauri/Cargo.toml": /^\[package\][\s\S]*?^version = "([^"]+)"/m.exec(cargo)?.[1],
    "Cargo.lock frond": /\[\[package\]\]\r?\nname = "frond"\r?\nversion = "([^"]+)"/.exec(cargoLock)?.[1],
  };
}

function check(expected) {
  const v = readVersions();
  const want = expected ?? v["package.json"];
  const bad = Object.entries(v).filter(([, x]) => x !== want);
  for (const [k, x] of Object.entries(v)) console.log(`${x === want ? "  " : "✗ "}${k}: ${x}`);
  if (bad.length) throw new Error(`버전이 ${want}로 맞지 않습니다: ${bad.map(([k]) => k).join(", ")}`);
  return want;
}

/** 줄 하나만 바꾼다 — 서식·줄바꿈은 그대로 */
function replaceOnce(path, re, to) {
  const text = readFileSync(file(path), "utf8");
  if (!re.test(text)) throw new Error(`${path}에서 버전 줄을 찾지 못했습니다`);
  writeFileSync(file(path), text.replace(re, to), "utf8");
}

function bump(version) {
  if (!SEMVER.test(version)) throw new Error(`semver가 아닙니다: ${version}`);
  execSync(`npm version ${version} --no-git-tag-version --allow-same-version`, { cwd: REPO, stdio: "inherit" });
  replaceOnce("src-tauri/tauri.conf.json", /^(\s*"version":\s*")[^"]+(")/m, `$1${version}$2`);
  replaceOnce("src-tauri/Cargo.toml", /^(\[package\][\s\S]*?^version = ")[^"]+(")/m, `$1${version}$2`);
  execSync("cargo check -p frond --quiet", { cwd: REPO, stdio: "inherit" });
  check(version);
  console.log(`버전 ${version} — CHANGELOG 절 제목은 실제 릴리스 때 '## ${version} — 날짜'로 바꾼다`);
}

const arg = process.argv[2];
try {
  if (!arg) throw new Error("버전이나 --check를 주세요");
  if (arg === "--check") check(process.argv[3]);
  else bump(arg.replace(/^v/, ""));
} catch (e) {
  console.error(`bump-version: ${e.message}`);
  process.exit(1);
}
