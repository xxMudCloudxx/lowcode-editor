/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Form",
  desc: "Form",
  category: "DataEntry",
  defaultProps: {},
  setter: [
  {
    "name": "colon",
    "label": "colon",
    "type": "switch"
  },
  {
    "name": "layout",
    "label": "layout",
    "type": "select",
    "options": [
      {
        "label": "inline",
        "value": "inline"
      },
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
    "name": "labelAlign",
    "label": "labelAlign",
    "type": "select",
    "options": [
      {
        "label": "left",
        "value": "left"
      },
      {
        "label": "right",
        "value": "right"
      }
    ]
  },
  {
    "name": "labelWrap",
    "label": "labelWrap",
    "type": "switch"
  },
  {
    "name": "labelCol",
    "label": "labelCol",
    "type": "input"
  },
  {
    "name": "wrapperCol",
    "label": "wrapperCol",
    "type": "input"
  },
  {
    "name": "feedbackIcons",
    "label": "feedbackIcons",
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
    "name": "scrollToFirstError",
    "label": "scrollToFirstError",
    "type": "switch"
  },
  {
    "name": "requiredMark",
    "label": "requiredMark",
    "type": "input"
  },
  {
    "name": "hideRequiredMark",
    "label": "hideRequiredMark",
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
    "name": "initialValues",
    "label": "initialValues",
    "type": "input"
  },
  {
    "name": "component",
    "label": "component",
    "type": "input"
  },
  {
    "name": "fields",
    "label": "fields",
    "type": "input"
  },
  {
    "name": "validateMessages",
    "label": "validateMessages",
    "type": "input"
  },
  {
    "name": "validateTrigger",
    "label": "validateTrigger",
    "type": "input"
  },
  {
    "name": "preserve",
    "label": "preserve",
    "type": "switch"
  },
  {
    "name": "clearOnDestroy",
    "label": "clearOnDestroy",
    "type": "switch"
  }
],
  events: [
  {
    "name": "onValuesChange",
    "label": "onValuesChange事件"
  },
  {
    "name": "onFieldsChange",
    "label": "onFieldsChange事件"
  },
  {
    "name": "onFinish",
    "label": "onFinish事件"
  },
  {
    "name": "onFinishFailed",
    "label": "onFinishFailed事件"
  }
],
};

export default meta;
