import {
  PicCenterOutlined,
  PicLeftOutlined,
  PicRightOutlined,
} from "@ant-design/icons";

const fontWeightMap = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Normal", // Normal (正常)
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold", // Bold (加粗)
  "800": "Extra Bold",
  "900": "Black",
};

// 程序化地生成 antd Select 组件所需的 options 数组
// 把 “CSS值” 和 “UI显示文本” 清晰地分开
export const fontWeightOptions = Object.entries(fontWeightMap).map(
  ([value, name]) => ({
    value: value, // 这是真正应用到 CSS 的值
    label: `${value} ${name}`, // 这是在下拉菜单里显示的文本
  })
);

const fontFamilyList = ["Helvetica", "Arial", "serif"];
export const fontFamilyOptions = fontFamilyList.map((fontName) => ({
  value: fontName,
  label: fontName,
}));

export const textAlignOptions = {
  align: [
    {
      value: "left",
      tooltip: "左对齐",
      icon: <PicLeftOutlined />,
    },
    {
      value: "center",
      tooltip: "居中对齐",
      icon: <PicCenterOutlined />,
    },
    {
      value: "right",
      tooltip: "右对齐",
      icon: <PicRightOutlined />,
    },
    {
      value: "justify",
      tooltip: "两端对齐",
      icon: <span>| |</span>,
    },
  ],
};
