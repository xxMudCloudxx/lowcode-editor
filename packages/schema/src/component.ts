import type { CSSProperties, PropsWithChildren } from "react";

// 通用的物料组件 props（用于 dev/prod 渲染组件本身）
export interface CommonComponentProps extends PropsWithChildren {
  id: number;
  name: string;
  styles?: CSSProperties;
  isSelected?: boolean;
  // 物料自身透传的其它属性
  [key: string]: any;
}

// 画布上组件节点的标准结构（范式化后的单节点）
// 注意：children 只存子节点的 id 列表，真正的数据存放在 Map 中
export interface Component {
  id: number;
  name: string;
  props: any;
  desc: string;
  // null 或 undefined 表示没有父节点（通常是 Page/root）
  parentId?: number | null;
  // 范式化后的 children：仅存子组件 id
  children?: number[];
  styles?: CSSProperties;
}

// 剪切板/出码使用的树状结构版本
// 仍然使用嵌套 children: ComponentTree[]，方便递归处理
export interface ComponentTree {
  id: number;
  name: string;
  props: any;
  desc: string;
  parentId?: number | null;
  children?: ComponentTree[];
  styles?: CSSProperties;
}
