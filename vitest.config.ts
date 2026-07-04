import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // CIのjob summary生成に json-summary / json が必要 (ci.yml参照)
      reporter: ["text", "json-summary", "json"],
      // テスト失敗時もレポートを出す。人間が「何が測れていて何が落ちたか」を毎回見るため
      reportOnFailure: true,
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
        },
      },
    ],
  },
});
