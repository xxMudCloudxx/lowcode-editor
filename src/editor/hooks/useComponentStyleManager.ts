// src/editor/hooks/useComponentStyleManager.ts

import { useState, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { debounce } from "lodash-es";
import {
  useComponetsStore,
  getComponentById,
  type Component,
} from "../stores/components";
import {
  convertStyleObjectToCssString,
  parseCssStringToObject,
} from "../utils/styles";

/**
 * 负责管理组件样式状态和更新逻辑的 Hook
 */
export function useComponentStyleManager(form: any) {
  const { components, curComponentId, updateComponentStyles } =
    useComponetsStore();

  // 在 UI 层按需派生当前选中组件，避免在 store 中冗余存储快照
  const curComponent = useMemo<Component | null>(
    () =>
      curComponentId != null
        ? getComponentById(curComponentId, components)
        : null,
    [curComponentId, components]
  );

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
  }, [curComponent?.id, curComponent?.styles, form]);

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

