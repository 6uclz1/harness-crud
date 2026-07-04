"use server";

import { revalidatePath } from "next/cache";
import { createTaskInputSchema, updateTaskInputSchema } from "@/schemas/task";
import { taskService } from "@/services/task-service";
import { z } from "zod";

const idSchema = z.string().uuid();

/** 境界ルール: FormData は必ず zod で parse してから使う */
export async function createTaskAction(formData: FormData): Promise<void> {
  const input = createTaskInputSchema.parse({
    title: formData.get("title"),
  });
  await taskService.createTask(input);
  revalidatePath("/");
}

export async function updateTaskAction(formData: FormData): Promise<void> {
  const input = updateTaskInputSchema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
  });
  await taskService.updateTask(input);
  revalidatePath("/");
}

export async function toggleTaskAction(formData: FormData): Promise<void> {
  const id = idSchema.parse(formData.get("id"));
  await taskService.toggleTask(id);
  revalidatePath("/");
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const id = idSchema.parse(formData.get("id"));
  await taskService.deleteTask(id);
  revalidatePath("/");
}
