import Link from "next/link";
import { notFound } from "next/navigation";
import { taskService, TaskNotFoundError } from "@/services/task-service";
import { updateTaskAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TaskEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const task = await taskService.getTask(id).catch((error: unknown) => {
    if (error instanceof TaskNotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <p>
        <Link href="/" className="back">
          ← 一覧に戻る
        </Link>
      </p>
      <h1>タスクを編集</h1>
      <p className="subtitle">作成: {task.createdAt.toLocaleString("ja-JP")}</p>

      <form action={updateTaskAction} className="create-form">
        <input type="hidden" name="id" value={task.id} />
        <input
          type="text"
          name="title"
          defaultValue={task.title}
          required
          maxLength={200}
        />
        <button type="submit" className="primary">
          保存
        </button>
      </form>
    </>
  );
}
