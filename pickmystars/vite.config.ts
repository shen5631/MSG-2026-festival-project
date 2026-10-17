import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error 서버 전용 JavaScript 핸들러를 로컬 개발 서버에서도 사용합니다.
import { createEmailHandler } from "./api/photo-email.mjs";

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), "") };
  return {
    base: "./",
    plugins: [
      react(),
      {
        name: "local-photo-email",
        configureServer(server) {
          server.middlewares.use(
            "/api/photo-email",
            createEmailHandler({ env }),
          );
        },
      },
    ],
  };
});
