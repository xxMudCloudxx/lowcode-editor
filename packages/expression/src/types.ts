export interface ExpressionBinding {
  type: "JSExpression";
  value: string;
}

export interface ExpressionContext {
  $global: Record<string, unknown>;
  $page: Record<string, unknown>;
  $data: Record<string, unknown>;
  $props: Record<string, unknown>;
  $system: Record<string, unknown>;
}

export type EvalResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };
