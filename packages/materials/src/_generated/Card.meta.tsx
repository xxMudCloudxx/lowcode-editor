/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Card",
  desc: "Card",
  category: "DataDisplay",
  defaultProps: {},
  setter: [
  {
    "name": "title",
    "label": "标题",
    "type": "input"
  },
  {
    "name": "extra",
    "label": "extra",
    "type": "input"
  },
  {
    "name": "bordered",
    "label": "边框",
    "type": "switch"
  },
  {
    "name": "headStyle",
    "label": "headStyle",
    "type": "input"
  },
  {
    "name": "bodyStyle",
    "label": "bodyStyle",
    "type": "input"
  },
  {
    "name": "loading",
    "label": "加载中",
    "type": "switch"
  },
  {
    "name": "hoverable",
    "label": "hoverable",
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
    "name": "type",
    "label": "类型",
    "type": "select",
    "options": [
      {
        "label": "inner",
        "value": "inner"
      }
    ]
  },
  {
    "name": "cover",
    "label": "cover",
    "type": "input"
  },
  {
    "name": "actions",
    "label": "actions",
    "type": "input"
  },
  {
    "name": "tabList",
    "label": "tabList",
    "type": "input"
  },
  {
    "name": "tabBarExtraContent",
    "label": "tabBarExtraContent",
    "type": "input"
  },
  {
    "name": "activeTabKey",
    "label": "activeTabKey",
    "type": "input"
  },
  {
    "name": "defaultActiveTabKey",
    "label": "defaultActiveTabKey",
    "type": "input"
  },
  {
    "name": "tabProps",
    "label": "tabProps",
    "type": "input"
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
      }
    ]
  }
],
  events: [
  {
    "name": "onTabChange",
    "label": "onTabChange事件"
  }
],
};

export default meta;
