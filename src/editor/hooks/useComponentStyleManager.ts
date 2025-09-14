// src/editor/hooks/useComponentStyleManager.ts
import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { debounce } from "lodash-es";
import { useComponetsStore } from "../stores/components";
import {
  convertStyleObjectToCssString,
  parseCssStringToObject,
} from "../utils/styles";

/**
 * 负责管理组件样式状态和更新逻辑的 Hook
 */
export function useComponentStyleManager(form: any) {
  const { curComponent, updateComponentStyles } = useComponetsStore();

  // State: 存储 CSS 编辑器中的文本内容
  const [css, setCss] = useState<string>(".comp{\n\n}");

  // Effect: 当选中组件变化时，同步表单和 CSS 编辑器的内容
  useEffect(() => {
    if (curComponent?.styles) {
      form.resetFields();
      form.setFieldsValue(curComponent.styles);
      setCss(convertStyleObjectToCssString(curComponent.styles));
    } else {
      form.resetFields();
      setCss(".comp{\n\n}");
    }
  }, [curComponent?.id, curComponent?.styles, form]); // 使用 curComponent.id 确保组件切换时触发

  // 表单驱动的样式更新
  const handleFormValueChange = (changedValues: CSSProperties) => {
    if (curComponent?.id) {
      updateComponentStyles(curComponent.id, changedValues);
    }
  };

  // CSS 编辑器驱动的样式更新 (带防抖)
  const handleEditorChange = useMemo(
    () =>
      debounce((value: string) => {
        if (!curComponent?.id) return;

        const newStyles = parseCssStringToObject(value);

        // 调用 store action 更新样式, `true` 表示完全替换旧样式
        updateComponentStyles(
          curComponent.id,
          { ...form.getFieldsValue(), ...newStyles },
          true
        );
      }, 500),
    [curComponent?.id, form, updateComponentStyles]
  );

  return {
    css,
    curComponent,
    handleFormValueChange,
    handleEditorChange,
  };
}
