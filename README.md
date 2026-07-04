# harness-crud

Vibe coding を続けても破綻させないための**ハーネス**を実証する Next.js CRUD。
機能(タスク管理)はおまけで、検査・検証系が本体。

## セットアップ

```bash
npm install
cp .env.example .env
npm run db:up        # Docker で Postgres 起動
npm run db:push      # スキーマ反映
npm run db:seed      # 初期データ
npm run dev          # http://localhost:3000
```

## ハーネス

```bash
npm run check        # format / lint(複雑度) / ast-grep / 依存方向 / dead code / 型 / 単体テスト
npm run check:full   # 上記 + 実DB統合テスト
```

同一のゲートが CI(GitHub Actions: `.github/workflows/ci.yml`)でも走り、
静的検査 + 単体テスト / 実Postgresでの統合テスト / `next build` の3ジョブでマージを守る。

構成の説明は AGENTS.md(目次)→ docs/ を参照。
LLM に作業させるときは AGENTS.md を読ませ、完了条件を「check が緑」に固定すること。

## GitHub側の推奨設定

- main への直接 push を禁止し、3つのCIジョブを required checks に設定
- ハーネス関連ファイル(rules/, eslint.config.mjs, .dependency-cruiser.cjs,
  .github/workflows/)の変更は人間レビュー必須(CODEOWNERS 推奨)
