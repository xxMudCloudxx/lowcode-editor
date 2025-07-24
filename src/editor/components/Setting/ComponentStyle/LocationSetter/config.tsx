import {
  CloseOutlined,
  PicCenterOutlined,
  PicLeftOutlined,
  PicRightOutlined,
} from "@ant-design/icons";

export const LocationOptions = {
  float: [
    {
      value: "none",
      tooltip: "不浮动 none",
      icon: <CloseOutlined />,
    },
    {
      value: "left",
      tooltip: "左浮动 left",
      icon: <PicLeftOutlined />,
    },

    {
      value: "right",
      tooltip: "右浮动 right",
      icon: <PicRightOutlined />,
    },
  ],
  clear: [
    {
      value: "none",
      tooltip: "不清除 none",
      icon: <CloseOutlined />,
    },
    {
      value: "left",
      tooltip: "左清除 left",
      icon: <PicLeftOutlined />,
    },

    {
      value: "right",
      tooltip: "右清楚 right",
      icon: <PicRightOutlined />,
    },
    {
      value: "both",
      tooltip: "两边都清除 both",
      icon: <PicCenterOutlined />,
    },
  ],
};
