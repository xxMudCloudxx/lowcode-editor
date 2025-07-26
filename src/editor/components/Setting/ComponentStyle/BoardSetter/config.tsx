import { BorderOuterOutlined, FullscreenOutlined } from "@ant-design/icons";
import {
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
} from "@ant-design/icons";

export const BoardOptions = {
  radio: [
    {
      value: "all",
      tooltip: "固定圆角",
      icon: <BorderOuterOutlined />,
    },
    {
      value: "remote",
      tooltip: "分别设置",
      icon: <FullscreenOutlined />,
    },
  ],
};

export const borderRadiusConfigs = [
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
