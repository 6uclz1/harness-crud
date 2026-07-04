import { z } from "zod";

/**
 * Task: このアプリの唯一のドメイン概念。
 * 語彙の定義は docs/ONTOLOGY.md、変更手順もそちらを参照。
 */
export const taskStatusSchema = z.enum(["open", "done"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: taskStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Task = z.infer<typeof taskSchema>;

/** 境界(フォーム/API)からの入力は必ずこのスキーマで parse する */
export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1, "タイトルは必須です").max(200),
});
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "タイトルは必須です").max(200).optional(),
  status: taskStatusSchema.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
