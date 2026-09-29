import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: { port: 1421, strictPort: true },
  build: { target: "chrome120", minify: false },
});
