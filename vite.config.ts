/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1422,
    strictPort: true,
    // cargo가 쓰는 target/ 을 감시하면 EBUSY로 dev 서버가 죽는다 (Phase 0 스파이크에서 확인)
    watch: { ignored: ["**/src-tauri/**", "**/target/**"] },
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
