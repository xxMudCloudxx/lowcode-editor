// src/editor/utils/formUtils.ts

/**
 * @description 归一化 antd 表单控件的 options。支持：
 * - 字符串数组：['A','B'] → [{label:'A', value:'A'}]
 * - 对象数组（原样透传）
 */
export function normalizeOptions(
  options?: any[]
): Array<{ label: any; value: any }> {
  if (!Array.isArray(options)) return [];
  if (!options) return [];
  if (options.length > 0 && typeof options[0] === "string") {
    return (options as string[]).map((v) => ({ label: v, value: v }));
  }
  return options as Array<{ label: any; value: any }>;
}

/**
 * @description 根据 setter.type 返回 antd Form.Item 所需的 valuePropName。
 * - 对于 Switch 这类布尔控件，需要使用 'checked'。
 * - 其他控件默认 'value'。
 */
export function getValuePropNameFor(
  setterType: string
): "value" | "checked" | "fileList" {
  if (setterType === "switch") return "checked";
  return "value";
}
