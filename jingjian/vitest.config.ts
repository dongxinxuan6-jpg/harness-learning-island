import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@jingjian/domain": fileURLToPath(new URL("./packages/domain/src/index.ts", import.meta.url))
    }
  },
  test: {
    include: ["**/src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    passWithNoTests: false,
    setupFiles: ["./apps/web/src/test/setup.ts"],
    coverage: { reporter: ["text", "json", "html"] }
  }
});
