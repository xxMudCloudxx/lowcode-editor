import type { ExpressionBinding, ExpressionContext } from "./types";

export function createEmptyContext(): ExpressionContext {
  return {
    $global: {},
    $page: {},
    $data: {},
    $props: {},
    $system: {},
  };
}

export function isExpression(value: unknown): value is ExpressionBinding {
  if (!value || typeof value !== "object") {
    return false;
  }

  const binding = value as Partial<ExpressionBinding>;
  return binding.type === "JSExpression" && typeof binding.value === "string";
}
