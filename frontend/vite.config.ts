/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the backend so the browser never needs CORS.
    // 127.0.0.1 matches uvicorn's default bind; "localhost" can resolve to IPv6 on Windows.
    proxy: {
      "/evaluate_board_state": "http://127.0.0.1:8080",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
