/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Radio",
  desc: "Radio",
  category: "DataEntry",
  defaultProps: {},
  setter: [
  {
    "name": "defaultValue",
    "label": "defaultValue",
    "type": "input"
  },
  {
    "name": "value",
    "label": "value",
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
    "name": "optionType",
    "label": "optionType",
    "type": "select",
    "options": [
      {
        "label": "default",
        "value": "default"
      },
      {
        "label": "button",
        "value": "button"
      }
    ]
  },
  {
    "name": "buttonStyle",
    "label": "buttonStyle",
    "type": "select",
    "options": [
      {
        "label": "outline",
        "value": "outline"
      },
      {
        "label": "solid",
        "value": "solid"
      }
    ]
  },
  {
    "name": "block",
    "label": "块级",
    "type": "switch"
  },
  {
    "name": "options",
    "label": "options",
    "type": "inputNumber"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange事件"
  },
  {
    "name": "onMouseEnter",
    "label": "onMouseEnter事件"
  },
  {
    "name": "onMouseLeave",
    "label": "onMouseLeave事件"
  },
  {
    "name": "onFocus",
    "label": "onFocus事件"
  },
  {
    "name": "onBlur",
    "label": "onBlur事件"
  }
],
};

export default meta;
