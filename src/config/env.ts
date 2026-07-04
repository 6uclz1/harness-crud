import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default("postgres://app:app@localhost:5432/harness_crud"),
});

/**
 * 環境変数はここでのみ process.env に触れる(ast-grep: no-process-env)。
 * ここを通ることで「未定義の環境変数」がランタイム奥地で爆発するのを防ぐ。
 */
export const env = envSchema.parse(process.env);
