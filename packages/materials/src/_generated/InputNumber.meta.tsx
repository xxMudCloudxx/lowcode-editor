/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "InputNumber",
  desc: "InputNumber",
  category: "DataEntry",
  defaultProps: {
  "variant": "outlined"
},
  setter: [
  {
    "name": "addonBefore",
    "label": "addonBefore",
    "type": "input"
  },
  {
    "name": "addonAfter",
    "label": "addonAfter",
    "type": "input"
  },
  {
    "name": "prefix",
    "label": "prefix",
    "type": "input"
  },
  {
    "name": "suffix",
    "label": "suffix",
    "type": "input"
  },
  {
    "name": "size",
    "label": "尺寸",
    "type": "select",
    "options": [
      {
        "label": "large",
        "value": "large"
      },
      {
        "label": "small",
        "value": "small"
      },
      {
        "label": "middle",
        "value": "middle"
      }
    ]
  },
  {
    "name": "disabled",
    "label": "禁用",
    "type": "switch"
  },
  {
    "name": "bordered",
    "label": "边框",
    "type": "switch"
  },
  {
    "name": "status",
    "label": "status",
    "type": "select",
    "options": [
      {
        "label": "",
        "value": ""
      },
      {
        "label": "warning",
        "value": "warning"
      },
      {
        "label": "error",
        "value": "error"
      }
    ]
  },
  {
    "name": "controls",
    "label": "controls",
    "type": "switch"
  },
  {
    "name": "variant",
    "label": "variant",
    "type": "select",
    "options": [
      {
        "label": "borderless",
        "value": "borderless"
      },
      {
        "label": "outlined",
        "value": "outlined"
      },
      {
        "label": "filled",
        "value": "filled"
      },
      {
        "label": "underlined",
        "value": "underlined"
      }
    ]
  },
  {
    "name": "defaultValue",
    "label": "defaultValue",
    "type": "input"
  },
  {
    "name": "step",
    "label": "step",
    "type": "input"
  },
  {
    "name": "value",
    "label": "value",
    "type": "input"
  },
  {
    "name": "max",
    "label": "max",
    "type": "input"
  },
  {
    "name": "min",
    "label": "min",
    "type": "input"
  },
  {
    "name": "stringMode",
    "label": "stringMode",
    "type": "switch"
  },
  {
    "name": "upHandler",
    "label": "upHandler",
    "type": "input"
  },
  {
    "name": "downHandler",
    "label": "downHandler",
    "type": "input"
  },
  {
    "name": "keyboard",
    "label": "keyboard",
    "type": "switch"
  },
  {
    "name": "changeOnWheel",
    "label": "changeOnWheel",
    "type": "switch"
  },
  {
    "name": "parser",
    "label": "parser",
    "type": "input"
  },
  {
    "name": "formatter",
    "label": "formatter",
    "type": "switch"
  },
  {
    "name": "precision",
    "label": "precision",
    "type": "inputNumber"
  },
  {
    "name": "decimalSeparator",
    "label": "decimalSeparator",
    "type": "input"
  },
  {
    "name": "changeOnBlur",
    "label": "changeOnBlur",
    "type": "switch"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange事件"
  },
  {
    "name": "onInput",
    "label": "onInput事件"
  },
  {
    "name": "onPressEnter",
    "label": "onPressEnter事件"
  },
  {
    "name": "onStep",
    "label": "onStep事件"
  }
],
};

export default meta;
