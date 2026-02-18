/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Input",
  desc: "Input",
  category: "DataEntry",
  defaultProps: {
  "variant": "outlined"
},
  setter: [
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
    "name": "bordered",
    "label": "边框",
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
    "name": "_skipAddonWarning",
    "label": "_skipAddonWarning",
    "type": "switch"
  },
  {
    "name": "prefix",
    "label": "prefix",
    "type": "input"
  },
  {
    "name": "autoComplete",
    "label": "autoComplete",
    "type": "input"
  },
  {
    "name": "type",
    "label": "类型",
    "type": "input"
  },
  {
    "name": "value",
    "label": "value",
    "type": "input"
  },
  {
    "name": "showCount",
    "label": "显示计数",
    "type": "switch"
  },
  {
    "name": "htmlSize",
    "label": "htmlSize",
    "type": "inputNumber"
  },
  {
    "name": "count",
    "label": "count",
    "type": "input"
  },
  {
    "name": "suffix",
    "label": "suffix",
    "type": "input"
  },
  {
    "name": "allowClear",
    "label": "可清除",
    "type": "switch"
  }
],
  events: [
  {
    "name": "onPressEnter",
    "label": "onPressEnter事件"
  },
  {
    "name": "onClear",
    "label": "onClear事件"
  }
],
};

export default meta;
