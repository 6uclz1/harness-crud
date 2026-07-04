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

## ハーネス設計

設計の中心にある考え方は1つ:
**「文書に書いた原則は守られない。機械的な検査に符号化された原則だけが守られる」**。
LLM は指示を忘れ、同義語を発明し、複雑な関数を書き、層を飛び越えて import する。
それを「プロンプトで注意する」のではなく、**exit code で拒否する**のがハーネス。

### 制約の一覧(何を機械的に禁止しているか)

| #   | 制約                                                                       | 強制手段                                                                | ゲート                  |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| 1   | 依存方向は一方向のみ(app→services→repositories→db→config、循環禁止)        | dependency-cruiser(`.dependency-cruiser.cjs`)                           | `check:deps`            |
| 2   | 外部データ(FormData/env/JSON)は境界で zod parse してから下層に流す         | ast-grep(`rules/no-unvalidated-request-json.yml`, `no-process-env.yml`) | `check:ast`             |
| 3   | 型検査を無効化しない(`as any` / `any` 禁止)                                | ast-grep(`rules/no-as-any.yml`)+ typescript-eslint                      | `check:ast/lint`        |
| 4   | 神関数を作らない(循環的複雑度≤10、認知的複雑度≤15、80行、ネスト≤3)         | eslint + sonarjs(`eslint.config.mjs`)                                   | `check:lint`            |
| 5   | 使われない exports / 依存 / ファイルを残さない                             | knip(`knip.json`)                                                       | `check:dead`            |
| 6   | デバッグ出力(`console.log`)を残さない                                      | ast-grep(`rules/no-console-log.yml`)                                    | `check:ast`             |
| 7   | ビジネスルールには単体テスト、DBアクセスには実DBの統合テスト               | vitest(`tests/`)                                                        | `test:unit/integration` |
| 8   | フォーマットは機械に委ねる(差分ノイズ削減)                                 | prettier                                                                | `check:format`          |
| 9   | 概念の名前は1つ(同義語 item/todo/entry の発明禁止)、名前→型→置き場所を固定 | `docs/ONTOLOGY.md` + `src/schemas/`(zod が型の唯一の真実)               | `check:types`           |

各検査の設計上のポイント:

- **エラーメッセージが自己修正プロンプト**。ast-grep / depcruise の違反メッセージには
  「何が禁止か」だけでなく「**どう直すか**」を書く。エージェントはエラー出力を読んで
  人間の介入なしに自己修正できる。
- **完了条件はゲートに一元化**。「終わった」の定義は `npm run check` の exit 0 のみ。
  エージェントの自己申告(「テストしました」「動くはずです」)を完了条件にしない。
- **ゲートの回避自体を禁止**。`eslint-disable`、閾値の緩和、ルール削除、CIステップの
  スキップは「ハーネスの後退」としてエージェントに禁止し、人間レビューを必須にする。

### フロー設計(エージェントの作業ループ)

```
                 ┌────────────────────────────────────────────┐
                 │ 1. AGENTS.md を読む(目次。絶対ルール6箇条)  │
                 └──────────────────┬─────────────────────────┘
                                    ↓
                 ┌────────────────────────────────────────────┐
                 │ 2. docs/ を読む(system of record)           │
                 │    ARCHITECTURE: 層と依存方向                │
                 │    ONTOLOGY: 語彙表と命名規約                │
                 │    GOLDEN_PRINCIPLES: 符号化済みの原則       │
                 └──────────────────┬─────────────────────────┘
                                    ↓
             新概念・スキーマ変更・大きめの変更?
                    │ yes                      │ no
                    ↓                          │
   ┌─────────────────────────────────┐        │
   │ 3. docs/PLANS/TEMPLATE.md で     │        │
   │    ExecPlan を書く               │        │
   │    ONTOLOGY.md と src/schemas/  │        │
   │    を先に更新                    │        │
   └────────────────┬────────────────┘        │
                    ↓                          ↓
                 ┌────────────────────────────────────────────┐
                 │ 4. 実装(schemas → db → repositories →       │
                 │    services → app の順。層を飛ばさない)      │
                 └──────────────────┬─────────────────────────┘
                                    ↓
                 ┌────────────────────────────────────────────┐
                 │ 5. npm run check(DBを触ったら check:full)   │◄──┐
                 └──────────────────┬─────────────────────────┘   │
                                    ↓                              │
                          exit 0?  ── no ──► エラーメッセージ内の  ─┘
                                    │        修正指示に従い自己修正
                                    │        (ルールの回避・緩和は禁止)
                                   yes
                                    ↓
                 ┌────────────────────────────────────────────┐
                 │ 6. CI(同一ゲート)+ ブランチ保護              │
                 │    static gates / integration / build を    │
                 │    required checks にしてマージを守る        │
                 └────────────────────────────────────────────┘
```

フローを支える設計判断:

- **AGENTS.md は目次、docs/ が本体**。コンテキストに毎回入るファイルは薄く保ち、
  詳細は必要になったときに参照させる(百科事典化させない)。
- **語彙が先、実装が後**。新しい概念は ONTOLOGY.md の語彙表 → `src/schemas/` の
  zod スキーマ → DB → repositories → services → app の順で導入する。
  型は `z.infer` で導出し手書きしない。実装から書き始めることを禁止する。
- **ローカルとCIのゲートを乖離させない**。CI は `npm run check` と同一コマンドを
  実行する。新しい検査を足すときは `package.json` と `ci.yml` の両方に追加する。
- **ハーネスを育てる運用ループ**(docs/GOLDEN_PRINCIPLES.md)。エージェントの
  失敗・逸脱が起きたら「なぜ起きたか」ではなく「**何が機械的に検査されていなかったか**」
  を特定し、ast-grep / eslint / depcruise / テストのいずれかに符号化して原則表に
  行を追加する。同じ失敗を2回検査なしで通したら、それはモデルではなくハーネスの欠陥。

