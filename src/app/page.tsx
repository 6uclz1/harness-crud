import { taskService } from "@/services/task-service";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await taskService.listTasks();

  return (
    <>
      <h1>Tasks</h1>
      <p className="subtitle">
        ハーネス検証用CRUD — 変更後は <code>npm run check</code> が緑であること
      </p>

      <form action={createTaskAction} className="create-form">
        <input
          type="text"
          name="title"
          placeholder="新しいタスク"
          required
          maxLength={200}
        />
        <button type="submit" className="primary">
          追加
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty">タスクはまだありません。上から追加できます。</p>
      ) : (
        <ul className="tasks">
          {tasks.map((task) => (
            <li key={task.id} className={task.status === "done" ? "done" : ""}>
              <form action={toggleTaskAction} className="inline">
                <input type="hidden" name="id" value={task.id} />
                <button type="submit">
                  {task.status === "done" ? "戻す" : "完了"}
                </button>
              </form>
              <span className="task-title">
                <Link href={`/tasks/${task.id}`}>{task.title}</Link>
              </span>
              <span className="status-badge">{task.status}</span>
              <form action={deleteTaskAction} className="inline">
                <input type="hidden" name="id" value={task.id} />
                <button type="submit">削除</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
