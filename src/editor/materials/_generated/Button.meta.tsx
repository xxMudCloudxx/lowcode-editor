/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请调整脚本或 TARGETS。
 */
import type { ComponentConfig } from '../../stores/component-config';
import { Button } from 'antd';

const meta = {
  name: "Button",
  desc: "按钮",
  defaultProps: {},
  setter: [
  {
    "name": "type",
    "label": "按钮类型",
    "type": "radio",
    "options": [
      "primary",
      "default",
      "dashed",
      "text",
      "link"
    ]
  },
  {
    "name": "size",
    "label": "尺寸",
    "type": "segmented",
    "options": [
      "small",
      "middle",
      "large"
    ]
  },
  {
    "name": "danger",
    "label": "危险态",
    "type": "switch"
  },
  {
    "name": "ghost",
    "label": "幽灵",
    "type": "switch"
  },
  {
    "name": "block",
    "label": "块级",
    "type": "switch"
  },
  {
    "name": "loading",
    "label": "加载",
    "type": "switch"
  },
  {
    "name": "htmlType",
    "label": "原生类型",
    "type": "select",
    "options": [
      "button",
      "submit",
      "reset"
    ]
  },
  {
    "name": "href",
    "label": "链接",
    "type": "input"
  },
  {
    "name": "target",
    "label": "打开方式",
    "type": "select",
    "options": [
      "_self",
      "_blank",
      "_parent",
      "_top"
    ]
  },
  {
    "name": "children",
    "label": "文本",
    "type": "input"
  }
],
  events: [
  {
    "name": "onClick",
    "label": "点击事件"
  }
],
  parentTypes: ["Page", "Container", "Modal"]
} as Omit<ComponentConfig, "dev" | "prod">;

export default meta;
