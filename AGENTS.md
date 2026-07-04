# AGENTS.md — このリポジトリの目次

このファイルは百科事典ではなく**目次**。詳細は docs/ を参照(system of record)。

## このリポジトリは何か

Next.js + Drizzle + Postgres(Docker) のタスク管理CRUD。
目的は機能ではなく**ハーネス**: LLMが書き続けても腐敗しない検査・検証系の実証。

## 作業の絶対ルール

1. 変更を終える条件は **`npm run check` が exit 0** であること。それ以外の完了報告は無効。
2. check が失敗したら、エラーメッセージ内の修正指示に従って自分で直す。
   ルールを回避・無効化(eslint-disable, 閾値緩和, ルール削除)してはならない。
   ルール自体が誤りだと考える場合は、変更せず人間に提案すること。
3. 新しい概念(エンティティ/状態/用語)を導入する前に docs/ONTOLOGY.md を読み、
   追加するならまず ONTOLOGY.md と src/schemas/ を更新してから実装する。
4. 実装前に docs/GOLDEN_PRINCIPLES.md を読む。繰り返し発生した失敗は、
   ドキュメントに書くのではなく rules/(ast-grep) か eslint.config.mjs に符号化する。
5. DBを触る変更をしたら `npm run check:full`(統合テスト込み)まで回す。
   DB起動: `npm run db:up && npm run db:push`
6. 同じゲートが CI(.github/workflows/ci.yml)でも走る。CIのステップを削除・
   スキップ・条件分岐で回避する変更をしてはならない(人間承認必須)。
7. PR を作成するときは PR テンプレート(.github/pull_request_template.md)の
   「結合レベルのテスト観点」を必ず導出して埋める(単体テストでは拾えない、
   層をまたぐ確認事項)。空のまま提出してはならない。

## 地図

- アーキテクチャと層の依存方向 → docs/ARCHITECTURE.md
- ドメイン語彙(用語 → 型 → 置き場所) → docs/ONTOLOGY.md
- 符号化済みの原則と各検査の意図 → docs/GOLDEN_PRINCIPLES.md
- 大きめの変更の計画書テンプレート → docs/PLANS/TEMPLATE.md

## コマンド

| コマンド             | 用途                                 |
| -------------------- | ------------------------------------ |
| `npm run check`      | 全静的検査 + 単体テスト(完了ゲート)  |
| `npm run check:full` | check + 実DB統合テスト               |
| `npm run fix`        | フォーマット・lint の自動修正        |
| `npm run db:reset`   | DBを作り直し + スキーマ反映 + シード |
| `npm run dev`        | 開発サーバ                           |
