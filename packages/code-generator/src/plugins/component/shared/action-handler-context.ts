import type { IRNode, IRPropValue } from "@lowcode/schema";
import type { IActionHandlerContext } from "./handlers/actions";

interface RuntimePropsSerializeOptions {
  serializeStateRef: (stateName: string) => string;
}

export function buildActionHandlerContext(
  irNode: IRNode,
  options: RuntimePropsSerializeOptions,
): IActionHandlerContext {
  return {
    componentName: irNode.componentName,
    componentPropsCode: buildRuntimePropsCode(irNode.props, options),
  };
}

function buildRuntimePropsCode(
  props: Record<string, IRPropValue>,
  options: RuntimePropsSerializeOptions,
): string {
  const entries = Object.entries(props)
    .map(([key, value]) => {
      const serialized = serializePropValueForRuntime(value, options);
      return serialized === undefined
        ? null
        : `${JSON.stringify(key)}: ${serialized}`;
    })
    .filter((entry): entry is string => !!entry);

  return `{ ${entries.join(", ")} }`;
}

function serializePropValueForRuntime(
  value: IRPropValue,
  options: RuntimePropsSerializeOptions,
): string | undefined {
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (
      typeof value[0] === "object" &&
      value[0] !== null &&
      "type" in value[0] &&
      value[0].type === "Action"
    ) {
      return undefined;
    }
    return undefined;
  }

  if (typeof value !== "object" || value === null) {
    return JSON.stringify(value);
  }

  if (!("type" in value)) {
    return undefined;
  }

  switch (value.type) {
    case "Literal":
      return JSON.stringify(value.value);
    case "JSExpression":
    case "JSFunction":
      return value.value;
    case "StateRef":
      return options.serializeStateRef(value.stateName);
    case "MethodRef":
      return value.methodName;
    case "Action":
      return undefined;
    default:
      return undefined;
  }
}
