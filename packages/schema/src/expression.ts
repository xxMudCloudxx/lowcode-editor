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

export interface DataSourceConfig {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST";
  params?: Record<string, unknown>;
  autoFetch?: boolean;
}

export interface VariableDefinition {
  name: string;
  defaultValue: unknown;
  description?: string;
}

export interface PageBindingConfig {
  variables: VariableDefinition[];
  dataSources: DataSourceConfig[];
}
