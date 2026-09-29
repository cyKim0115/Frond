import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    // cargo가 쓰는 target/ 을 감시하면 EBUSY로 죽는다 (Tauri 템플릿 기본값)
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: { target: "chrome120", minify: false },
});
