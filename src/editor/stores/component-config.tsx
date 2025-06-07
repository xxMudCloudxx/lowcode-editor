/**
 * @file /src/editor/stores/component-config.tsx
 * @description
 * 使用 Zustand 管理所有“物料组件”的配置信息。
 * 这个文件是低代码编辑器的“物料注册中心”，定义了每个组件的：
 * - 基础信息 (name, desc)
 * - 默认属性 (defaultProps)
 * - 在右侧“设置”面板中对应的属性、样式、事件、方法的配置器 (setter, styleSetter, events, methods)
 * - 在“编辑”模式下的渲染组件 (dev)
 * - 在“预览”模式下的渲染组件 (prod)
 * @module Stores/ComponentConfig
 */
import { create } from "zustand";
import ContainerDev from "../materials/Container/dev";
import ContainerProd from "../materials/Container/prod";
import ButtonDev from "../materials/Button/dev";
import ButtonProd from "../materials/Button/prod";
import PageDev from "../materials/Page/dev";
import PageProd from "../materials/Page/prod";
import ModalDev from "../materials/Modal/dev";
import ModalProd from "../materials/Modal/prod";
import TableDev from "../materials/Table/dev";
import TableProd from "../materials/Table/prod";
import TableColumnDev from "../materials/TableColumn/dev";
import TableColumnProd from "../materials/TableColumn/prod";
import FormDev from "../materials/Form/dev";
import FormItemDev from "../materials/FormItem/dev";
import FormItemProd from "../materials/FormItem/prod";

/**
 * @interface ComponentSetter
 * @description 定义了组件在“设置”面板中的一个配置项。
 * 它描述了如何渲染一个表单控件来修改组件的某个 prop。
 */
export interface ComponentSetter {
  name: string; // 对应组件 props 的字段名
  label: string; // 在设置面板中显示的标签
  type: string; // 决定渲染哪种类型的输入控件，如 'input', 'select', 'inputNumber'
  [key: string]: any; // 其他属性，例如 'select' 的 options
}

/**
 * @interface ComponentEvent
 * @description 定义了组件可以对外触发的事件。
 */
export interface ComponentEvent {
  name: string; // 事件名，如 'onClick'
  label: string; // 在设置面板中显示的事件标签，如 '点击事件'
}

/**
 * @interface ComponentMethod
 * @description 定义了组件可以被外部调用的方法。
 */
export interface ComponentMethod {
  name: string; // 方法名，如 'open'
  label: string; // 在设置面板中显示的方法标签，如 '打开弹窗'
}

/**
 * @interface ComponentConfig
 * @description
 * 单个物料组件的完整配置定义。
 * 这是整个物料系统的核心数据结构。
 */
export interface ComponentConfig {
  name: string; // 组件的唯一英文名，用作类型标识
  defaultProps: Record<string, any>; // 组件被拖拽生成时的默认 props
  desc: string; // 组件的中文描述，显示在物料面板
  parentTypes?: string[]; // 组件允许接收的父组件类型列表
  setter?: ComponentSetter[]; // 属性设置器配置
  styleSetter?: ComponentSetter[]; // 样式设置器配置
  events?: ComponentEvent[]; // 事件配置
  methods?: ComponentMethod[]; // 方法配置

  // 关键设计点：区分开发和生产环境的组件渲染
  dev: any; // 组件在编辑器画布中的渲染形态，通常包含拖拽、选中等交互逻辑
  prod: any; // 组件在预览/最终发布时的真实渲染形态，是纯净的业务组件
}

