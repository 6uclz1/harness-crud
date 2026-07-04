import { db } from "@/db/client";
import { tasks } from "@/db/schema";

async function seed(): Promise<void> {
  await db
    .insert(tasks)
    .values([
      { title: "ハーネスの check を一度回してみる" },
      { title: "docs/ONTOLOGY.md を読む", status: "done" },
    ]);
  console.error("seeded 2 tasks");
}

seed().then(() => process.exit(0));
