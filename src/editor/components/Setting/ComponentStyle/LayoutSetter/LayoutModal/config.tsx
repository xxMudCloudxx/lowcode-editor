import {
  BorderOutlined,
  EyeInvisibleOutlined,
  MenuOutlined,
  BlockOutlined,
  PicCenterOutlined,
  PicLeftOutlined,
  PicRightOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { type SVGProps } from "react";

// 自定义主轴方向的图标
const FlexDirectionRow = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.5 3.5H14.5M1.5 6.5H14.5M1.5 9.5H14.5M1.5 12.5H14.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const FlexDirectionColumn = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: "rotate(90deg)" }}
    {...props}
  >
    <path
      d="M1.5 3.5H14.5M1.5 6.5H14.5M1.5 9.5H14.5M1.5 12.5H14.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 将所有配置项统一导出
export const layoutSettings = {
  display: [
    {
      value: "flex",
      tooltip: "弹性布局 (flex)",
      icon: <MenuOutlined />,
    },
    {
      value: "block",
      tooltip: "块级布局 (block)",
      icon: <BorderOutlined />,
    },
    {
      value: "inline-block",
      tooltip: "内联块布局 (inline-block)",
      icon: <BlockOutlined />,
    },
    {
      value: "inline",
      tooltip: "内联布局 (inline)",
      icon: <span className="anticon">ABC</span>,
    },
    {
      value: "none",
      tooltip: "隐藏 (none)",
      icon: <EyeInvisibleOutlined />,
    },
  ],
  flexDirection: [
    { value: "row", tooltip: "水平方向 (row)", icon: <FlexDirectionRow /> },
    {
      value: "row-reverse",
      tooltip: "水平反向 (row-reverse)",
      icon: <FlexDirectionRow style={{ transform: "rotate(180deg)" }} />,
    },
    {
      value: "column",
      tooltip: "垂直方向 (column)",
      icon: <FlexDirectionColumn />,
    },
    {
      value: "column-reverse",
      tooltip: "垂直反向 (column-reverse)",
      icon: <FlexDirectionColumn style={{ transform: "rotate(180deg)" }} />,
    },
  ],
  justifyContent: [
    {
      value: "flex-start",
      tooltip: "起点对齐 (flex-start)",
      icon: <PicLeftOutlined />,
    },
    {
      value: "center",
      tooltip: "居中对齐 (center)",
      icon: <PicCenterOutlined />,
    },
    {
      value: "flex-end",
      tooltip: "终点对齐 (flex-end)",
      icon: <PicRightOutlined />,
    },
    {
      value: "space-between",
      tooltip: "两端对齐 (space-between)",
      icon: <span>| |</span>,
    },
    {
      value: "space-around",
      tooltip: "均匀排列 (space-around)",
      icon: <span>||</span>,
    },
  ],
  alignItems: [
    {
      value: "flex-start",
      tooltip: "起点对齐 (flex-start)",
      icon: <VerticalAlignTopOutlined />,
    },
    {
      value: "center",
      tooltip: "居中对齐 (center)",
      icon: <VerticalAlignMiddleOutlined />,
    },
    {
      value: "flex-end",
      tooltip: "终点对齐 (flex-end)",
      icon: <VerticalAlignBottomOutlined />,
    },
    { value: "stretch", tooltip: "拉伸对齐 (stretch)", icon: <span>↕</span> },
    { value: "baseline", tooltip: "基线对齐 (baseline)", icon: <span>A</span> },
  ],
  flexWrap: [
    { value: "nowrap", tooltip: "不换行 (nowrap)", label: "不换" },
    { value: "wrap", tooltip: "换行 (wrap)", label: "换行" },
    {
      value: "wrap-reverse",
      tooltip: "反向换行 (wrap-reverse)",
      label: "反向",
    },
  ],
};
