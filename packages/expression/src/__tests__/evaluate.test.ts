import { describe, expect, it } from "vitest";
import { createEmptyContext } from "../context";
import { evaluate } from "../evaluate";

describe("evaluate", () => {
  it("evaluates a basic expression", () => {
    expect(evaluate("1 + 2", createEmptyContext())).toEqual({
      ok: true,
      value: 3,
    });
  });

  it("reads values from the expression context", () => {
    expect(
      evaluate("$page.count * 2", {
        ...createEmptyContext(),
        $page: { count: 5 },
      }),
    ).toEqual({
      ok: true,
      value: 10,
    });
  });

  it("exposes $props separately from other scopes", () => {
    expect(
      evaluate("$props.title + ' / ' + $global.name", {
        ...createEmptyContext(),
        $props: { title: "Dashboard" },
        $global: { name: "Acme" },
      }),
    ).toEqual({
      ok: true,
      value: "Dashboard / Acme",
    });
  });

  it("returns an error result for invalid syntax", () => {
    const result = evaluate("$page.count +", createEmptyContext());
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      ok: false,
    });
  });

  it("shadows common host globals", () => {
    const result = evaluate("typeof window", createEmptyContext());
    expect(result).toEqual({
      ok: true,
      value: "undefined",
    });
  });

  it("rejects binding a root scope object directly", () => {
    const result = evaluate("$global", createEmptyContext());
    expect(result).toEqual({
      ok: false,
      error:
        "Cannot bind $global directly. Access a concrete field instead, for example $global.value",
    });
  });
});
