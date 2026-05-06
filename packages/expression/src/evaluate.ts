import type { EvalResult, ExpressionContext } from "./types";

const BLOCKED_GLOBALS = [
  "window",
  "document",
  "globalThis",
  "global",
  "self",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "navigator",
  "location",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "postMessage",
  "Worker",
  "SharedWorker",
  "importScripts",
  "process",
  "require",
  "module",
  "exports",
  "Function",
] as const;

const ROOT_SCOPE_EXPRESSIONS = new Set([
  "$global",
  "$page",
  "$data",
  "$props",
  "$system",
]);

type BlockedGlobal = (typeof BLOCKED_GLOBALS)[number];

type ExpressionFn = (
  $global: ExpressionContext["$global"],
  $page: ExpressionContext["$page"],
  $data: ExpressionContext["$data"],
  $props: ExpressionContext["$props"],
  $system: ExpressionContext["$system"],
  ...blocked: Array<undefined>
) => unknown;

function createExpressionFunction(expr: string): ExpressionFn {
  const args = [
    "$global",
    "$page",
    "$data",
    "$props",
    "$system",
    ...BLOCKED_GLOBALS,
    `"use strict"; return (${expr});`,
  ];

  return new Function(...args) as ExpressionFn;
}

export function evaluate(
  expr: string,
  context: ExpressionContext,
): EvalResult {
  const normalizedExpr = expr.trim();

  if (ROOT_SCOPE_EXPRESSIONS.has(normalizedExpr)) {
    return {
      ok: false,
      error: `Cannot bind ${normalizedExpr} directly. Access a concrete field instead, for example ${normalizedExpr}.value`,
    };
  }

  try {
    const fn = createExpressionFunction(expr);
    const value = fn(
      context.$global,
      context.$page,
      context.$data,
      context.$props,
      context.$system,
      ...BLOCKED_GLOBALS.map(() => undefined),
    );

    return { ok: true, value };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export type { BlockedGlobal };
