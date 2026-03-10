import type { ComponentCodeGenMeta } from "./codegen-registry";
import type { IModuleBuilder, IRLiteral, IRPropValue } from "@lowcode/schema";
import { camelCase } from "lodash-es";

/**
 * 助手函数：创建 Literal 节点
 */
function createLiteral(value: any): IRLiteral {
  return { type: "Literal", value };
}

/**
 * Icon 组件的程序式逃生舱逻辑
 * 负责根据 icon 或 type 属性，动态生成 import 语句，并映射最终的标签名
 */
export const iconCustomLogic: ComponentCodeGenMeta = {
  getTagName: (props) => {
    // 兼容 antd 图标新老写法
    const iconName = props.icon || props.type || "QuestionCircleOutlined";
    // 如果是短名称 (如 'smile')，需要转换为大驼峰并加上 'Outlined'
    if (
      !iconName.endsWith("Outlined") &&
      !iconName.endsWith("Filled") &&
      !iconName.endsWith("TwoTone")
    ) {
      return camelCase(iconName) + "Outlined";
    }
    return iconName;
  },
  getTransformedProps: (props) => {
    // 过滤掉 icon 和 type，它们只是用来决定标签名的
    const { icon, type, id, name, parentId, desc, ...rest } = props;

    // 转为 IRPropValue 格式（由于 registry 的私有方法无法直接用，这里简单转换）
    const irProps: Record<string, IRPropValue> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "object" && v !== null && "type" in v) {
        irProps[k] = v;
      } else {
        irProps[k] = createLiteral(v);
      }
    }
    return irProps;
  },
  getLogicFragments: (props, moduleBuilder) => {
    const iconName = props.icon || props.type;
    // 如果没有显示指定，或者指定的是默认图标，由于在 codegen.ts 里已经声明了静态导出，不需要处理
    if (iconName && iconName !== "QuestionCircleOutlined") {
      moduleBuilder.addImport(
        {
          package: "@ant-design/icons",
          version: "^5.0.0",
          destructuring: true,
          exportName: iconName,
        },
        iconName,
      );
    }
  },
};

/**
 * Table 组件的程序式逃生舱逻辑
 * 负责在没有 dataSource 时，根据 columns 自动 mock 一条数据
 */
export const tableCustomLogic: ComponentCodeGenMeta = {
  getTagName: () => "Table",
  getTransformedProps: (props) => {
    const { url, id, name, parentId, desc, ...rest } = props;

    const irProps: Record<string, IRPropValue> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "object" && v !== null && "type" in v) {
        irProps[k] = v;
      } else {
        irProps[k] = createLiteral(v);
      }
    }

    // 处理 mock dataSource
    const columnsProp = irProps.columns as IRLiteral | undefined;
    if (columnsProp && columnsProp.type === "Literal" && !irProps.dataSource) {
      const columns = columnsProp.value || [];
      const dataSource: Record<string, any>[] = [
        columns.reduce((acc: Record<string, any>, col: any) => {
          acc[col.dataIndex] = "示例数据";
          return acc;
        }, {}),
      ];
      irProps.dataSource = createLiteral(dataSource);
    }

    return irProps;
  },
};

/**
 * FormItem 组件的程序式逃生舱逻辑
 * 负责将 name 属性从数字转换为字符串
 */
export const formItemCustomLogic: ComponentCodeGenMeta = {
  getTagName: () => "Form.Item",
  getTransformedProps: (props) => {
    const { id, parentId, desc, ...rest } = props;

    // 对 name 进行特殊处理：如果 name 是数字，则转为字符串
    if (typeof rest.name === "number") {
      rest.name = String(rest.name);
    }

    const irProps: Record<string, IRPropValue> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === "object" && v !== null && "type" in v) {
        irProps[k] = v;
      } else {
        irProps[k] = createLiteral(v);
      }
    }

    return irProps;
  },
};
