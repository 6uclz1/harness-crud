# ONTOLOGY.md — ドメイン語彙の唯一の定義

目的: 人間とLLMの認知負荷を抑えるため、**1つの概念に1つの名前**を与え、
名前 → 型 → 置き場所 の対応を固定する。同義語の発明(item, todo, entry 等)は禁止。

## 語彙表

| 用語            | 意味                                  | 型(真実)                     | DB             | UI表記                 |
| --------------- | ------------------------------------- | ---------------------------- | -------------- | ---------------------- |
| Task            | ユーザーが管理する作業1件             | `Task` (src/schemas/task.ts) | tasks テーブル | タスク                 |
| TaskStatus      | Taskの状態。`open` / `done` の2値のみ | `TaskStatus`                 | tasks.status   | open=未完了, done=完了 |
| CreateTaskInput | Task作成時に境界を通過できる入力      | `CreateTaskInput`            | —              | —                      |
| UpdateTaskInput | Task更新時に境界を通過できる入力      | `UpdateTaskInput`            | —              | —                      |

## 命名規約(機械的に守れる形)

- エンティティ: 単数形 PascalCase(`Task`)。テーブル名: 複数形 snake_case(`tasks`)。
- 境界入力スキーマ: `<動詞><Entity>InputSchema`。型は `z.infer` で導出し手書きしない。
- Repository: `<Entity>Repository`(interface) / `pg<Entity>Repository`(実装)。
- Service関数: `動詞 + Entity`(listTasks, createTask...)。get系は見つからなければ throw。

## 新しい概念を追加する手順

1. この表に行を追加(名前の重複・同義語がないか確認)
2. src/schemas/ に zod スキーマを定義
3. 必要なら src/db/schema.ts にテーブル定義 → `npm run db:push`
4. repositories → services → app の順に実装
5. `npm run check:full` を通す

この順番を飛ばして実装から書き始めてはならない。
