#!/usr/bin/env node
// 발행 없는 앱 안 업데이트 E2E (결정 20261127-app-update §7) — 진입점은 run.ps1, 돌리는 법은 README.md.
//
//   node scripts/update-e2e/e2e.mjs <명령> --work <작업 폴더> [인수…]
//     build            일회용 시험 키 → 격리 덧설정 → 시험 설치기 0.9.0·0.9.1·0.9.2 빌드 → 서버 폴더(latest.json 변형)
//     snapshot <이름>  실제 설치본 상태(exe 해시·버전, 레지스트리, 바로 가기, %APPDATA%\Frond)를 <작업>\snapshot-<이름>.json으로
//     compare <a> <b>  두 스냅숏 비교(S14)
//     serve start|stop 127.0.0.1 시험 서버
//     use <변형>       서버의 latest.json 바꾸기 — 0.9.1 | 0.9.2 | tampered
//     install <버전>   시험 설치기 /S (Claude 컨테이너 밖, WMI)
//     run <S…>         시나리오 (S1 S2 S3 S9 S10 S8 S13 S7S6 A B, 살펴보기 probe) — A = S4+S11+S12, B = S5
//     reset            시험 앱 데이터 폴더 지우기(처음 상태)
//     cleanup          시험 설치본 제거·데이터·빌드 폴더·시험 키·시험 문서 초안 지우기
//
// 격리: identifier `com.cykim.mdeditor.updatetest`, productName `FrondUpdateTest`, mainBinaryName `mdeditor-updatetest`,
// 파일 연결·NSIS 훅 없음, http://127.0.0.1 엔드포인트, 시험 공개 키. 덧설정은 작업 폴더(저장소 밖)에만 만들고 --config로만 넘긴다.
// 실제 설치본(%LOCALAPPDATA%\Frond, ProgId MdEditor.Markdown, RegisteredApplications\Frond)은 읽기만 한다.

import { execFileSync, spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeLatest } from "../release/make-latest-json.mjs";
import { Cdp, clickDialog, clickPanel, closeSettings, dialogState, openUpdateSettings, panelState, pillState, tabsState } from "./cdp.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const TEST = {
  identifier: "com.cykim.mdeditor.updatetest",
  productName: "FrondUpdateTest",
  binary: "mdeditor-updatetest",
  // 0.9.2는 S3 「건너뛴 버전보다 새 버전」용 — 서명에 버전이 들어가 같은 설치기를 다른 버전으로 내줄 수 없다(updater 2.14가 거절)
  versions: ["0.9.0", "0.9.1", "0.9.2"],
  port: 18733,
  cdpPort: 9339,
};

const LOCAL = process.env.LOCALAPPDATA;
const INSTALL_DIR = join(LOCAL, TEST.productName);
const DATA_DIR = join(LOCAL, TEST.identifier);
const EXE = join(INSTALL_DIR, `${TEST.binary}.exe`);
const TARGET = join(REPO, "target", "update-test");

// ---- 인수 ---------------------------------------------------------------------------------

const argv = process.argv.slice(2);
function opt(name) {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}
const WORK = resolve(opt("work") ?? process.env.FROND_E2E_WORK ?? "");
if (!WORK || WORK === resolve("")) throw new Error("--work <작업 폴더>가 필요합니다 (저장소 밖)");
if (WORK.toLowerCase().startsWith(REPO.toLowerCase())) throw new Error("작업 폴더는 저장소 밖이어야 합니다 — 시험 키·덧설정이 커밋되지 않게");
const P = {
  keys: join(WORK, "keys"),
  key: join(WORK, "keys", "test.key"),
  www: join(WORK, "www"),
  docs: join(WORK, "docs"),
  shots: join(WORK, "shots"),
  log: join(WORK, "server.log"),
  results: join(WORK, "results.json"),
  serverPid: join(WORK, "server.pid"),
};

// ---- 도우미 ------------------------------------------------------------------------------

function ps(script) {
  // Windows PowerShell 5.1 — 출력은 UTF-8로
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `[Console]::OutputEncoding=[Text.Encoding]::UTF8; ${script}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(`powershell 실패: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
}

const psq = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Claude 데스크톱(MSIX) 컨테이너 밖에서 프로세스 띄우기 — AppData 쓰기가 실제 폴더로 가게(메모리 claude-msix-appdata-virtualization) */
function wmiStart(commandLine) {
  const out = ps(`$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine=${psq(commandLine)}}; "$($r.ReturnValue) $($r.ProcessId)"`);
  const [rv, pid] = out.split(/\s+/).map(Number);
  if (rv !== 0) throw new Error(`WMI Create 실패 ${rv}: ${commandLine}`);
  return pid;
}

function pidAlive(pid) {
  return ps(`if (Get-Process -Id ${pid} -ErrorAction SilentlyContinue) { 'yes' } else { 'no' }`) === "yes";
}

/** 시험 앱 프로세스 목록 (이름 mdeditor-updatetest) */
function appPids() {
  const out = ps(`(Get-Process -Name ${TEST.binary} -ErrorAction SilentlyContinue | ForEach-Object { $_.Id }) -join ','`);
  return out ? out.split(",").map(Number) : [];
}

async function waitUntil(fn, timeoutMs, label) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const v = await fn();
    if (v) return v;
    await sleep(300);
  }
  throw new Error(`기다림 시간 넘음: ${label}`);
}

