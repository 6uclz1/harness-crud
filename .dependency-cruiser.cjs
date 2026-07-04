/**
 * アーキテクチャの腐敗検出ハーネス。
 * 依存方向は一方向のみ: app → services → repositories → db → config
 * (schemas は全層から参照可能な語彙層。docs/ONTOLOGY.md 参照)
 * 違反メッセージには「どう直すか」を書く。エージェントはこれを読んで自己修正する。
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "循環依存を検出。共有したい型/関数は src/schemas か下位層へ抽出して一方向にすること。",
      from: {},
      to: { circular: true },
    },
    {
      name: "app-must-not-touch-data-layers",
      severity: "error",
      comment:
        "UI層(src/app)から repositories/db を直接importしてはならない。src/services 経由で呼ぶこと。",
      from: { path: "^src/app" },
      to: { path: "^src/(repositories|db)" },
    },
    {
      name: "services-must-not-touch-db",
      severity: "error",
      comment:
        "services から db を直接importしてはならない。DBアクセスは src/repositories に実装し、そこを呼ぶこと。",
      from: { path: "^src/services" },
      to: { path: "^src/db" },
    },
    {
      name: "lower-layers-must-not-import-upper",
      severity: "error",
      comment:
        "下位層(db/repositories/services/config/schemas)から上位層をimportしてはならない。逆向きの参照が必要なら設計を見直し、依存性注入(services のRepository interface参照)を使うこと。",
      from: { path: "^src/(schemas|config|db|repositories)" },
      to: { path: "^src/(app|services)" },
    },
    {
      name: "repositories-upward-ban",
      severity: "error",
      comment:
        "repositories から services/app をimportしてはならない。ビジネスルールは services に置くこと。",
      from: { path: "^src/repositories" },
      to: { path: "^src/(services|app)" },
    },
    {
      name: "schemas-must-stay-pure",
      severity: "error",
      comment:
        "schemas は語彙層。zod と型のみで構成し、他のsrc内モジュールに依存してはならない。",
      from: { path: "^src/schemas" },
      to: { path: "^src/", pathNot: "^src/schemas" },
    },
    {
      name: "config-must-stay-pure",
      severity: "error",
      comment: "config は最下層。他のsrc内モジュールに依存してはならない。",
      from: { path: "^src/config" },
      to: { path: "^src/", pathNot: "^src/config" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
