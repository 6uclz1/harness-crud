# ARCHITECTURE.md

滅多に変わらない構造だけを書く(実装詳細は書かない)。

## 層と依存方向(一方向のみ)

```
src/app          UI・Server Actions(境界: zodでparseしてからservicesを呼ぶ)
   ↓
src/services     ビジネスルール。Repository interface にのみ依存
   ↓
src/repositories DBアクセスの唯一の場所(interface + Drizzle実装)
   ↓
src/db           Drizzleスキーマ(DB構造の唯一の真実)とクライアント
   ↓
src/config       検証済み環境変数(process.env に触れる唯一の場所)

src/schemas      語彙層。zodスキーマと型のみ。全層から参照可、どこにも依存しない
```

この方向は文書上の約束ではなく `.dependency-cruiser.cjs` が機械的に強制する。
違反時のエラーメッセージに修正方法が書いてある。

## 各層の責務境界

- **app**: 表示と入力受付のみ。ビジネス判断を書かない。repositories/db を import しない。
- **services**: 「何が正しい操作か」を決める。SQLやDrizzleを知らない。
  Repository は引数注入(`createTaskService(repo)`)。既定実装は `taskService`。
- **repositories**: SQL/Drizzleに触れる唯一の層。ビジネス判断を書かない。
- **schemas**: ドメイン語彙の唯一の定義。詳細は ONTOLOGY.md。

## データフロー(書き込み)

FormData → (app/actions.ts で zod parse) → services → repositories → db

境界で parse する前のデータを下層に流してはならない(ast-grep + golden principle)。
