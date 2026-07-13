import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: { baseURL: "http://127.0.0.1:4173" },
  webServer: {
    command: "bunx vite --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/tests/e2e/",
    reuseExistingServer: false,
  },
});
