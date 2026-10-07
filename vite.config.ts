/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1422,
    strictPort: true,
    // cargo가 쓰는 target/ 을 감시하면 EBUSY로 dev 서버가 죽는다 (Phase 0 스파이크에서 확인).
    // samples/raw/ 는 바이트 왕복 시험(roundtrip 예제)이 임시 파일을 만들었다 지워 같은 이유로 죽는다 (2026-10-06).
    watch: { ignored: ["**/src-tauri/**", "**/target/**", "**/samples/raw/**"] },
  },
  build: {
    // WebView2 ≥ 150 고정이라 최신 문법을 그대로 쓴다
    target: "chrome120",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
