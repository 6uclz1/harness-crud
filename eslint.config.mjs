// 腐敗検出ハーネス: 複雑度・関数サイズをここで機械的に強制する。
// 閾値を緩めるPRはハーネスの後退。緩める前に分割を検討すること。
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "drizzle/**"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { sonarjs },
    rules: {
      // --- 神関数の防止(構造の腐敗検出) ---
      // 循環的複雑度: 分岐の数。超えたら関数を分割せよ。
      complexity: ["error", { max: 10 }],
      // 認知的複雑度: 人間/LLMの読解負荷。超えたらネストを浅くし早期returnせよ。
      "sonarjs/cognitive-complexity": ["error", 15],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 3],
      "max-params": ["error", 4],
      // --- 型の抜け穴防止 ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // テストは検証コードなので行数制限のみ緩和(複雑度は緩和しない)
    files: ["tests/**/*.ts"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
);
