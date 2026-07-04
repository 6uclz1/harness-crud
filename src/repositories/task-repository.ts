import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";
import type { Task, TaskStatus } from "@/schemas/task";

/**
 * services が依存するのはこの interface。
 * 実装差し替え(テスト用インメモリ等)を可能にし、services を純粋に保つ。
 */
export interface TaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | undefined>;
  insert(input: { title: string }): Promise<Task>;
  update(
    id: string,
    patch: Partial<{ title: string; status: TaskStatus }>,
  ): Promise<Task | undefined>;
  delete(id: string): Promise<boolean>;
}

export const pgTaskRepository: TaskRepository = {
  async findAll() {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  },

  async findById(id) {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id));
    return rows[0];
  },

  async insert(input) {
    const rows = await db
      .insert(tasks)
      .values({ title: input.title })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("insert returned no rows");
    return row;
  },

  async update(id, patch) {
    const rows = await db
      .update(tasks)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return rows[0];
  },

  async delete(id) {
    const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return rows.length > 0;
  },
};
