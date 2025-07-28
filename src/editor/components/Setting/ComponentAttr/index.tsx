/**
 * @file /src/editor/components/Setting/ComponentAttr/index.tsx
 * @description
 * “属性”设置面板。
 * 负责根据选中组件的 `setter` 配置，动态生成一个表单，
 * 用于修改该组件的 props。
 * @module Components/Setting/ComponentAttr
 */

import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Radio,
  Checkbox,
  Segmented,
} from "antd";
import { useComponetsStore } from "../../../stores/components";
import { useEffect, useMemo } from "react";
import {
  useComponentConfigStore,
  type ComponentSetter,
} from "../../../stores/component-config";

type AnyObject = Record<string, any>;

/**
 * @description 归一化 options。支持：
 * - 字符串数组：['A','B'] → [{label:'A', value:'A'}]
 * - 对象数组（原样透传）
 */
function normalizeOptions(options?: any[]): Array<{ label: any; value: any }> {
  if (!options) return [];
  if (options.length > 0 && typeof options[0] === "string") {
    return (options as string[]).map((v) => ({ label: v, value: v }));
  }
  return options as Array<{ label: any; value: any }>;
}

/**
 * @description 根据 setter.type 返回对应的 valuePropName。
 * - 对于 Switch 这类布尔控件，需要使用 'checked'
 * - 其他控件默认 'value'
 */
function getValuePropNameFor(
  setterType: string
): "value" | "checked" | "fileList" {
  if (setterType === "switch") return "checked";
  return "value";
}

export function ComponentAttr() {
  const [form] = Form.useForm<AnyObject>();

  const { curComponentId, curComponent, updateComponentProps } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // 当前组件的 meta（便于空值判断）
  const meta = useMemo(
    () => (curComponent ? componentConfig[curComponent.name] : null),
    [curComponent, componentConfig]
  );

  useEffect(() => {
    // 当没有选中组件时，重置表单为空，避免显示上一个组件的旧数据
    if (!curComponent) {
      form.resetFields();
      return;
    }

    // 当有选中组件时，用它的 props 来填充表单
    // 注意：这里我们应该用 curComponent.props 完全覆盖，而不是合并
    form.setFieldsValue(curComponent.props);

    // 关键：将依赖项改为 curComponentId。
    // ID 是组件唯一的、不可变的的标识。
    // 每次选中不同的组件，ID 必然变化。
    // 从预览退回后，即使 ID 仍然是 null，这个 effect 也会因为 ID 从有到无（或反之）的变化而触发。
  }, [curComponentId, curComponent, form]);

  if (!curComponentId || !curComponent || !meta) return null;

  /**
   * @description 根据 setter 配置动态渲染不同的 antd 表单组件。
   * 允许通过 setter 传入额外属性（placeholder/min/max/step/mode/showSearch/allowClear 等）。
   * 关键：不要把 name/label/type/options 透传给控件。
   */
  function renderFormElememt(setting: ComponentSetter & AnyObject) {
    // ！！！把元数据字段“剥离”，只把控件真正需要的 props 传下去
    const {
      type,
      options,
      name: _omitName,
      label: _omitLabel,
      // 你还可以在这里继续剥离不希望下发的字段：
      // required: _omitRequired,
      // tooltip: _omitTooltip,
      ...controlProps
    } = setting;

    const opts = normalizeOptions(options);
    console.log("[AttrSetter]", {
      curName: curComponent?.name,
      has: !!componentConfig[curComponent?.name ?? ""],
      keys: Object.keys(componentConfig),
    });

    switch (type) {
      case "select":
        return <Select options={opts} {...controlProps} />;

      case "input":
        return <Input {...controlProps} />;

      case "textarea":
        return (
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 8 }}
            {...controlProps}
          />
        );

      case "inputNumber":
      case "number":
        return <InputNumber style={{ width: "100%" }} {...controlProps} />;

      case "radio":
        // Radio.Group 的 options 也支持 string[]，这里做了归一化
        return <Radio.Group options={opts} {...controlProps} />;

      case "checkboxGroup":
        return <Checkbox.Group options={opts} {...controlProps} />;

      case "switch":
        return <Switch {...controlProps} />;

      case "segmented":
        // Segmented 需要 { label, value }，normalizeOptions 已处理
        return <Segmented options={opts as any} {...controlProps} />;

      default:
        // 未识别类型时兜底为 Input，便于容错
        return <Input {...controlProps} allowClear />;
    }
  }

  /**
   * @description 表单值变化时的回调函数。
   * 直接调用 store 的 action 来更新组件的 props，实现了 UI 到状态的单向数据流。
   * 这里将整份表单值写回（更稳），你也可以改为只写回变化的部分。
   */
  function valueChange(_: AnyObject, allValues: AnyObject) {
    if (curComponentId) {
      // 过滤掉值为 undefined 的属性
      const newProps = Object.fromEntries(
        Object.entries(allValues).filter(([_, value]) => value !== undefined)
      );

      // 使用替换模式，用过滤后的新 props 对象完全替换旧的
      updateComponentProps(curComponentId, newProps, true);
    }
  }

  return (
    <Form
      form={form}
      onValuesChange={valueChange}
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 14 }}
      className="overflow-y-auto h-[100%] absolute overscroll-y-contain pt-9 pb-30"
    >
      {/* 固定的只读信息 */}
      <Form.Item label="组件id">
        <Input value={curComponent.id} disabled />
      </Form.Item>
      {/* <Form.Item label="组件名称">
        <Input value={curComponent.name} disabled />
      </Form.Item> */}
      <Form.Item label="组件描述">
        <Input value={curComponent.desc} disabled />
      </Form.Item>

      {/* 根据组件“蓝图”中的 setter 配置，动态生成表单项 */}
      {meta.setter?.map((setter) => {
        const valuePropName = getValuePropNameFor(setter.type);
        return (
          <Form.Item
            key={setter.name}
            name={setter.name}
            label={setter.label}
            valuePropName={valuePropName}
          >
            {renderFormElememt(setter as ComponentSetter & AnyObject)}
          </Form.Item>
        );
      })}
    </Form>
  );
}
