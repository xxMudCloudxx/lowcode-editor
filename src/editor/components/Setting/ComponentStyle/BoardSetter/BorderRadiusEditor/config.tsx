import {
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
} from "@ant-design/icons";
import type { CSSProperties, ReactNode } from "react";

// 用于 "统一/单独" 切换按钮的配置
export const BoardOptions = {
  radio: [
    { value: "all", tooltip: "统一设置", label: "统一" },
    { value: "remote", tooltip: "单独设置", label: "单独" },
  ],
};

// 用于循环生成四个角输入框的配置
export const borderRadiusConfigs: {
  key: keyof CSSProperties;
  icon: ReactNode;
}[] = [
  {
    key: "borderTopLeftRadius",
    icon: <RadiusUpleftOutlined />,
  },
  {
    key: "borderTopRightRadius",
    icon: <RadiusUprightOutlined />,
  },
  {
    key: "borderBottomLeftRadius",
    icon: <RadiusBottomleftOutlined />,
  },
  {
    key: "borderBottomRightRadius",
    icon: <RadiusBottomrightOutlined />,
  },
];