### ファイル対応表

| 役割                       | ファイル                                           |
| -------------------------- | -------------------------------------------------- |
| エージェントの入口(目次)   | `AGENTS.md`                                        |
| 層構造と依存方向の定義     | `docs/ARCHITECTURE.md` + `.dependency-cruiser.cjs` |
| ドメイン語彙の唯一の定義   | `docs/ONTOLOGY.md` + `src/schemas/`                |
| 原則 ↔ 検査の対応表        | `docs/GOLDEN_PRINCIPLES.md`                        |
| 大きめの変更の計画テンプレ | `docs/PLANS/TEMPLATE.md`                           |
| 構文パターン検査           | `rules/*.yml`(ast-grep)+ `sgconfig.yml`            |
| 複雑度・lint ゲート        | `eslint.config.mjs`                                |
| dead code 検出             | `knip.json`                                        |
| 完了ゲートの定義           | `package.json` の `check` / `check:full`           |
| マージ境界での同一ゲート   | `.github/workflows/ci.yml`                         |

## 他プロジェクトへの適用プロンプト

以下をそのまま LLM エージェント(Claude Code 等)に渡すと、任意のリポジトリに
このハーネス設計を移植できる。技術スタック固有の部分はエージェントが読み替える。

```text
このリポジトリに、LLM が書き続けてもコードベースが腐敗しないための
「ハーネス」(機械的な検査・検証系)を導入してください。

設計原則(この順に優先):
1. 文書に書いた原則は守られない。機械的な検査に符号化された原則だけが守られる。
   「〜すべき」というルールを思いついたら、文書に書くのではなく
   linter / AST検査 / 依存検査 / テストのいずれかに符号化すること。
2. 完了条件は単一のゲートコマンド(例: `npm run check`)の exit 0 に一元化する。
   エージェントの自己申告を完了条件にしない。
3. 検査のエラーメッセージには「何が禁止か」だけでなく「どう直すか」を書く。
   エラーメッセージは次のエージェントへの自己修正プロンプトである。
4. ローカルとCIのゲートを乖離させない。CIはローカルと同一コマンドを実行し、
   ブランチ保護の required checks にする。

導入するもの:

A. 完了ゲート
   - `check`: フォーマット検査 / lint(複雑度上限: 循環的複雑度10・認知的複雑度15・
     関数80行・ネスト3) / ASTパターン検査 / 依存方向検査 / dead code検出 /
     型検査 / 単体テスト を直列に実行する単一コマンド。
   - `check:full`: check + 実インフラ(DB等)を使う統合テスト。
   - このスタックの標準ツールで構成する(例: TS なら eslint+sonarjs, ast-grep,
     dependency-cruiser, knip, tsc, vitest。他言語なら等価物を選定)。

B. ASTパターン検査(最低限このルール群。プロジェクトに合わせて追加):
   - 型検査の無効化禁止(TS なら `as any`)
   - デバッグ出力の放置禁止(console.log 等)
   - 環境変数の直接参照禁止(検証済み config モジュール経由を強制)
   - 外部入力(リクエストボディ等)を検証なしで下層に流すこと禁止
     (境界でのスキーマ parse を強制)

C. アーキテクチャ検査
   - 層を定義し(例: UI → services → repositories → db → config、
     横断の schemas/語彙層はどこにも依存しない)、依存方向を一方向に限定。
   - 循環依存・層飛ばし・逆方向 import を機械的に error にする。

D. ドキュメント構造(薄い目次 + system of record)
   - AGENTS.md: 目次と絶対ルールのみ。絶対ルールには最低限
     「完了条件はゲートの exit 0」「検査の回避・緩和・削除の禁止
     (ルールが誤りと思うなら変更せず人間に提案)」「新概念はまず
     ONTOLOGY と スキーマを更新してから実装」「CIステップの削除・
     スキップ禁止」を含める。
   - docs/ARCHITECTURE.md: 滅多に変わらない層構造と責務境界のみ。
   - docs/ONTOLOGY.md: ドメイン語彙表(用語→型→置き場所)。
     1概念1名前、同義語の発明禁止。命名規約を機械的に守れる形で書く。
   - docs/GOLDEN_PRINCIPLES.md: 原則 ↔ 強制手段 ↔ ゲートの対応表。
     対応する検査がない原則は載せない(それは願望)。
     運用ループも書く: エージェントの失敗が起きたら「何が検査されて
     いなかったか」を特定し、検査に符号化し、この表に行を追加する。
   - docs/PLANS/TEMPLATE.md: 大きめの変更用の計画書テンプレ
     (目的/非目的、ONTOLOGY への影響、変更する層、検証、未解決の判断)。

E. CI
   - ローカルの check と同一のゲートをステップ分解して実行(どのゲートで
     落ちたか一目で分かるように)+ 統合テスト + 本番ビルドの3ジョブ。
   - README に「main 直接 push 禁止 + 3ジョブを required checks に設定 +
     ハーネス関連ファイルの変更は人間レビュー必須(CODEOWNERS)」を明記。

完了条件: `check:full`(または等価コマンド)が exit 0 で通り、
意図的な違反(層飛ばし import、as any、console.log、複雑度超過)を
仕込むとそれぞれ対応するゲートが修正方法つきのエラーで落ちること。
```

## GitHub側の推奨設定

- main への直接 push を禁止し、3つのCIジョブを required checks に設定
- ハーネス関連ファイル(rules/, eslint.config.mjs, .dependency-cruiser.cjs,
  .github/workflows/)の変更は人間レビュー必須(CODEOWNERS 推奨)
