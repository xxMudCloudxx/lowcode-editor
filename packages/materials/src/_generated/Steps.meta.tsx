/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Steps",
  desc: "Steps",
  category: "Navigation",
  defaultProps: {},
  setter: [
  {
    "name": "type",
    "label": "类型",
    "type": "select",
    "options": [
      {
        "label": "default",
        "value": "default"
      },
      {
        "label": "navigation",
        "value": "navigation"
      },
      {
        "label": "inline",
        "value": "inline"
      }
    ]
  },
  {
    "name": "current",
    "label": "current",
    "type": "inputNumber"
  },
  {
    "name": "direction",
    "label": "direction",
    "type": "select",
    "options": [
      {
        "label": "horizontal",
        "value": "horizontal"
      },
      {
        "label": "vertical",
        "value": "vertical"
      }
    ]
  },
  {
    "name": "iconPrefix",
    "label": "iconPrefix",
    "type": "input"
  },
  {
    "name": "initial",
    "label": "initial",
    "type": "inputNumber"
  },
  {
    "name": "labelPlacement",
    "label": "labelPlacement",
    "type": "select",
    "options": [
      {
        "label": "horizontal",
        "value": "horizontal"
      },
      {
        "label": "vertical",
        "value": "vertical"
      }
    ]
  },
  {
    "name": "progressDot",
    "label": "progressDot",
    "type": "switch"
  },
  {
    "name": "responsive",
    "label": "responsive",
    "type": "switch"
  },
  {
    "name": "size",
    "label": "尺寸",
    "type": "select",
    "options": [
      {
        "label": "small",
        "value": "small"
      },
      {
        "label": "default",
        "value": "default"
      }
    ]
  },
  {
    "name": "status",
    "label": "status",
    "type": "select",
    "options": [
      {
        "label": "error",
        "value": "error"
      },
      {
        "label": "wait",
        "value": "wait"
      },
      {
        "label": "process",
        "value": "process"
      },
      {
        "label": "finish",
        "value": "finish"
      }
    ]
  },
  {
    "name": "percent",
    "label": "percent",
    "type": "inputNumber"
  },
  {
    "name": "items",
    "label": "items",
    "type": "input"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange事件"
  }
],
};

export default meta;
