// テスト観点レポート: Vitest の JSON reporter 出力を人間が読む Markdown に変換する。
// 「テストが何を検証しているか(describe / it の題名)」を CI の job summary と
// PR コメントに出し、人間がテスト観点を run ごとに把握できるようにする(ci.yml 参照)。
// これは可視化でありゲートではない。入力 JSON が無い・壊れている場合も exit 0 で
// 警告 Markdown を出す(テスト自体の成否は test:*:report ステップ側で判定される)。
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

// 外部データ(vitest が書いた JSON)は境界で zod parse してから使う
const assertionSchema = z.object({
  ancestorTitles: z.array(z.string()),
  title: z.string(),
  status: z.string(),
});

const fileResultSchema = z.object({
  name: z.string(),
  assertionResults: z.array(assertionSchema),
});

const reportSchema = z.object({
  numTotalTests: z.number(),
  numPassedTests: z.number(),
  numFailedTests: z.number(),
  testResults: z.array(fileResultSchema),
});

type Report = z.infer<typeof reportSchema>;
type FileResult = z.infer<typeof fileResultSchema>;

const STATUS_ICON: Record<string, string> = {
  passed: "✅",
  failed: "❌",
};

function iconFor(status: string): string {
  return STATUS_ICON[status] ?? "⏭️";
}

function indent(depth: number): string {
  return "  ".repeat(depth);
}

/** 直前に出力済みの describe 階層と比較し、新しく現れた階層だけを行にする */
function renderNewAncestors(printed: string[], ancestors: string[]): string[] {
  let divergence = ancestors.length;
  for (let i = 0; i < ancestors.length; i += 1) {
    if (printed[i] !== ancestors[i]) {
      divergence = i;
      break;
    }
  }
  return ancestors
    .slice(divergence)
    .map((title, offset) => `${indent(divergence + offset + 1)}- ${title}`);
}

function renderFileSection(file: FileResult): string[] {
  const relativeName = path.relative(process.cwd(), file.name);
  const lines: string[] = [`- **${relativeName}**`];
  let printed: string[] = [];
  for (const assertion of file.assertionResults) {
    const ancestors = assertion.ancestorTitles.filter((t) => t.length > 0);
    lines.push(...renderNewAncestors(printed, ancestors));
    printed = ancestors;
    lines.push(
      `${indent(ancestors.length + 1)}- ${iconFor(assertion.status)} ${assertion.title}`,
    );
  }
  return lines;
}

function renderReport(report: Report, label: string): string {
  const summaryIcon = report.numFailedTests === 0 ? "✅" : "❌";
  const files = [...report.testResults].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  return [
    `## テスト観点一覧 (${label})`,
    "",
    `${summaryIcon} ${report.numPassedTests} passed / ${report.numFailedTests} failed / ${report.numTotalTests} total`,
    "",
    ...files.flatMap(renderFileSection),
    "",
  ].join("\n");
}

function renderWarning(label: string, reason: string): string {
  return [
    `## テスト観点一覧 (${label})`,
    "",
    `⚠️ ${reason}`,
    "テストステップ本体のログを確認すること。",
    "",
  ].join("\n");
}

function renderMarkdown(jsonPath: string, label: string): string {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch {
    return renderWarning(
      label,
      `レポートファイル \`${jsonPath}\` を読めない(vitest が JSON を出力する前に異常終了した可能性)。`,
    );
  }
  const report = reportSchema.safeParse(parsedJson);
  if (!report.success) {
    return renderWarning(
      label,
      `レポートファイル \`${jsonPath}\` が想定した vitest JSON reporter の形式ではない。`,
    );
  }
  return renderReport(report.data, label);
}

function main(): void {
  const [jsonPath, label] = process.argv.slice(2);
  if (!jsonPath || !label) {
    console.error(
      "usage: tsx scripts/render-test-report.ts <vitest-json> <label>",
    );
    process.exitCode = 1;
    return;
  }
  process.stdout.write(renderMarkdown(jsonPath, label));
}

main();
