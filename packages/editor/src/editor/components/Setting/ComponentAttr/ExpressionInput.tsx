import { useMemo } from "react";
import { Alert, Input, Typography } from "antd";
import { evaluate, type ExpressionBinding, type EvalResult } from "@lowcode/expression";
import { useExpressionStore } from "../../../stores/expressionStore";

interface ExpressionInputProps {
  value?: ExpressionBinding;
  onChange?: (value: ExpressionBinding) => void;
  componentProps?: Record<string, unknown>;
}

export function ExpressionInput({
  value,
  onChange,
  componentProps,
}: ExpressionInputProps) {
  const buildContext = useExpressionStore((state) => state.buildContext);
  const globalVariables = useExpressionStore((state) => state.globalVariables);
  const pageVariables = useExpressionStore((state) => state.pageVariables);
  const dataSources = useExpressionStore((state) => state.dataSources);

  const hints = useMemo(() => {
    const sections = [
      pageVariables.length > 0
        ? `$page: ${pageVariables.map((item) => item.name).join(", ")}`
        : "$page: 暂无变量",
      globalVariables.length > 0
        ? `$global: ${globalVariables.map((item) => item.name).join(", ")}`
        : "$global: 暂无变量",
      dataSources.length > 0
        ? `$data: ${dataSources.map((item) => item.name).join(", ")}`
        : "$data: 暂无数据源",
      "$system: timestamp, date, url, pathname, search",
      "$props: 当前组件 props",
    ];

    return sections.join(" | ");
  }, [dataSources, globalVariables, pageVariables]);

  const preview: EvalResult | null = useMemo(() => {
    if (!value?.value?.trim()) {
      return null;
    }

    return evaluate(value.value, buildContext(componentProps));
  }, [buildContext, componentProps, value]);

  const previewMessage = preview
    ? preview.ok
      ? `预览结果：${String(preview.value)}`
      : `表达式错误：${"error" in preview ? preview.error : "未知错误"}`
    : null;

  return (
    <div className="flex flex-col gap-2">
      <Input.TextArea
        value={value?.value ?? ""}
        autoSize={{ minRows: 3, maxRows: 8 }}
        placeholder='$page.count + " 次点击"'
        onChange={(event) =>
          onChange?.({
            type: "JSExpression",
            value: event.target.value,
          })
        }
      />

      <Typography.Text type="secondary" className="text-xs leading-5">
        {hints}
      </Typography.Text>

      {preview && previewMessage && (
        <Alert
          type={preview.ok ? "success" : "error"}
          showIcon
          message={previewMessage}
        />
      )}
    </div>
  );
}
