import { describe, expect, it } from "vitest";
import { isExpression } from "../context";
import { extractDeps } from "../extract-deps";

describe("extractDeps", () => {
  it("extracts unique dependency paths", () => {
    expect(
      extractDeps("$page.name + $data.list.length + $page.name"),
    ).toEqual(["$page.name", "$data.list.length"]);
  });

  it("ignores plain identifiers", () => {
    expect(extractDeps("count + 1")).toEqual([]);
  });
});

describe("isExpression", () => {
  it("recognizes expression bindings", () => {
    expect(
      isExpression({
        type: "JSExpression",
        value: "$page.count",
      }),
    ).toBe(true);
  });

  it("rejects plain values", () => {
    expect(isExpression("hello")).toBe(false);
  });
});
