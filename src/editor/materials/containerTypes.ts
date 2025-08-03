/**
 * @file /src/editor/materials/containerTypes.ts
 * @description
 * 集中定义组件容器的类别。
 * 这使得我们可以更高效地管理嵌套规则 ('parentTypes')，
 * 而不是在每个组件的 meta 文件中硬编码数组。
 * @module Materials/ContainerTypes
 */

// C_ stands for Category

// 页面级/主布局容器。这些是顶层或主要的结构块。
export const C_PAGE = ["Page", "Container", "Modal", "GridColumn", "TabPane"];

// 内容区块级容器。例如 Card，它本身可以容纳其他组件。
export const C_BLOCK = [...C_PAGE, "Card", "Tooltip"];

// 列表项级容器。通常用于承载更小、更原子化的内容。
export const C_ITEM = ["ListItem"];

// --- 预设的 parentTypes 组合 ---
// PT_ stands for ParentTypes

// 通用原子组件 (如 Button, Icon, Avatar) 可以被放置在几乎任何地方。
export const PT_GENERAL = [...C_BLOCK, ...C_ITEM];

// 布局型组件 (如 Grid, Container) 通常不适合放在小尺寸的列表项里。
export const PT_LAYOUT = C_BLOCK;

// 数据型组件 (如 Form, Table, List) 适合放在区块容器中。
export const PT_DATA = C_BLOCK;

// 卡片本身可以放在列表项里，形成卡片列表。
export const PT_CARD = [...C_BLOCK, ...C_ITEM];

// 列表本身适合放在区块容器中。
export const PT_LIST = C_BLOCK;

// 页面级组件 (如 PageHeader, Pagination)。通常只应放在顶层容器中。
export const PT_PAGE_LEVEL = ["Page", "Container"];

// 导航类组件 (如 Menu, Dropdown)。它们非常灵活，可以放在几乎任何地方，
// 甚至作为其他组件（如Button）的子元素或弹出层。
export const PT_NAVIGATION = PT_GENERAL;
