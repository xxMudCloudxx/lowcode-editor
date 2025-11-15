/**
 * @file /src/editor/components/Setting/ComponentStyle/LayoutSetter/index.tsx
 * @description
 * “样式”设置面板中的“布局”设置器。
 * 这是一个容器组件，聚合了所有与布局相关的设置器，
 * 包括 `LayoutModal` (display, flexbox), `BoxModelEditor` (margin, padding),
 * 和 `SizeEditor` (width, height)。
 * @module Components/Setting/ComponentStyle/LayoutSetter
 */
import type { CSSProperties } from "react";
import type { Component } from "../../../../interface";
import BoxModelEditor from "./BoxModelEditor";
import SizeEditor from "./SizeEditor";
import { Form } from "antd";
import FormItem from "antd/es/form/FormItem";
import StyleOptionGroup from "../../../common/StyleOptionGroup";
import { useStyleChangeHandler } from "../../../../hooks/useStyleChangeHandler";
import { layoutSettings } from "./config";

interface LayoutProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const LayoutSetter = (props: LayoutProps) => {
  const { curComponent, onChange } = props;
  const createChangeHandler = useStyleChangeHandler(onChange);
  const value = curComponent.styles || {};
  const displayValue = value.display;

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      labelAlign="right"
      style={{ width: "100%" }}
    >
      <StyleOptionGroup
        label="布局模式"
        options={layoutSettings.display}
        currentValue={displayValue}
        onChange={createChangeHandler("display")}
      />

      {/* 条件渲染 Flex 布局的专属设置 */}
      {displayValue === "flex" && (
        <div className="pl-9 border-l-2 border-gray-100 ml-3">
          <StyleOptionGroup
            label="主轴方向"
            options={layoutSettings.flexDirection}
            currentValue={value.flexDirection}
            onChange={createChangeHandler("flexDirection")}
          />
          <StyleOptionGroup
            label="主轴对齐"
            options={layoutSettings.justifyContent}
            currentValue={value.justifyContent}
            onChange={createChangeHandler("justifyContent")}
          />
          <StyleOptionGroup
            label="辅轴对齐"
            options={layoutSettings.alignItems}
            currentValue={value.alignItems}
            onChange={createChangeHandler("alignItems")}
          />
          <StyleOptionGroup
            label={"换\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0行"} // 使用 Unicode 空格确保对齐
            options={layoutSettings.flexWrap}
            currentValue={value.flexWrap}
            onChange={createChangeHandler("flexWrap")}
          />
        </div>
      )}
      <FormItem label="边距">
        <BoxModelEditor value={curComponent.styles} onChange={onChange} />
      </FormItem>
      <FormItem label="大小">
        <SizeEditor
          value={curComponent.styles}
          onChange={onChange}
          curComponentId={curComponent.id}
        />
      </FormItem>
    </Form>
  );
};

export default LayoutSetter;
