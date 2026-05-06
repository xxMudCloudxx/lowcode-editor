const DEP_REGEX =
  /\$(global|page|data|props|system)(?:\.[A-Za-z_$][\w$]*)+/g;

export function extractDeps(expr: string): string[] {
  const matches = expr.match(DEP_REGEX);
  return matches ? [...new Set(matches)] : [];
}
