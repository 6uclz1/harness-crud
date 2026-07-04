import { describe, expect, it } from "vitest";
import type { TaskRepository } from "@/repositories/task-repository";
import { createTaskService, TaskNotFoundError } from "@/services/task-service";
import type { Task } from "@/schemas/task";

/** テスト用インメモリ実装。services は Repository interface にのみ依存するため差し替え可能。 */
function createInMemoryRepo(): TaskRepository {
  const store = new Map<string, Task>();
  let seq = 0;
  return {
    async findAll() {
      return [...store.values()].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    },
    async findById(id) {
      return store.get(id);
    },
    async insert(input) {
      seq += 1;
      const now = new Date(Date.now() + seq);
      const task: Task = {
        id: crypto.randomUUID(),
        title: input.title,
        status: "open",
        createdAt: now,
        updatedAt: now,
      };
      store.set(task.id, task);
      return task;
    },
    async update(id, patch) {
      const existing = store.get(id);
      if (!existing) return undefined;
      const updated: Task = { ...existing, ...patch, updatedAt: new Date() };
      store.set(id, updated);
      return updated;
    },
    async delete(id) {
      return store.delete(id);
    },
  };
}

describe("taskService", () => {
  it("creates and lists tasks (newest first)", async () => {
    const service = createTaskService(createInMemoryRepo());
    await service.createTask({ title: "first" });
    await service.createTask({ title: "second" });

    const tasks = await service.listTasks();
    expect(tasks.map((t) => t.title)).toEqual(["second", "first"]);
    expect(tasks[0]?.status).toBe("open");
  });

  it("toggles status open -> done -> open", async () => {
    const service = createTaskService(createInMemoryRepo());
    const task = await service.createTask({ title: "toggle me" });

    const done = await service.toggleTask(task.id);
    expect(done.status).toBe("done");

    const reopened = await service.toggleTask(task.id);
    expect(reopened.status).toBe("open");
  });

  it("updates title", async () => {
    const service = createTaskService(createInMemoryRepo());
    const task = await service.createTask({ title: "before" });

    const updated = await service.updateTask({ id: task.id, title: "after" });
    expect(updated.title).toBe("after");
  });

  it("deletes a task", async () => {
    const service = createTaskService(createInMemoryRepo());
    const task = await service.createTask({ title: "temp" });

    await service.deleteTask(task.id);
    await expect(service.getTask(task.id)).rejects.toBeInstanceOf(
      TaskNotFoundError,
    );
  });

  it("throws TaskNotFoundError for unknown ids", async () => {
    const service = createTaskService(createInMemoryRepo());
    await expect(
      service.updateTask({ id: crypto.randomUUID(), title: "x" }),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
    await expect(
      service.deleteTask(crypto.randomUUID()),
    ).rejects.toBeInstanceOf(TaskNotFoundError);
  });
});
