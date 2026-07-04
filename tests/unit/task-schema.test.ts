import { describe, expect, it } from "vitest";
import { createTaskInputSchema } from "@/schemas/task";

describe("createTaskInputSchema (境界の検証)", () => {
  it("trims and accepts a valid title", () => {
    const parsed = createTaskInputSchema.parse({ title: "  買い物  " });
    expect(parsed.title).toBe("買い物");
  });

  it("rejects empty titles", () => {
    expect(() => createTaskInputSchema.parse({ title: "   " })).toThrow();
  });

  it("rejects non-string payloads (FormData の null 等)", () => {
    expect(() => createTaskInputSchema.parse({ title: null })).toThrow();
  });
});
