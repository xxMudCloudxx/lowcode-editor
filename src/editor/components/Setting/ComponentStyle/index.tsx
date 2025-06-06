/**
 * @file /src/editor/components/Setting/ComponentStyle/index.tsx
 * @description
 * “样式”设置面板。
 * 提供两种方式修改组件样式：
 * 1. 通过表单快速修改通用样式 (基于 `styleSetter` 配置)。
 * 2. 通过内联的 CSS 编辑器进行高级、自由的样式编辑。
 * @module Components/Setting/ComponentStyle
 */

import { Form, Input, InputNumber, Select } from "antd";
import { useComponetsStore } from "../../../stores/components";
import {
  useComponentConfigStore,
  type ComponentSetter,
} from "../../../stores/component-config";
import { useEffect, useState, type CSSProperties } from "react";
import CssEditor from "../CssEditor";
import { debounce } from "lodash-es";
import StyleToObject from "style-to-object"; // 用于将 CSS 字符串解析为 JS 对象

export function ComponentStyle() {
  const [form] = Form.useForm();

  const { curComponentId, curComponent, updateComponentStyles } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // State: 存储 CSS 编辑器中的文本内容
  const [css, setCss] = useState<string>(`.comp{\n\n}`);

  useEffect(() => {
    form.resetFields();

    const data = form.getFieldsValue();
    form.setFieldsValue({
      ...data,
      ...curComponent?.styles,
    });

    setCss(toCSSStr(curComponent?.styles!));
  }, [curComponent]);

  if (!curComponentId || !curComponent) return null;

  function renderFormElememt(setting: ComponentSetter) {
    const { type, options } = setting;

    if (type === "select") {
      return <Select options={options} />;
    } else if (type === "input") {
      return <Input />;
    } else if (type === "inputNumber") {
      return <InputNumber />;
    }
  }

  function valueChange(changeValues: CSSProperties) {
    if (curComponentId) {
      updateComponentStyles(curComponentId, changeValues);
    }
  }

  /**
   * @description 将 style 对象转换为格式化的 CSS 字符串。
   */
  function toCSSStr(css: Record<string, any>) {
    let str = `.comp {\n`;
    for (let key in css) {
      let value = css[key];
      if (!value) {
        continue;
      }
      if (
        ["width", "height"].includes(key) &&
        !value.toString().endsWith("px")
      ) {
        value += "px";
      }

      str += `\t${key}: ${value};\n`;
    }
    str += `}`;
    return str;
  }

  /**
   * @description CSS 编辑器内容变化时的回调，使用防抖优化性能。
   */
  const handleEditorChange = debounce((value) => {
    let css: Record<string, any> = {};

    try {
      // 提取 CSS 规则内容
      const cssStr = value
        .replace(/\/\*.*\*\//, "") // 去掉注释 /** */
        .replace(/(\.?[^{]+{)/, "") // 去掉 .comp {
        .replace("}", ""); // 去掉 }

      StyleToObject(cssStr, (name, value) => {
        css[
          // 将 kebab-case (如 a-b) 转换为 camelCase (如 aB)
          name.replace(/-\w/, (item) => item.toUpperCase().replace("-", ""))
        ] = value;
      });

      console.log(css);

      // 调用 store action 更新样式，`true` 表示完全替换旧样式
      updateComponentStyles(
        curComponentId,
        { ...form.getFieldsValue(), ...css },
        true
      );
    } catch (e) {
      console.error("CSS parsing error:", e);
    }
  }, 500);

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
    >
      {componentConfig[curComponent.name]?.styleSetter?.map((setter) => (
        <Form.Item key={setter.name} name={setter.name} label={setter.label}>
          {renderFormElememt(setter)}
        </Form.Item>
      ))}
      <div className="h-[200px] border-[1px] border-[#ccc]">
        <CssEditor value={css} onChange={handleEditorChange} />
      </div>
    </Form>
  );
}