function serverLog() {
  if (!existsSync(P.log)) return [];
  return readFileSync(P.log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function results() {
  return existsSync(P.results) ? JSON.parse(readFileSync(P.results, "utf8")) : {};
}

function record(id, value) {
  const all = results();
  all[id] = { ...value, at: new Date().toISOString() };
  writeFileSync(P.results, JSON.stringify(all, null, 2), "utf8");
  console.log(`[${id}] ${value.pass === true ? "통과" : value.pass === false ? "실패" : "기록"} — ${value.note ?? ""}`);
}

function gitSrcTauriClean() {
  return spawnSync("git", ["diff", "--quiet", "--", "src-tauri/"], { cwd: REPO }).status === 0;
}

// ---- build --------------------------------------------------------------------------------

function overlay(version, pubkey) {
  return {
    version,
    identifier: TEST.identifier,
    productName: TEST.productName,
    mainBinaryName: TEST.binary,
    plugins: {
      updater: {
        pubkey,
        endpoints: [`http://127.0.0.1:${TEST.port}/latest.json`],
        dangerousInsecureTransportProtocol: true,
      },
    },
    bundle: {
      createUpdaterArtifacts: true,
      // 덧설정 병합에서 null 삭제는 문서에 없어 쓰지 않는다 — 빈 배열·빈 훅 파일
      fileAssociations: [],
      windows: { nsis: { installerHooks: join(WORK, "empty-hooks.nsh") } },
    },
  };
}

function build() {
  if (!gitSrcTauriClean()) throw new Error("src-tauri/에 커밋 안 한 변경이 있습니다 — 시험 설정이 섞이지 않게 깨끗한 상태에서 돌립니다");
  if (process.env.TAURI_CONFIG) throw new Error("TAURI_CONFIG가 남아 있습니다");
  for (const d of [P.keys, P.www, P.docs, P.shots]) mkdirSync(d, { recursive: true });

  // 일회용 시험 키 — 비밀번호 없음(--ci). 진짜 키와 무관
  if (!existsSync(P.key)) {
    const r = spawnSync("npx", ["tauri", "signer", "generate", "--ci", "-w", P.key], { cwd: REPO, encoding: "utf8", shell: true });
    if (r.status !== 0 || !existsSync(P.key + ".pub")) throw new Error(`시험 키를 만들지 못했습니다: ${r.stderr}`);
  }
  const pubkey = readFileSync(P.key + ".pub", "utf8").trim();
  writeFileSync(join(WORK, "empty-hooks.nsh"), "; update-e2e: 빈 NSIS 훅 — 파일 연결·레지스트리 훅을 넣지 않는다\r\n", "utf8");

  const notes = {
    "0.9.1": "- 업데이트 E2E 시험 노트 1\n- 시험 노트 2\n- 시험 노트 3\n- 시험 노트 4\n- 시험 노트 5\n- 시험 노트 6\n- 시험 노트 7",
  };
  for (const version of TEST.versions) {
    if (existsSync(join(WORK, "dist", version, `${TEST.productName}_${version}_x64-setup.exe.sig`))) {
      console.log(`== 빌드 ${version} — 이미 있음`);
      continue;
    }
    const conf = join(WORK, `conf-${version}.json`);
    writeFileSync(conf, JSON.stringify(overlay(version, pubkey), null, 2), "utf8");
    const env = { ...process.env, CARGO_TARGET_DIR: TARGET, TAURI_SIGNING_PRIVATE_KEY: P.key, TAURI_SIGNING_PRIVATE_KEY_PASSWORD: "" };
    delete env.TAURI_CONFIG;
    console.log(`== 빌드 ${version}`);
    const r = spawnSync("npx", ["tauri", "build", "--config", `"${conf}"`], { cwd: REPO, env, stdio: "inherit", shell: true });
    if (r.status !== 0) throw new Error(`빌드 ${version} 실패`);
    const bundle = join(TARGET, "release", "bundle", "nsis");
    const setup = join(bundle, `${TEST.productName}_${version}_x64-setup.exe`);
    if (!existsSync(setup) || !existsSync(setup + ".sig")) throw new Error(`설치기·서명이 없습니다: ${setup}`);
    const out = join(WORK, "dist", version);
    mkdirSync(out, { recursive: true });
    copyFileSync(setup, join(out, basename(setup)));
    copyFileSync(setup + ".sig", join(out, basename(setup) + ".sig"));
    copyFileSync(join(TARGET, "release", "nsis", "x64", "installer.nsi"), join(WORK, `installer-${version}.nsi`));
  }
  if (!gitSrcTauriClean()) throw new Error("빌드 뒤 src-tauri/가 바뀌었습니다 — 시험 설정이 저장소에 쓰였는지 확인");

  // 격리 확인 — 생성된 installer.nsi
  const nsi = readFileSync(join(WORK, "installer-0.9.0.nsi"), "utf8");
  const define = (name) => new RegExp(`!define ${name} "([^"]*)"`).exec(nsi)?.[1] ?? null;
  const isolation = {
    PRODUCTNAME: define("PRODUCTNAME"),
    MAINBINARYNAME: define("MAINBINARYNAME"),
    BUNDLEID: define("BUNDLEID"),
    UNINSTKEY: define("UNINSTKEY"),
    MANUPRODUCTKEY: define("MANUPRODUCTKEY"),
    hasProgId: nsi.includes("MdEditor.Markdown"),
    hasRepoHooks: /src-tauri\\nsis\\hooks\.nsh/i.test(nsi),
    hasRegisteredApplications: nsi.includes("RegisteredApplications"),
    hasFileAssoc: /APP_ASSOCIATE|FileAssociation/.test(nsi.replace(/!include[^\n]*FileAssociation\.nsh/g, "")),
  };
  isolation.ok =
    isolation.PRODUCTNAME === TEST.productName &&
    isolation.MAINBINARYNAME === TEST.binary &&
    isolation.BUNDLEID === TEST.identifier &&
    !isolation.hasProgId &&
    !isolation.hasRepoHooks &&
    !isolation.hasRegisteredApplications;
  writeFileSync(join(WORK, "isolation.json"), JSON.stringify(isolation, null, 2), "utf8");
  console.log("격리 확인", isolation);
  if (!isolation.ok) throw new Error("시험 설치기가 실제 설치본과 겹칩니다 — 멈춤");

  // 서버 폴더: 0.9.1 설치기 + 위조본 + latest.json 변형
  const name = `${TEST.productName}_0.9.1_x64-setup.exe`;
  const src = join(WORK, "dist", "0.9.1", name);
  copyFileSync(src, join(P.www, name));
  const bytes = readFileSync(src);
  bytes[Math.floor(bytes.length / 2)] ^= 0xff; // 1바이트 바꿈, .sig는 그대로
  writeFileSync(join(P.www, "tampered-setup.exe"), bytes);
  const sig = readFileSync(src + ".sig", "utf8");
  const name2 = `${TEST.productName}_0.9.2_x64-setup.exe`;
  const src2 = join(WORK, "dist", "0.9.2", name2);
  copyFileSync(src2, join(P.www, name2));
  const sig2 = readFileSync(src2 + ".sig", "utf8");
  const base = `http://127.0.0.1:${TEST.port}`;
  const variants = {
    "0.9.1": makeLatest({ version: "0.9.1", notes: notes["0.9.1"], signature: sig, url: `${base}/${name}` }),
    "0.9.2": makeLatest({ version: "0.9.2", notes: "- 0.9.2 시험 노트", signature: sig2, url: `${base}/${name2}` }),
    tampered: makeLatest({ version: "0.9.1", notes: notes["0.9.1"], signature: sig, url: `${base}/tampered-setup.exe` }),
  };
  for (const [k, v] of Object.entries(variants)) writeFileSync(join(P.www, `latest-${k}.json`), JSON.stringify(v, null, 2), "utf8");
  use("0.9.1");
  makeDocs();
  console.log(`빌드 끝 — ${WORK}`);
}

function use(variant) {
  copyFileSync(join(P.www, `latest-${variant}.json`), join(P.www, "latest.json"));
  console.log(`latest.json = ${variant}`);
}

/** 시험 문서 — 작업 폴더에만. 바이트(BOM·줄바꿈)는 S5가 본다 */
function makeDocs() {
  mkdirSync(P.docs, { recursive: true });
  const lines = (n, tag) => Array.from({ length: n }, (_, i) => (i === 0 ? `# ${tag} 시험 문서` : `${tag} ${i + 1}번째 줄 — 업데이트 E2E`));
  const write = (file, n, { bom = false, eol = "\n" } = {}) => {
    const text = lines(n, basename(file, ".md")).join(eol) + eol;
    writeFileSync(join(P.docs, file), Buffer.concat([bom ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(text, "utf8")]));
  };
  write("a.md", 160, { bom: true, eol: "\r\n" });
  write("b.md", 40);
  write("c.md", 20);
  write("s5-bom-crlf.md", 30, { bom: true, eol: "\r\n" });
  write("s5-lf.md", 30);
  write("s6.md", 20);
  write("s7.md", 20);
}

// ---- 실제 설치본 스냅숏 (S14) ------------------------------------------------------------

function snapshot(name) {
  const script = `
$ErrorActionPreference = 'Stop'
function RegVal($p, $n) { try { $v = Get-ItemProperty -LiteralPath $p -ErrorAction Stop; $v.$n } catch { $null } }
$o = [ordered]@{}
$exe = Join-Path $env:LOCALAPPDATA 'Frond\\mdeditor.exe'
if (Test-Path -LiteralPath $exe) {
  $i = Get-Item -LiteralPath $exe
  $o.exe = [ordered]@{ path = $exe; sha256 = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash; version = $i.VersionInfo.FileVersion; size = $i.Length; mtime = $i.LastWriteTimeUtc.ToString('o'); target = "$($i.Target)" }
} else { $o.exe = $null }
$o.installDir = @(Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA 'Frond') -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { "$($_.FullName.Substring($env:LOCALAPPDATA.Length)) $($_.Length) $($_.LastWriteTimeUtc.ToString('o'))" })
$o.reg = [ordered]@{
  progIdCommand = RegVal 'HKCU:\\Software\\Classes\\MdEditor.Markdown\\shell\\open\\command' '(default)'
  dotMd = RegVal 'HKCU:\\Software\\Classes\\.md' '(default)'
  dotMarkdown = RegVal 'HKCU:\\Software\\Classes\\.markdown' '(default)'
  registeredApplicationsFrond = RegVal 'HKCU:\\Software\\RegisteredApplications' 'Frond'
  userChoiceMd = RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FileExts\\.md\\UserChoice' 'ProgId'
  uninstallFrondVersion = RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Frond' 'DisplayVersion'
  uninstallFrondLocation = RegVal 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Frond' 'InstallLocation'
  manuFrond = (Test-Path 'HKCU:\\Software\\cyKim\\Frond')
  testUninstallKey = (Test-Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${TEST.productName}')
  testManuKey = (Test-Path 'HKCU:\\Software\\cyKim\\${TEST.productName}')
}
$sm = Join-Path $env:APPDATA 'Microsoft\\Windows\\Start Menu\\Programs'
$desk = [Environment]::GetFolderPath('Desktop')
$o.shortcuts = [ordered]@{}
foreach ($f in @((Join-Path $sm 'Frond.lnk'), (Join-Path $desk 'Frond.lnk'), (Join-Path $sm '${TEST.productName}.lnk'), (Join-Path $desk '${TEST.productName}.lnk'))) {
  $o.shortcuts[$f] = if (Test-Path -LiteralPath $f) { (Get-Item -LiteralPath $f).LastWriteTimeUtc.ToString('o') } else { $null }
}
$ad = Join-Path $env:APPDATA 'Frond'
$o.appData = @(Get-ChildItem -LiteralPath $ad -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
  $d = $null
  if ($_.DirectoryName -like '*\\drafts') { try { $d = (Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json).path } catch {} }
  [ordered]@{ rel = $_.FullName.Substring($ad.Length); size = $_.Length; mtime = $_.LastWriteTimeUtc.ToString('o'); draftOf = $d }
})
$o.testInstallDir = Test-Path -LiteralPath (Join-Path $env:LOCALAPPDATA '${TEST.productName}')
$o.testDataDir = Test-Path -LiteralPath (Join-Path $env:LOCALAPPDATA '${TEST.identifier}')
$o.realRunning = @(Get-Process -Name mdeditor -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
$o | ConvertTo-Json -Depth 6
`;
  // 컨테이너 안에서는 AppData가 Claude LocalCache와 합쳐 보인다 — 밖(WMI)에서 돌려 실제 상태를 D:\ 등 작업 폴더에 쓴다
  const ps1 = join(WORK, "snapshot.ps1");
  const file = join(WORK, `snapshot-${name}.json`);
  rmSync(file, { force: true });
  writeFileSync(ps1, `param([string]$Out)
${script.replace(/\$o \| ConvertTo-Json -Depth 6\s*$/, "")}
$o | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $Out -Encoding UTF8
`, "utf8");
  return (async () => {
    const pid = wmiStart(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${ps1}" "${file}"`);
    await waitUntil(() => !pidAlive(pid), 120_000, "스냅숏");
    const json = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
    console.log(`스냅숏 ${file}`);
    return JSON.parse(json);
  })();
}

/** S14 — 실제 설치본에서 바뀐 것. 시험 문서 초안(작업 폴더 문서)은 따로 센다 */
function compare(a, b) {
  const read = (n) => JSON.parse(readFileSync(join(WORK, `snapshot-${n}.json`), "utf8").replace(/^\uFEFF/, ""));
  const A = read(a);
  const B = read(b);
  const diffs = [];
  const same = (k, x, y) => JSON.stringify(x) === JSON.stringify(y) || diffs.push({ k, before: x, after: y });
  same("exe", A.exe, B.exe);
  same("installDir", A.installDir, B.installDir);
  same("reg", A.reg, B.reg);
  same("shortcuts", A.shortcuts, B.shortcuts);
  const key = (f) => `${f.rel} ${f.size} ${f.mtime}`;
  const before = new Set((A.appData ?? []).map(key));
  const after = new Set((B.appData ?? []).map(key));
  const docs = P.docs.toLowerCase();
  const changed = [...(B.appData ?? []).filter((f) => !before.has(key(f))), ...(A.appData ?? []).filter((f) => !after.has(key(f)))];
  const ours = changed.filter((f) => (f.draftOf ?? "").toLowerCase().startsWith(docs) || (f.draftOf ?? "").toLowerCase().startsWith(WORK.toLowerCase()));
  const others = changed.filter((f) => !ours.includes(f));
  if (others.length) diffs.push({ k: "appData(시험 문서 밖)", changed: others });
  const out = { pass: diffs.length === 0, diffs, testDrafts: ours.length };
  console.log(JSON.stringify(out, null, 2));
  return out;
}

// ---- 서버 --------------------------------------------------------------------------------

function serve(action) {
  if (action === "start") {
    if (existsSync(P.serverPid) && pidAlive(Number(readFileSync(P.serverPid, "utf8")))) return console.log("서버 이미 켜짐");
    const child = spawn(process.execPath, [join(HERE, "serve.mjs"), "--root", P.www, "--port", String(TEST.port), "--log", P.log], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
    writeFileSync(P.serverPid, String(child.pid));
    console.log(`서버 켬 pid ${child.pid}`);
  } else {
    if (!existsSync(P.serverPid)) return;
    const pid = Number(readFileSync(P.serverPid, "utf8"));
    try {
      process.kill(pid);
    } catch {
      /* 이미 꺼짐 */
    }
    rmSync(P.serverPid, { force: true });
    console.log("서버 끔");
  }
}

// ---- 설치·실행 ---------------------------------------------------------------------------

async function install(version) {
  if (appPids().length) throw new Error("시험 앱이 떠 있습니다 — 먼저 닫기");
  const setup = join(WORK, "dist", version, `${TEST.productName}_${version}_x64-setup.exe`);
  const pid = wmiStart(`"${setup}" /S`);
  await waitUntil(() => !pidAlive(pid), 180_000, "설치기 끝");
  // 무인 설치가 만든 바탕 화면 바로 가기만 지운다(시작 메뉴는 제거기가 지움)
  ps(`Remove-Item -LiteralPath (Join-Path ([Environment]::GetFolderPath('Desktop')) '${TEST.productName}.lnk') -ErrorAction SilentlyContinue; 'ok'`);
  const v = exeVersion();
  console.log(`설치 ${version} → exe ${v}`);
  if (!v?.startsWith(version)) throw new Error(`설치 뒤 버전 ${v}`);
}

function exeVersion() {
  if (!existsSync(EXE)) return null;
  return ps(`(Get-Item -LiteralPath ${psq(EXE)}).VersionInfo.FileVersion`);
}

/** 시험 앱을 컨테이너 밖에서 CDP 포트와 함께 띄우고 붙는다 */
async function launch({ exe = EXE, args = [] } = {}) {
  if (appPids().length) throw new Error("시험 앱이 이미 떠 있습니다");
  const quoted = args.map((a) => ` "${a}"`).join("");
  wmiStart(`cmd.exe /c set WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=${TEST.cdpPort}&& start "" "${exe}"${quoted}`);
  const pid = await waitUntil(() => appPids()[0], 30_000, "시험 앱 프로세스");
  const cdp = await Cdp.connect(TEST.cdpPort, 60_000);
  await cdp.waitFor(`document.readyState === 'complete' && !!window.__TAURI_INTERNALS__`, 30_000, "앱 준비");
  return { cdp, pid };
}

/** 두 번째 인스턴스로 파일 열기(탐색기 더블클릭과 같은 길) */
async function openFile(cdp, file) {
  wmiStart(`"${EXE}" "${file}"`);
  await cdp.waitFor(`document.querySelector('#status-path')?.title === ${JSON.stringify(file)}`, 15_000, `열림 ${basename(file)}`);
}

/** 키·편집 전 가드 — 시험 폴더 문서인지 */
async function guard(cdp) {
  const path = await cdp.eval(`document.querySelector('#status-path')?.title ?? ''`);
  if (path && !path.toLowerCase().startsWith(P.docs.toLowerCase())) throw new Error(`시험 폴더 밖 문서가 앞에 있습니다: ${path}`);
}

async function key(cdp, { key: k, code, vk, modifiers = 0 }) {
  await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers });
}
/** CDP 마우스로 요소 가운데를 누른다(탭은 pointerdown에서 바뀐다) */
async function clickAt(cdp, elementExpr) {
  const r = await cdp.eval(`(() => { const e = ${elementExpr}; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  if (!r) throw new Error(`누를 요소가 없습니다: ${elementExpr}`);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await cdp.send("Input.dispatchMouseEvent", { type, x: r.x, y: r.y, button: type === "mouseMoved" ? "none" : "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1, pointerType: "mouse" });
  }
}
const CTRL = 2;
const SHIFT = 8;

/** 보기 → 소스(Ctrl+/) 또는 분할(Ctrl+Shift+/) */
async function setMode(cdp, mode) {
  await guard(cdp);
  const cur = await cdp.eval(`document.querySelector('#app')?.dataset.mode ?? document.body.dataset.mode ?? ''`);
  if (mode === "source") await key(cdp, { key: "/", code: "Slash", vk: 191, modifiers: CTRL });
  else await key(cdp, { key: "?", code: "Slash", vk: 191, modifiers: CTRL | SHIFT });
  await cdp.waitFor(`!!document.querySelector('#editor .cm-content')?.cmTile`, 5000, `편집기(${mode}, 전 ${cur})`);
}

const VIEW = `document.querySelector('#editor .cm-content').cmTile.root.view`;

/** 소스 둘째 줄 앞에 글을 넣는다 → dirty */
async function edit(cdp, text) {
  await guard(cdp);
  await cdp.eval(`(() => { const v = ${VIEW}; v.dispatch({ changes: { from: v.state.doc.line(2).from, insert: ${JSON.stringify(text)} }, userEvent: 'input.type' }); return true; })()`);
  await cdp.waitFor(`[...document.querySelectorAll('.tab.dirty')].length > 0`, 5000, "dirty");
}

const editorText = `(() => { const c = document.querySelector('#editor .cm-content'); return c?.cmTile ? c.cmTile.root.view.state.doc.toString() : null; })()`;

/** 정상 종료(#win-close). 저장 확인이 뜨면 label을 누른다 */
async function closeApp(cdp, pid, unsavedLabel = "저장 안 함") {
  await cdp.eval(`document.querySelector('#win-close').click(), true`).catch(() => undefined);
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (!pidAlive(pid)) break;
    const d = await cdp.eval(dialogState).catch(() => null);
    if (d && d.buttons.includes(unsavedLabel)) await clickDialog(cdp, unsavedLabel).catch(() => undefined);
    await sleep(400);
  }
  cdp.close();
  await waitUntil(() => !pidAlive(pid), 20_000, "시험 앱 종료");
  // 같은 identifier 웹뷰가 디스크에 다 쓰도록 잠깐
  await sleep(1500);
}

/** 자동 확인 1시간 제한을 풀어 시작 10초 뒤 바로 확인하게 — 첫 확인 전에 부른다 */
async function clearLastCheck(cdp) {
  await cdp.eval(`(() => { const k = 'frond.update'; const p = JSON.parse(localStorage.getItem(k) ?? 'null'); if (p) { p.lastCheckAt = null; localStorage.setItem(k, JSON.stringify(p)); } return true; })()`);
}

async function setSelect(cdp, id, value) {
  await cdp.eval(`document.querySelector('#open-settings').click(), true`);
  await cdp.waitFor(`!!document.querySelector('#${id}')`, 5000, id);
  await cdp.call(
    ([sel, v]) => {
      const s = document.querySelector(`#${sel}`);
      s.value = v;
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return s.value;
    },
    [id, value],
  );
  await closeSettings(cdp);
}

const reqs = (from, path) => serverLog().slice(from).filter((e) => e.path && (path ? e.path === path || e.path.endsWith(path) : true));
const consoleBad = (cdp) => cdp.console.filter((c) => c.level === "error" || c.level === "exception" || /Content Security Policy|CSP/i.test(c.text));

function shot(cdp, name) {
  return cdp.shot(join(P.shots, `${name}.png`));
}

function saveConsole(id, cdp) {
  const all = results();
  all.console = all.console ?? {};
  all.console[id] = cdp.console;
  writeFileSync(P.results, JSON.stringify(all, null, 2), "utf8");
}

const handoffFile = join(DATA_DIR, "update-handoff.json");

// ---- 시나리오 -----------------------------------------------------------------------------

const SETUP_PATH = `/${TEST.productName}_0.9.1_x64-setup.exe`;

const scenarios = {
  /** 살펴보기 — 띄워서 첫 자동 확인 뒤 상태·콘솔을 찍고 닫는다(판정 없음) */
  async probe() {
    const { cdp, pid } = await launch();
    await clearLastCheck(cdp);
    await sleep(Number(process.env.PROBE_WAIT ?? 18_000));
    const out = {
      pill: await cdp.eval(pillState),
      prefs: await cdp.eval(`localStorage.getItem('frond.update')`),
      support: await cdp.eval(`window.__TAURI_INTERNALS__.invoke('get_update_support')`),
      console: cdp.console,
    };
    console.log(JSON.stringify(out, null, 2));
    await closeApp(cdp, pid);
  },

  /** S1 0.9.0 설치·실행 → 10초 뒤 latest.json 1회 → 설치기 1회 → 알약 */
  async S1() {
    const mark = serverLog().length;
    const t0 = Date.now();
    const { cdp, pid } = await launch();
    const pill = await cdp.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden ? p : null; })()`, 60_000, "알약");
    const latest = reqs(mark, "/latest.json");
    const setup = reqs(mark, SETUP_PATH);
    const firstAt = latest[0] ? Date.parse(latest[0].at) - t0 : null;
    await shot(cdp, "s1-pill");
    const pass = latest.length === 1 && setup.length === 1 && pill.text === "업데이트" && pill.title.includes("0.9.1이 준비됐습니다");
    record("S1", { pass, note: `latest.json ${latest.length}회(시작 뒤 ${Math.round(firstAt / 1000)}초), 설치기 ${setup.length}회, 알약 '${pill.text}' ${pill.level} · ${pill.title}`, headers: latest[0]?.headers, setupHeaders: setup[0]?.headers });
    saveConsole("S1", cdp);
    return { cdp, pid };
  },

  /** S2 나중에 → 흐림, 이번 실행 동안 팝업 없음 (S1 뒤 같은 앱) */
  async S2(ctx) {
    const { cdp } = ctx;
    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await cdp.waitFor(`(${dialogState})?.title.includes('업데이트할까요')`, 5000, "확인 팝업");
    const d = await cdp.eval(dialogState);
    await shot(cdp, "s2-confirm");
    await clickDialog(cdp, "나중에");
    await sleep(5000);
    const pill = await cdp.eval(pillState);
    const open = await cdp.eval(dialogState);
    const focus = await cdp.eval(`document.activeElement?.id || document.activeElement?.tagName`);
    await shot(cdp, "s2-later");
    record("S2", { pass: pill.level === "dim" && !pill.hidden && open === null, note: `팝업 '${d.title}' 버튼 ${d.buttons.join("·")} → 나중에 → 알약 ${pill.level}, 5초 뒤 팝업 ${open ? "있음" : "없음"}, 포커스 ${focus}`, dialog: d });
    return ctx;
  },

  /** S3 건너뛰기 → 재실행: 알약·설치기 요청 없음, 지금 확인은 0.9.1, 0.9.2면 다시 알림 */
  async S3(ctx) {
    let { cdp, pid } = ctx;
    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await clickDialog(cdp, "이 버전 건너뛰기");
    await sleep(500);
    const afterSkip = await cdp.eval(pillState);
    await closeApp(cdp, pid);

    let mark = serverLog().length;
    ({ cdp, pid } = await launch());
    await clearLastCheck(cdp);
    await sleep(16_000);
    const latest1 = reqs(mark, "/latest.json").length;
    const setup1 = reqs(mark, SETUP_PATH).length;
    const pill1 = await cdp.eval(pillState);
    await openUpdateSettings(cdp);
    const panel1 = await cdp.eval(panelState);
    await shot(cdp, "s3-skipped-panel");
    mark = serverLog().length;
    await clickPanel(cdp, "지금 확인");
    await cdp.waitFor(`(${panelState})?.status.includes('준비됐습니다')`, 30_000, "수동 확인 준비");
    const panel2 = await cdp.eval(panelState);
    const setupManual = reqs(mark, SETUP_PATH).length;
    await closeSettings(cdp);
    await closeApp(cdp, pid);

    use("0.9.2");
    mark = serverLog().length;
    ({ cdp, pid } = await launch());
    await clearLastCheck(cdp);
    const pill3 = await cdp.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden ? p : null; })()`, 40_000, "0.9.2 알약");
    await shot(cdp, "s3-092-pill");
    const setup3 = reqs(mark, `/${TEST.productName}_0.9.2_x64-setup.exe`).length;
    // 0.9.2가 준비된 패널 — 건너뛴 0.9.1은 한 줄로만 보인다('다시 알리기'는 건너뜀 상태에서만)
    await openUpdateSettings(cdp);
    const panel3 = await cdp.eval(panelState);
    await shot(cdp, "s3-092-panel");
    // 뒤 시나리오가 0.9.1을 받도록 건너뛰기 기록만 지운다
    use("0.9.1");
    await cdp.eval(`(() => { const p = JSON.parse(localStorage.getItem('frond.update')); p.skipped = null; localStorage.setItem('frond.update', JSON.stringify(p)); return true; })()`);
    const skippedNow = await cdp.eval(`JSON.parse(localStorage.getItem('frond.update')).skipped`);
    const hasUnskip = panel1.buttons.includes("다시 알리기");
    await closeSettings(cdp);
    saveConsole("S3", cdp);
    await closeApp(cdp, pid);

    const pass =
      afterSkip.hidden &&
      latest1 === 1 &&
      setup1 === 0 &&
      pill1.hidden &&
      panel1.status === "0.9.1은 건너뛰기로 했습니다." &&
      panel2.status.startsWith("Frond 0.9.1이 준비됐습니다") &&
      setupManual === 1 &&
      pill3.title.includes("0.9.2") &&
      setup3 === 1 &&
      hasUnskip &&
      skippedNow === null;
    record("S3", {
      pass,
      note: `건너뛰기 뒤 알약 ${afterSkip.hidden ? "숨음" : "보임"} · 재실행 latest ${latest1}회·설치기 ${setup1}회·알약 ${pill1.hidden ? "없음" : "있음"}·패널 '${panel1.status}' · 지금 확인 → '${panel2.status}'(설치기 ${setupManual}회) · 0.9.2 → 알약 '${pill3.title}'(설치기 ${setup3}회) · 건너뜀 패널 버튼 ${panel1.buttons.join('·')} · 0.9.2 패널 '${panel3.status}' / '${panel3.skippedLine}'`,
    });
  },

  /** S9 서버 끔 — 자동은 조용, 수동은 실패 문구 */
  async S9() {
    serve("stop");
    await sleep(500);
    const { cdp, pid } = await launch();
    await clearLastCheck(cdp);
    await sleep(16_000);
    const pill = await cdp.eval(pillState);
    const dlg = await cdp.eval(dialogState);
    const warn = cdp.console.filter((c) => c.text.includes("[update]"));
    await openUpdateSettings(cdp);
    await clickPanel(cdp, "지금 확인");
    const panel = await cdp.waitFor(`(() => { const p = ${panelState}; return p && p.status.includes('확인하지 못했습니다') ? p : null; })()`, 40_000, "실패 문구");
    await shot(cdp, "s9-offline-manual");
    await closeSettings(cdp);
    saveConsole("S9", cdp);
    await closeApp(cdp, pid);
    serve("start");
    await sleep(800);
    record("S9", {
      pass: pill.hidden && dlg === null && panel.status === "업데이트를 확인하지 못했습니다. 인터넷 연결을 확인해 주세요.",
      note: `자동: 알약 ${pill.hidden ? "없음" : "있음"}·팝업 ${dlg ? "있음" : "없음"}·콘솔 '${warn.map((w) => w.text).join(" | ")}' · 수동: '${panel.status}' / '${panel.detail}'`,
    });
  },

  /** S10 설정 끔 → 요청 0 / 설정 키 지움 → 요청 1(기본 켬). 뒤 S11용으로 '빈 창으로 시작'을 켜 둔다 */
  async S10() {
    let { cdp, pid } = await launch();
    await setSelect(cdp, "setting-updateCheck", "off");
    const stored = await cdp.eval(`JSON.parse(localStorage.getItem('frond.settings') ?? '{}').updateCheck`);
    await closeApp(cdp, pid);

    let mark = serverLog().length;
    ({ cdp, pid } = await launch());
    await clearLastCheck(cdp);
    await sleep(16_000);
    const offReqs = reqs(mark).length;
    // 설정 키만 지운다 — 기본값(auto)으로 돌아와야 한다(Zed 회귀)
    await cdp.eval(`(() => { const s = JSON.parse(localStorage.getItem('frond.settings') ?? '{}'); delete s.updateCheck; localStorage.setItem('frond.settings', JSON.stringify(s)); return true; })()`);
    await closeApp(cdp, pid);

    mark = serverLog().length;
    ({ cdp, pid } = await launch());
    await clearLastCheck(cdp);
    await sleep(16_000);
    const defReqs = reqs(mark, "/latest.json").length;
    const value = await cdp.eval(`document.querySelector('#setting-updateCheck')?.value ?? null`);
    await setSelect(cdp, "setting-restoreSession", "none");
    const restore = await cdp.eval(`JSON.parse(localStorage.getItem('frond.settings') ?? '{}').restoreSession`);
    saveConsole("S10", cdp);
    await closeApp(cdp, pid);
    record("S10", { pass: stored === "off" && offReqs === 0 && defReqs === 1, note: `끔(저장 ${stored}) → 요청 ${offReqs}개 · 키 지움 → latest.json ${defReqs}회(선택 ${value}) · S11 준비 restoreSession=${restore}` });
  },

  /** S8 설치기 1바이트 바꿈(.sig 그대로) → 알약 없음, 수동은 서명 문구 */
  async S8() {
    use("tampered");
    const mark = serverLog().length;
    const { cdp, pid } = await launch();
    await clearLastCheck(cdp);
    await sleep(18_000);
    const pill = await cdp.eval(pillState);
    const got = reqs(mark, "/tampered-setup.exe").length;
    const warn = cdp.console.filter((c) => c.text.includes("[update]")).map((c) => c.text);
    await openUpdateSettings(cdp);
    await clickPanel(cdp, "지금 확인");
    const panel = await cdp.waitFor(`(() => { const p = ${panelState}; return p && p.detail ? p : null; })()`, 40_000, "수동 오류");
    await shot(cdp, "s8-signature");
    const alive = pidAlive(pid);
    await closeSettings(cdp);
    saveConsole("S8", cdp);
    await closeApp(cdp, pid);
    use("0.9.1");
    record("S8", {
      pass: pill.hidden && got >= 1 && alive && panel.status === "받은 업데이트 파일의 서명이 맞지 않아 설치하지 않았습니다.",
      note: `위조 설치기 요청 ${got}회 · 알약 ${pill.hidden ? "없음" : "있음"} · 자동 콘솔 '${warn.join(" | ")}' · 수동 '${panel.status}' / 원문 '${panel.detail}' · 앱 ${alive ? "살아 있음" : "죽음"}`,
    });
  },

  /** S13 Scoop 흉내·개발(target) 경로 — 요청 0, 알약 없음, 패널 사유 */
  async S13() {
    const out = [];
    for (const [kind, dir, text] of [
      ["scoop", join(WORK, "scoop", "apps", "frond", "current"), "Scoop으로 설치했습니다"],
      ["dev", join(WORK, "target", "release"), "개발 빌드라"],
    ]) {
      mkdirSync(dir, { recursive: true });
      const exe = join(dir, `${TEST.binary}.exe`);
      copyFileSync(EXE, exe);
      const mark = serverLog().length;
      const { cdp, pid } = await launch({ exe });
      await clearLastCheck(cdp);
      await sleep(15_000);
      const support = await cdp.eval(`window.__TAURI_INTERNALS__.invoke('get_update_support')`);
      const pill = await cdp.eval(pillState);
      await openUpdateSettings(cdp);
      const panel = await cdp.eval(panelState);
      await shot(cdp, `s13-${kind}`);
      await closeSettings(cdp);
      saveConsole(`S13-${kind}`, cdp);
      await closeApp(cdp, pid);
      out.push({ kind, support, requests: reqs(mark).length, pillHidden: pill.hidden, status: panel.status, rowHidden: panel.settingRowHidden, ok: support === kind && reqs(mark).length === 0 && pill.hidden && panel.status.includes(text) && panel.settingRowHidden === true });
      rmSync(exe, { force: true });
    }
    record("S13", { pass: out.every((o) => o.ok), note: out.map((o) => `${o.kind}: 판정 ${o.support}·요청 ${o.requests}·알약 ${o.pillHidden ? "없음" : "있음"}·행 숨김 ${o.rowHidden}·'${o.status}'`).join(" / "), detail: out });
  },

  /** S7 저장 안 한 문서 팝업 '취소' → 아무 일 없음 / S6 저장 충돌 → 업데이트 멈춤 */
  async S7S6() {
    const mark = serverLog().length;
    const { cdp, pid } = await launch();
    await clearLastCheck(cdp);
    await cdp.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden; })()`, 60_000, "알약");
    const s7 = join(P.docs, "s7.md");
    await openFile(cdp, s7);
    await setMode(cdp, "source");
    await edit(cdp, "S7 편집\n");
    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await clickDialog(cdp, "재시작해 업데이트");
    await cdp.waitFor(`(${dialogState})?.title === '저장하지 않은 문서'`, 10_000, "저장 안 한 문서 팝업");
    const unsaved = await cdp.eval(dialogState);
    await shot(cdp, "s7-unsaved");
    await clickDialog(cdp, "취소");
    await sleep(1500);
    const pill7 = await cdp.eval(pillState);
    const s7ok = pidAlive(pid) && !pill7.hidden && !existsSync(handoffFile) && (await cdp.eval(dialogState)) === null;
    record("S7", { pass: s7ok && !unsaved.buttons.includes("저장 안 함"), note: `팝업 '${unsaved.message}' 버튼 ${unsaved.buttons.join("·")} → 취소 → 앱 ${pidAlive(pid) ? "살아 있음" : "죽음"}·알약 ${pill7.hidden ? "없음" : pill7.level}·인계 파일 ${existsSync(handoffFile) ? "있음" : "없음"}` });

    // S6 — 밖에서 파일을 바꿔 etag 충돌
    const s6 = join(P.docs, "s6.md");
    await openFile(cdp, s6);
    await setMode(cdp, "source");
    await edit(cdp, "S6 편집\n");
    writeFileSync(s6, readFileSync(s6, "utf8") + "밖에서 바꾼 줄\n", "utf8");
    await sleep(1500);
    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await clickDialog(cdp, "재시작해 업데이트");
    await clickDialog(cdp, "모두 저장하고 업데이트");
    await cdp.waitFor(`(${dialogState})?.title === '파일이 다른 곳에서 바뀌었습니다'`, 10_000, "충돌 팝업");
    await shot(cdp, "s6-conflict");
    await clickDialog(cdp, "취소");
    await cdp.waitFor(`(${dialogState})?.title === '업데이트를 멈췄습니다'`, 10_000, "멈춤 알림");
    const stopped = await cdp.eval(dialogState);
    await shot(cdp, "s6-stopped");
    await clickDialog(cdp, stopped.buttons[0]);
    await sleep(1000);
    const version = await cdp.eval(`window.__TAURI_INTERNALS__.invoke('plugin:app|version')`);
    const s6ok = pidAlive(pid) && !existsSync(handoffFile) && version === "0.9.0";
    record("S6", { pass: s6ok, note: `충돌 → 취소 → '${stopped.title}: ${stopped.message}' · 앱 ${pidAlive(pid) ? "살아 있음" : "죽음"} ${version} · 인계 파일 ${existsSync(handoffFile) ? "있음" : "없음"} · 설치기 요청 ${reqs(mark, SETUP_PATH).length}` });
    saveConsole("S7S6", cdp);
    await closeApp(cdp, pid);
  },

  /** 묶음 A = S4(초안으로 두고 업데이트) + S11('빈 창으로 시작'에서 업데이트) + S12(파일 인수로 띄운 앱) */
  async A() {
    const [a, b, c] = ["a.md", "b.md", "c.md"].map((f) => join(P.docs, f));
    const { cdp, pid } = await launch({ args: [c] });
    await clearLastCheck(cdp);
    const restoreSetting = await cdp.eval(`JSON.parse(localStorage.getItem('frond.settings') ?? '{}').restoreSession`);
    await cdp.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden; })()`, 60_000, "알약");
    await openFile(cdp, a);
    await openFile(cdp, b);
    await setMode(cdp, "source");
    await edit(cdp, "B 초안 편집\n");
    // a: 분할 + 중간 줄, 활성
    await clickAt(cdp, `document.querySelectorAll('.tab')[1]`);
    await cdp.waitFor(`document.querySelector('#status-path')?.title === ${JSON.stringify(a)}`, 5000, "a 활성");
    await setMode(cdp, "split");
    await edit(cdp, "A 초안 편집\n");
    await cdp.eval(`(() => { const v = ${VIEW}; v.scrollDOM.scrollTop = v.lineBlockAt(v.state.doc.line(80).from).top; return true; })()`);
    await sleep(1500);
    const aText = await cdp.eval(editorText);
    const before = await cdp.eval(tabsState);
    await shot(cdp, "a-before");

    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await clickDialog(cdp, "재시작해 업데이트");
    await cdp.waitFor(`(${dialogState})?.title === '저장하지 않은 문서'`, 10_000, "저장 안 한 문서 팝업");
    const unsaved = await cdp.eval(dialogState);
    // exit(0) 직전 localStorage 기록이 남는지(계획 §12-1) — 표식을 넣고 바로 누른다
    await cdp.eval(`localStorage.setItem('frond.e2e.marker', String(Date.now())), true`);
    const tempBefore = new Set(readdirSync(process.env.TEMP));
    const t0 = Date.now();
    await clickDialog(cdp, "초안으로 두고 업데이트");
    // 인계 파일·설치기 임시 파일·종료를 지켜본다
    let handoffCopy = null;
    let zone = null;
    let installerSeen = null;
    while (pidAlive(pid) && Date.now() - t0 < 60_000) {
      if (!handoffCopy && existsSync(handoffFile)) handoffCopy = readFileSync(handoffFile, "utf8");
      if (!zone) zone = findDownloadedInstaller(tempBefore);
      await sleep(50);
    }
    const exitedAfter = Date.now() - t0;
    cdp.close();
    // NSIS 진행 창(설치기 프로세스) → 새 앱
    const deadline = Date.now() + 120_000;
    let newPid = null;
    while (Date.now() < deadline) {
      if (!zone) zone = findDownloadedInstaller(tempBefore);
      if (!installerSeen) installerSeen = installerProcess();
      const pids = appPids().filter((p) => p !== pid);
      if (pids.length) {
        newPid = pids[0];
        break;
      }
      await sleep(300);
    }
    if (!newPid) throw new Error("새 앱이 뜨지 않았습니다");
    const restartedAfter = Date.now() - t0;
    const version = exeVersion();
    let cdp2;
    try {
      cdp2 = await Cdp.connect(TEST.cdpPort, 30_000);
    } catch (e) {
      record("S4", { pass: false, note: `재실행 뒤 CDP 없음(환경 변수 안 넘어감?): ${e.message}` });
      throw e;
    }
    await cdp2.waitFor(`document.readyState === 'complete' && !!window.__TAURI_INTERNALS__`, 30_000);
    const pillUpd = await cdp2.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden && p.text === '업데이트됨' ? p : null; })()`, 20_000, "업데이트됨");
    const draftDlg = await cdp2.waitFor(`(() => { const d = ${dialogState}; return d && d.title === '저장하지 않은 초안이 있습니다' ? d : null; })()`, 15_000, "초안 복구 팝업");
    await sleep(1200); // 새 앱 세션 저장(500 ms 디바운스) 뒤
    const after = await cdp2.eval(tabsState);
    const restoredMode = await cdp2.eval(`document.querySelector('#editor .cm-content')?.cmTile ? (document.querySelector('#viewer')?.offsetParent ? 'split' : 'source') : 'view'`);
    await shot(cdp2, "a-after-draft-offer");
    // 복구하면 소스 모드로 바뀐다(offerDraft 기존 동작) — 모드·줄은 위에서 읽었다
    await clickDialog(cdp2, "복구");
    await sleep(1500);
    const aAfter = await cdp2.eval(editorText);
    const appVersion = await cdp2.eval(`window.__TAURI_INTERNALS__.invoke('plugin:app|version')`);
    const marker = await cdp2.eval(`localStorage.getItem('frond.e2e.marker')`);
    const handoffGone = !existsSync(handoffFile);
    await shot(cdp2, "a-after");
    // 업데이트됨 → 노트 팝업
    await cdp2.eval(`document.querySelector('#update-pill').click(), true`);
    const notesDlg = await cdp2.waitFor(`(() => { const d = ${dialogState}; return d && d.title.includes('업데이트했습니다') ? d : null; })()`, 5000, "노트 팝업").catch(() => null);
    if (notesDlg) {
      await shot(cdp2, "a-updated-notes");
      await clickDialog(cdp2, "닫기");
    }

    const sb = before.session;
    const sa = after.session;
    const tabsSame = sa && sb && JSON.stringify(sa.tabs.map((t) => t.path)) === JSON.stringify(sb.tabs.map((t) => t.path));
    const activeSame = sa && sb && sa.active === sb.active;
    const aTabB = sb?.tabs.find((t) => t.path === a);
    const aTabA = sa?.tabs.find((t) => t.path === a);
    const modeLine = aTabA && aTabB && aTabA.mode === "split" && aTabB.mode === "split" && Math.abs(aTabA.line - aTabB.line) <= 2;
    const draftOk = aAfter === aText;
    const noDup = sa && new Set(sa.tabs.map((t) => t.path.toLowerCase())).size === sa.tabs.length;
    record("S4", {
      pass: !!(tabsSame && activeSame && modeLine && draftOk && pillUpd && handoffGone && appVersion === "0.9.1" && unsaved.message.includes("문서 2개")),
      note: `팝업 '${unsaved.message}' → 초안 → ${Math.round(exitedAfter / 100) / 10}초 뒤 종료, 설치기 ${installerSeen ?? "못 봄"}, ${Math.round(restartedAfter / 100) / 10}초 뒤 새 PID ${newPid}(옛 ${pid}) · exe ${version}·getVersion ${appVersion} · 탭 ${sa?.tabs.map((t) => `${basename(t.path)}:${t.mode}:${t.line}`).join(",")} 활성 ${sa?.active} (전 ${sb?.tabs.map((t) => `${basename(t.path)}:${t.mode}:${t.line}`).join(",")} 활성 ${sb?.active}) · 화면 모드 ${restoredMode} · 초안 팝업 '${draftDlg.title}' → 복구 글 ${draftOk ? "같음" : "다름"} · 알약 '${pillUpd.text}' · 인계 파일 ${handoffGone ? "지워짐" : "남음"} · localStorage 표식 ${marker ? "남음" : "없음"}`,
      handoff: handoffCopy ? JSON.parse(handoffCopy) : null,
      notesDialog: notesDlg,
    });
    record("S12", { pass: !!(noDup && activeSame && sa.tabs.length === 3), note: `인수 c.md로 띄운 앱 → 업데이트 뒤 탭 ${sa?.tabs.length}개(중복 ${noDup ? "없음" : "있음"}), 활성 ${basename(sa?.tabs[sa.active]?.path ?? "")} (전 ${basename(sb?.tabs[sb.active]?.path ?? "")})` });
    record("S16", { note: zone ? `받은 설치기 ${zone.file} — Zone.Identifier ${zone.zone === null ? "없음" : JSON.stringify(zone.zone)}` : "받은 설치기 임시 파일을 보지 못함(빨리 지워짐) — 확인 못 함", zone });
    record("S12-4-marker", { note: `exit(0) 직전 localStorage 표식: ${marker ? "남음" : "없음"}` });
    saveConsole("A-before", cdp);
    saveConsole("A-after", cdp2);

    // S11 뒷부분 — 일반 재실행은 빈 창
    await closeApp(cdp2, newPid);
    const { cdp: cdp3, pid: pid3 } = await launch();
    await sleep(2500);
    const empty = await cdp3.eval(tabsState);
    const tabCount = await cdp3.eval(`document.querySelectorAll('.tab').length`);
    await shot(cdp3, "a-s11-empty");
    saveConsole("A-s11", cdp3);
    await closeApp(cdp3, pid3);
    record("S11", { pass: restoreSetting === "none" && !!tabsSame && tabCount === 0, note: `'빈 창으로 시작'(${restoreSetting})에서 업데이트 뒤 탭 ${sa?.tabs.length}개 복원 · 다음 일반 재실행 탭 ${tabCount}개` });
  },

  /** 묶음 B = S5 모두 저장하고 업데이트 — 바이트(BOM·줄바꿈) 보존, 재시작 뒤 dirty 없음 */
  async B() {
    const crlf = join(P.docs, "s5-bom-crlf.md");
    const lf = join(P.docs, "s5-lf.md");
    const { cdp, pid } = await launch();
    await clearLastCheck(cdp);
    await cdp.waitFor(`(() => { const p = ${pillState}; return p && !p.hidden; })()`, 60_000, "알약");
    await openFile(cdp, crlf);
    await setMode(cdp, "source");
    await edit(cdp, "S5 저장 줄\n");
    await openFile(cdp, lf);
    await setMode(cdp, "source");
    await edit(cdp, "S5 저장 줄\n");
    await cdp.eval(`document.querySelector('#update-pill').click(), true`);
    await clickDialog(cdp, "재시작해 업데이트");
    await clickDialog(cdp, "모두 저장하고 업데이트");
    const t0 = Date.now();
    await waitUntil(() => !pidAlive(pid), 60_000, "옛 앱 종료");
    cdp.close();
    const newPid = await waitUntil(() => appPids().filter((p) => p !== pid)[0], 120_000, "새 앱");
    const cdp2 = await Cdp.connect(TEST.cdpPort, 30_000);
    await cdp2.waitFor(`document.readyState === 'complete' && !!window.__TAURI_INTERNALS__`, 30_000);
    await sleep(3000);
    const after = await cdp2.eval(tabsState);
    const version = await cdp2.eval(`window.__TAURI_INTERNALS__.invoke('plugin:app|version')`);
    const dlg = await cdp2.eval(dialogState);
    await shot(cdp2, "b-after");
    const bytes1 = readFileSync(crlf);
    const bytes2 = readFileSync(lf);
    const t1 = bytes1.toString("utf8");
    const t2 = bytes2.toString("utf8");
    const bomOk = bytes1[0] === 0xef && bytes1[1] === 0xbb && bytes1[2] === 0xbf && bytes2[0] !== 0xef;
    const crlfOk = !/[^\r]\n/.test(t1) && t1.includes("S5 저장 줄\r\n");
    const lfOk = !t2.includes("\r") && t2.includes("S5 저장 줄\n");
    const noDirty = after.dirty.every((d) => !d) && dlg === null;
    saveConsole("B-before", cdp);
    saveConsole("B-after", cdp2);
    await closeApp(cdp2, newPid);
    record("S5", {
      pass: bomOk && crlfOk && lfOk && noDirty && version === "0.9.1",
      note: `모두 저장 → ${Math.round((Date.now() - t0) / 1000)}초 안에 ${version} · BOM ${bomOk ? "보존" : "깨짐"} · CRLF ${crlfOk ? "보존" : "깨짐"} · LF ${lfOk ? "보존" : "깨짐"} · 재시작 뒤 탭 ${after.session?.tabs.length}개 dirty ${noDirty ? "없음" : "있음"}`,
    });
  },
};

/** 업데이터가 받은 설치기 임시 파일 — %TEMP%\<제품>-<버전>-updater-XXXX\<제품>-<버전>-installer.exe (업데이트 뒤에도 남는다) */
function findDownloadedInstaller(before) {
  const tmp = process.env.TEMP;
  for (const name of readdirSync(tmp)) {
    if (before.has(name)) continue;
    const full = join(tmp, name);
    let files = [];
    try {
      files = statSync(full).isDirectory() ? readdirSync(full).map((f) => join(full, f)) : [full];
    } catch {
      continue;
    }
    for (const f of files) {
      if (!/(setup|installer)\.exe$/i.test(f)) continue;
      let zone = null;
      try {
        zone = readFileSync(`${f}:Zone.Identifier`, "utf8").trim();
      } catch {
        zone = null;
      }
      return { file: f, zone };
    }
  }
  return null;
}

function installerProcess() {
  const out = ps(`(Get-CimInstance Win32_Process -Filter "Name LIKE '%setup%'" | Where-Object { $_.CommandLine -like '*${TEST.productName}*' } | ForEach-Object { $_.CommandLine }) -join ' || '`);
  return out || null;
}

// ---- 정리 --------------------------------------------------------------------------------

/** 시험 문서 초안만 지운다(실제 %APPDATA%\Frond\drafts의 다른 초안은 건드리지 않는다) */
function removeTestDrafts() {
  const drafts = join(process.env.APPDATA, "Frond", "drafts");
  const removed = [];
  if (!existsSync(drafts)) return removed;
  for (const f of readdirSync(drafts)) {
    try {
      const d = JSON.parse(readFileSync(join(drafts, f), "utf8"));
      if (typeof d.path === "string" && d.path.toLowerCase().startsWith(WORK.toLowerCase())) {
        rmSync(join(drafts, f));
        removed.push(f);
      }
    } catch {
      /* 다른 파일 */
    }
  }
  return removed;
}

/** 업데이터가 %TEMP%에 남긴 시험 설치기 폴더 */
function removeUpdaterTemp() {
  const tmp = process.env.TEMP;
  const gone = readdirSync(tmp).filter((n) => n.startsWith(`${TEST.productName}-`) && n.includes("-updater-"));
  for (const n of gone) rmSync(join(tmp, n), { recursive: true, force: true });
  return gone;
}

async function cleanup() {
  for (const pid of appPids()) ps(`Stop-Process -Id ${pid} -ErrorAction SilentlyContinue; 'ok'`);
  serve("stop");
  const uninst = join(INSTALL_DIR, "uninstall.exe");
  if (existsSync(uninst)) {
    const pid = wmiStart(`"${uninst}" /S`);
    await waitUntil(() => !pidAlive(pid), 120_000, "제거기 끝");
    // NSIS 제거기는 임시 사본(Au_.exe)으로 다시 떠서 끝난다
    await sleep(4000);
  }
  const removed = removeTestDrafts();
  const temps = removeUpdaterTemp();
  // 제거기는 '앱 데이터 삭제'를 고르지 않으면 HKCU\Software\<게시자>\<제품>(설치 경로·설치기 언어)을 남긴다 — 시험 제품 키만 지운다
  ps(`Remove-Item -LiteralPath 'HKCU:\\Software\\cyKim\\${TEST.productName}' -Recurse -ErrorAction SilentlyContinue; 'ok'`);
  for (const d of [INSTALL_DIR, DATA_DIR, TARGET, P.keys, join(WORK, "scoop"), join(WORK, "target")]) rmSync(d, { recursive: true, force: true });
  for (const f of readdirSync(WORK)) if (/^conf-.*\.json$|^empty-hooks\.nsh$/.test(f)) rmSync(join(WORK, f));
  const left = ps(
    `[ordered]@{ uninstallKey = (Test-Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${TEST.productName}'); manuKey = (Test-Path 'HKCU:\\Software\\cyKim\\${TEST.productName}'); startMenu = (Test-Path (Join-Path $env:APPDATA 'Microsoft\\Windows\\Start Menu\\Programs\\${TEST.productName}.lnk')); desktop = (Test-Path (Join-Path ([Environment]::GetFolderPath('Desktop')) '${TEST.productName}.lnk')); installDir = (Test-Path ${psq(INSTALL_DIR)}); dataDir = (Test-Path ${psq(DATA_DIR)}) } | ConvertTo-Json`,
  );
  console.log("시험 문서 초안 지움", removed.length, "업데이터 임시 폴더 지움", temps, "남은 것", left);
  return { removedDrafts: removed.length, updaterTemp: temps, left: JSON.parse(left) };
}

