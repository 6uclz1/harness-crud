# GOLDEN_PRINCIPLES.md — 符号化済みの原則

原則は「文書に書く」だけでは守られない。ここにある原則はすべて
**機械的な検査に対応付いている**。対応する検査がない原則は、まだ原則ではなく願望。

| #   | 原則                                                                        | 強制手段                                                        | 完了ゲート                   |
| --- | --------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------- |
| 1   | 依存方向は一方向(app→services→repositories→db→config)                       | .dependency-cruiser.cjs                                         | check:deps                   |
| 2   | 外部データ(FormData/env/JSON)は境界で zod parse。推測した形の上に実装しない | rules/no-unvalidated-request-json.yml, rules/no-process-env.yml | check:ast                    |
| 3   | 型検査を無効化しない(`as any` 禁止)                                         | rules/no-as-any.yml, no-explicit-any                            | check:ast, check:lint        |
| 4   | 神関数を作らない(循環的複雑度≤10, 認知的複雑度≤15, 80行, ネスト≤3)          | eslint.config.mjs                                               | check:lint                   |
| 5   | 使われないコードは残さない(exports/依存/ファイル)                           | knip.json                                                       | check:dead                   |
| 6   | デバッグ出力を残さない                                                      | rules/no-console-log.yml                                        | check:ast                    |
| 7   | ビジネスルールには単体テスト、DBアクセスには統合テスト                      | tests/                                                          | test:unit / test:integration |
| 8   | フォーマットは機械に委ねる(差分ノイズ削減)                                  | prettier                                                        | check:format                 |

## 運用ループ(ハーネスを育てる)

エージェントの失敗・逸脱が起きたら:

1. 「なぜ起きたか」ではなく「**何が機械的に検査されていなかったか**」を特定する
2. ast-grep ルール / eslint ルール / depcruise ルール / テスト のいずれかに符号化する
3. エラーメッセージには**修正方法**を書く(エージェントへの自己修正プロンプトになる)
4. この表に行を追加する

同じ失敗を2回検査なしで通したら、それはモデルの問題ではなくハーネスの欠陥。

## CIガードの運用

- GHA は `check` と同一コマンドを実行する。**ローカルとCIのゲートを乖離させない**
  (新しい検査を足すときは package.json の check と ci.yml の両方に追加)。
- GitHub側で main への直接push禁止 + 「harness / static gates」「integration」
  「next build」を required checks に設定すること(ブランチ保護)。
- 閾値の緩和・ルールの削除・CIステップのスキップは「ハーネスの後退」。
  エージェントには禁止し、人間のレビュー承認を必須とする。
