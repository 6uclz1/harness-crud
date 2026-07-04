import type { TaskRepository } from "@/repositories/task-repository";
import { pgTaskRepository } from "@/repositories/task-repository";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/schemas/task";

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task not found: ${id}`);
    this.name = "TaskNotFoundError";
  }
}

/** Repository を注入して生成。テストではインメモリ実装を渡す。 */
export function createTaskService(repo: TaskRepository) {
  return {
    listTasks(): Promise<Task[]> {
      return repo.findAll();
    },

    async getTask(id: string): Promise<Task> {
      const task = await repo.findById(id);
      if (!task) throw new TaskNotFoundError(id);
      return task;
    },

    createTask(input: CreateTaskInput): Promise<Task> {
      return repo.insert({ title: input.title });
    },

    async updateTask(input: UpdateTaskInput): Promise<Task> {
      const { id, ...patch } = input;
      const updated = await repo.update(id, patch);
      if (!updated) throw new TaskNotFoundError(id);
      return updated;
    },

    async toggleTask(id: string): Promise<Task> {
      const task = await this.getTask(id);
      const next = task.status === "open" ? "done" : "open";
      return this.updateTask({ id, status: next });
    },

    async deleteTask(id: string): Promise<void> {
      const deleted = await repo.delete(id);
      if (!deleted) throw new TaskNotFoundError(id);
    },
  };
}

/** アプリ本体が使う既定インスタンス */
export const taskService = createTaskService(pgTaskRepository);