// ---- 진입 --------------------------------------------------------------------------------

const [cmd, ...rest] = argv;
const commands = {
  build: () => build(),
  snapshot: async () => void (await snapshot(rest[0] ?? "now")),
  compare: () => {
    const r = compare(rest[0], rest[1]);
    record("S14", { pass: r.pass, note: r.pass ? `실제 설치본 무변경 (시험 문서 초안 ${r.testDrafts}건은 cleanup이 지움)` : JSON.stringify(r.diffs), detail: r });
  },
  serve: () => serve(rest[0]),
  /** 다시 돌릴 때 — 시험 앱 웹뷰 데이터(설정·세션·확인 기록)를 지워 처음 상태로 */
  reset: () => {
    if (appPids().length) throw new Error("시험 앱이 떠 있습니다");
    rmSync(DATA_DIR, { recursive: true, force: true });
    console.log(`지움 ${DATA_DIR} · 시험 문서 초안 ${removeTestDrafts().length}개 · 업데이터 임시 폴더 ${removeUpdaterTemp().length}개`);
  },
  use: () => use(rest[0]),
  install: () => install(rest[0]),
  cleanup: async () => record("cleanup", { note: JSON.stringify(await cleanup()) }),
  run: async () => {
    let ctx = null;
    for (const id of rest) {
      const fn = scenarios[id];
      if (!fn) throw new Error(`시나리오 없음: ${id}`);
      console.log(`== ${id}`);
      try {
        ctx = (await fn(ctx)) ?? null;
      } catch (e) {
        record(id, { pass: false, note: `오류: ${e.message}` });
        for (const pid of appPids()) ps(`Stop-Process -Id ${pid} -ErrorAction SilentlyContinue; 'ok'`);
        throw e;
      }
    }
    if (ctx?.cdp) await closeApp(ctx.cdp, ctx.pid);
  },
};
if (!commands[cmd]) {
  console.error(`명령: ${Object.keys(commands).join(" | ")}`);
  process.exit(2);
}
await commands[cmd]();
