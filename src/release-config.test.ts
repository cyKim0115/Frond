/**
 * 커밋된 설정 가드 (결정 `20261127-app-update` §7) — 시험용 엔드포인트·http·서명 산출물 설정이 기본 설정에 끼지 않게 막는다.
 * E2E 시험 설정은 스크립트가 임시 덧설정으로만 넘기고 저장소에는 두지 않는다.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const conf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const cargoToml = readFileSync("src-tauri/Cargo.toml", "utf8");
const capability = JSON.parse(readFileSync("src-tauri/capabilities/default.json", "utf8"));

const ENDPOINT = "https://github.com/cyKim0115/Frond/releases/latest/download/latest.json";

/** minisign 공개 키 — tauri signer가 낸 `.pub` 파일 내용(base64). 풀면 `untrusted comment:` 줄 + 키 줄 */
function isMinisignPubkey(value: string): boolean {
  let text: string;
  try {
    text = atob(value.trim());
  } catch {
    return false;
  }
  const lines = text.split(/\r?\n/).filter((l) => l !== "");
  return lines.length === 2 && lines[0].startsWith("untrusted comment:") && /^[A-Za-z0-9+/]{56}={0,2}$/.test(lines[1]);
}

describe("기본 tauri.conf.json — updater", () => {
  const updater = conf.plugins?.updater;

  it("엔드포인트는 https GitHub latest.json 하나뿐", () => {
    expect(updater.endpoints).toEqual([ENDPOINT]);
    expect(updater).not.toHaveProperty("dangerousInsecureTransportProtocol");
    expect(updater).not.toHaveProperty("dangerousAcceptInvalidCerts");
    expect(updater).not.toHaveProperty("dangerousAcceptInvalidHostnames");
  });

  it("Windows 설치는 passive", () => {
    expect(updater.windows).toEqual({ installMode: "passive" });
  });

  it("공개 키는 비었거나(U-5 전) minisign 형식", () => {
    expect(typeof updater.pubkey).toBe("string");
    if (updater.pubkey !== "") expect(isMinisignPubkey(updater.pubkey)).toBe(true);
  });

  it("서명 산출물 설정은 기본 설정에 없다 — 키 없는 app:build가 깨지지 않게(릴리스 덧설정에만)", () => {
    expect(conf.bundle).not.toHaveProperty("createUpdaterArtifacts");
  });

  it("업데이트로 이어져야 할 식별자는 그대로", () => {
    expect(conf.identifier).toBe("com.cykim.mdeditor");
    expect(conf.mainBinaryName).toBe("mdeditor");
    expect(conf.productName).toBe("Frond");
  });

  it("권한은 updater:default만, process 플러그인은 쓰지 않는다", () => {
    expect(capability.permissions).toContain("updater:default");
    expect(capability.permissions.some((p: string) => p.startsWith("process:"))).toBe(false);
  });

  it("CSP connect-src는 IPC만 — HTTP는 Rust가 한다", () => {
    expect(conf.app.security.csp["connect-src"]).toBe("'self' ipc: http://ipc.localhost");
  });
});

describe("버전 일치", () => {
  it("package.json · tauri.conf.json · src-tauri/Cargo.toml", () => {
    const cargoVersion = /^\[package\][\s\S]*?^version = "([^"]+)"/m.exec(cargoToml)?.[1];
    expect(conf.version).toBe(pkg.version);
    expect(cargoVersion).toBe(pkg.version);
  });
});

describe("isMinisignPubkey", () => {
  it("모양을 본다", () => {
    const key = btoa(`untrusted comment: minisign public key: ABCDEF\nRWT${"A".repeat(53)}\n`);
    expect(isMinisignPubkey(key)).toBe(true);
    expect(isMinisignPubkey("")).toBe(false);
    expect(isMinisignPubkey("not base64 !!")).toBe(false);
    expect(isMinisignPubkey(btoa("hello\nworld"))).toBe(false);
  });
});