interface State {
  // 使用字典结构，以组件名作为 key，快速查找组件配置
  componentConfig: { [key: string]: ComponentConfig };
}
interface Action {
  // 预留的 action，用于未来动态注册新组件
  registerComponent: (name: string, componentConfig: ComponentConfig) => void;
}
export const useComponentConfigStore = create<State & Action>((set) => ({
  componentConfig: {
    Container: {
      name: "Container",
      desc: "容器",
      defaultProps: {},
      dev: ContainerDev,
      prod: ContainerProd,
      // 容器自身也可以被放置在“页面”或另一个“容器”或“弹窗”中
      parentTypes: ["Page", "Container", "Modal"],
    },
    Button: {
      name: "Button",
      desc: "按钮",
      defaultProps: {
        type: "primary",
        text: "按钮",
      },
      setter: [
        {
          name: "type",
          label: "按钮类型",
          type: "select",
          options: [
            { label: "主按钮", value: "primary" },
            { label: "次按钮", value: "default" },
          ],
        },
        {
          name: "text",
          label: "文本",
          type: "input",
        },
      ],
      styleSetter: [
        {
          name: "width",
          label: "宽度",
          type: "inputNumber",
        },
        {
          name: "height",
          label: "高度",
          type: "inputNumber",
        },
      ],
      events: [
        {
          name: "onClick",
          label: "点击事件",
        },
        {
          name: "onDoubleClick",
          label: "双击事件",
        },
      ],
      dev: ButtonDev,
      prod: ButtonProd,
      // 按钮可以被放置在“页面”、“容器”或“弹窗”中
      parentTypes: ["Page", "Container", "Modal"],
    },
    Page: {
      name: "Page",
      desc: "页面",
      defaultProps: {},
      dev: PageDev,
      prod: PageProd,
      // Page 是根组件，它没有父组件，所以不需要 parentTypes
    },
    Table: {
      name: "Table",
      defaultProps: {},
      desc: "表格",
      setter: [
        {
          name: "url",
          label: "url",
          type: "input",
        },
      ],
      dev: TableDev,
      prod: TableProd,
      // 表格可以被放置在“页面”、“容器”或“弹窗”中
      parentTypes: ["Page", "Container", "Modal"],
    },
    Modal: {
      name: "Modal",
      defaultProps: {
        title: "弹窗",
      },
      setter: [
        {
          name: "title",
          label: "标题",
          type: "input",
        },
      ],
      stylesSetter: [],
      events: [
        {
          name: "onOk",
          label: "确认事件",
        },
        {
          name: "onCancel",
          label: "取消事件",
        },
      ],
      methods: [
        {
          name: "open",
          label: "打开弹窗",
        },
        {
          name: "close",
          label: "关闭弹窗",
        },
      ],
      desc: "弹窗",
      dev: ModalDev,
      prod: ModalProd,
      // 弹窗本身作为一个可拖拽的配置项，可以被放置在“页面”上
      parentTypes: ["Page"],
    },
    TableColumn: {
      name: "TableColumn",
      desc: "表格列",
      defaultProps: {
        dataIndex: `col_${new Date().getTime()}`,
        title: "列名",
      },
      setter: [
        {
          name: "type",
          label: "类型",
          type: "select",
          options: [
            {
              label: "文本",
              value: "text",
            },
            {
              label: "日期",
              value: "date",
            },
          ],
        },
        {
          name: "title",
          label: "标题",
          type: "input",
        },
        {
          name: "dataIndex",
          label: "字段",
          type: "input",
        },
      ],
      dev: TableColumnDev,
      prod: TableColumnProd,
      // 表格列只能被放置在“表格”组件中
      parentTypes: ["Table"],
    },
    Form: {
      name: "Form",
      defaultProps: {},
      desc: "表单",
      setter: [
        {
          name: "title",
          label: "标题",
          type: "input",
        },
      ],
      events: [
        {
          name: "onFinish",
          label: "提交事件",
        },
      ],
      methods: [
        {
          name: "submit",
          label: "提交",
        },
      ],
      dev: FormDev,
      prod: FormDev,
      // 表单可以被放置在“页面”、“容器”或“弹窗”中
      parentTypes: ["Page", "Container", "Modal"],
    },
    FormItem: {
      name: "FormItem",
      desc: "表单项",
      defaultProps: {
        name: new Date().getTime(),
        label: "姓名",
      },
      dev: FormItemDev,
      prod: FormItemProd,
      setter: [
        {
          name: "type",
          label: "类型",
          type: "select",
          options: [
            {
              label: "文本",
              value: "input",
            },
            {
              label: "日期",
              value: "date",
            },
          ],
        },
        {
          name: "label",
          label: "标题",
          type: "input",
        },
        {
          name: "name",
          label: "字段",
          type: "input",
        },
        {
          name: "rules",
          label: "校验",
          type: "select",
          options: [
            {
              label: "必填",
              value: "required",
            },
          ],
        },
      ],
      // 表单项只能被放置在“表单”组件中
      parentTypes: ["Form"],
    },
  },
  registerComponent: (name, componentConfig) =>
    set((state) => {
      return {
        ...state,
        componentConfig: {
          ...state.componentConfig,
          [name]: componentConfig,
        },
      };
    }),
}));
