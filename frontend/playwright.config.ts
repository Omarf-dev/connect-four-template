import { defineConfig, devices } from "@playwright/test";

// Browser tests run the real frontend and the real backend together.
// Paths are relative to this file, so run them with `npm run test:e2e`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // reuseExistingServer is off: a backend left running from an older version would
  // silently answer these tests. If a port is busy, stop that server and rerun.
  webServer: [
    {
      command: "python -m uvicorn main:app --port 8080",
      cwd: "../backend",
      url: "http://127.0.0.1:8080/health",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
