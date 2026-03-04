/**
 * @file 物料出码描述符提取层
 * @description
 * 从所有物料的 ComponentProtocol.codegen 字段中提取 ICodeGenDescriptor，
 * 供 code-generator 包消费。
 *
 * 设计说明：
 * - 此文件是 meta.tsx → ICodeGenDescriptor 的"桥梁"
 * - 它导入各物料的 Protocol，提取 codegen 字段并补上 name，形成完整的 ICodeGenDescriptor
 * - 如果未来需要支持第二套物料系统，只需创建另一个类似的提取文件
 *
 * @module Materials/CodeGen
 */

import type { ICodeGenDescriptor, ComponentProtocol } from "@lowcode/schema";

// --- General ---
import ButtonProtocol from "./General/Button/meta";
import TypographyProtocol from "./General/Typography/meta";
import IconProtocol from "./General/Icon/meta";

// --- Layout ---
import ContainerProtocol from "./Layout/Container/meta";
import GridProtocol from "./Layout/Grid/meta";
import GridColumnProtocol from "./Layout/GridColumn/meta";
import SpaceProtocol from "./Layout/Space/meta";

// --- Data Entry ---
import InputProtocol from "./DataEntry/Input/meta";
import InputNumberProtocol from "./DataEntry/InputNumber/meta";
import SelectProtocol from "./DataEntry/Select/meta";
import RadioProtocol from "./DataEntry/Radio/meta";
import SliderProtocol from "./DataEntry/Slider/meta";
import SwitchProtocol from "./DataEntry/Switch/meta";
import UploadProtocol from "./DataEntry/Upload/meta";
import FormProtocol from "./DataEntry/Form/meta";
import FormItemProtocol from "./DataEntry/FormItem/meta";

// --- Data Display ---
import AvatarProtocol from "./DataDisplay/Avatar/meta";
import CardProtocol from "./DataDisplay/Card/meta";
import ImageProtocol from "./DataDisplay/Image/meta";
import ListProtocol from "./DataDisplay/List/meta";
import ListItemProtocol from "./DataDisplay/ListItem/meta";
import TableProtocol from "./DataDisplay/Table/meta";
import TableColumnProtocol from "./DataDisplay/TableColumn/meta";
import TooltipProtocol from "./DataDisplay/Tooltip/meta";

// --- Feedback ---
import ModalProtocol from "./Feedback/Modal/meta";

// --- Navigation ---
import BreadcrumbProtocol from "./Navigation/Breadcrumb/meta";
import DropdownProtocol from "./Navigation/Dropdowm/meta";
import MenuProtocol from "./Navigation/Menu/meta";
import PageHeaderProtocol from "./Navigation/PageHeader/meta";
import PaginationProtocol from "./Navigation/Pagination/meta";
import StepsProtocol from "./Navigation/Steps/meta";
import TabsProtocol from "./Navigation/Tabs/meta";
import TabPaneProtocol from "./Navigation/TabPane/meta";

// --- Page ---
import PageProtocol from "./Page/meta";

/**
 * 从 ComponentProtocol 中提取 ICodeGenDescriptor
 * 自动补上 name 字段
 */
function extractDescriptor(
  protocol: ComponentProtocol,
): ICodeGenDescriptor | null {
  if (!protocol.codegen) return null;
  return {
    name: protocol.name,
    ...protocol.codegen,
  } as ICodeGenDescriptor;
}

const allProtocols: ComponentProtocol[] = [
  // General
  ButtonProtocol,
  TypographyProtocol,
  IconProtocol,
  // Layout
  ContainerProtocol,
  GridProtocol,
  GridColumnProtocol,
  SpaceProtocol,
  // Data Entry
  InputProtocol,
  InputNumberProtocol,
  SelectProtocol,
  RadioProtocol,
  SliderProtocol,
  SwitchProtocol,
  UploadProtocol,
  FormProtocol,
  FormItemProtocol,
  // Data Display
  AvatarProtocol,
  CardProtocol,
  ImageProtocol,
  ListProtocol,
  ListItemProtocol,
  TableProtocol,
  TableColumnProtocol,
  TooltipProtocol,
  // Feedback
  ModalProtocol,
  // Navigation
  BreadcrumbProtocol,
  DropdownProtocol,
  MenuProtocol,
  PageHeaderProtocol,
  PaginationProtocol,
  StepsProtocol,
  TabsProtocol,
  TabPaneProtocol,
  // Page
  PageProtocol,
];

/**
 * antd 物料系统的全部出码描述符
 */
export const antdCodeGenDescriptors: ICodeGenDescriptor[] = allProtocols
  .map(extractDescriptor)
  .filter((d): d is ICodeGenDescriptor => d !== null);
