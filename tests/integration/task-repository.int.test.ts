import { beforeEach, describe, expect, it } from "vitest";
import { pgTaskRepository } from "@/repositories/task-repository";
import { db } from "@/db/client";
import { tasks } from "@/db/schema";

/**
 * 実DBに対する統合テスト。
 * 事前に `npm run db:up && npm run db:push` を実行しておくこと。
 */
describe("pgTaskRepository (requires Docker DB)", () => {
  beforeEach(async () => {
    await db.delete(tasks);
  });

  it("performs full CRUD against Postgres", async () => {
    const created = await pgTaskRepository.insert({ title: "integration" });
    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.status).toBe("open");

    const found = await pgTaskRepository.findById(created.id);
    expect(found?.title).toBe("integration");

    const updated = await pgTaskRepository.update(created.id, {
      status: "done",
    });
    expect(updated?.status).toBe("done");

    const all = await pgTaskRepository.findAll();
    expect(all).toHaveLength(1);

    const deleted = await pgTaskRepository.delete(created.id);
    expect(deleted).toBe(true);
    expect(await pgTaskRepository.findAll()).toHaveLength(0);
  });
});
