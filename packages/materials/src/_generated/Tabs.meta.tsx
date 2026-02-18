/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Tabs",
  desc: "Tabs",
  category: "Navigation",
  defaultProps: {},
  setter: [
  {
    "name": "type",
    "label": "类型",
    "type": "select",
    "options": [
      {
        "label": "line",
        "value": "line"
      },
      {
        "label": "card",
        "value": "card"
      },
      {
        "label": "editable-card",
        "value": "editable-card"
      }
    ]
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
    "name": "hideAdd",
    "label": "hideAdd",
    "type": "switch"
  },
  {
    "name": "centered",
    "label": "居中",
    "type": "switch"
  },
  {
    "name": "addIcon",
    "label": "addIcon",
    "type": "input"
  },
  {
    "name": "moreIcon",
    "label": "moreIcon",
    "type": "input"
  },
  {
    "name": "more",
    "label": "more",
    "type": "input"
  },
  {
    "name": "removeIcon",
    "label": "removeIcon",
    "type": "input"
  },
  {
    "name": "indicatorSize",
    "label": "indicatorSize",
    "type": "input"
  },
  {
    "name": "items",
    "label": "items",
    "type": "input"
  },
  {
    "name": "destroyInactiveTabPane",
    "label": "destroyInactiveTabPane",
    "type": "switch"
  },
  {
    "name": "destroyOnHidden",
    "label": "destroyOnHidden",
    "type": "switch"
  },
  {
    "name": "direction",
    "label": "direction",
    "type": "select",
    "options": [
      {
        "label": "ltr",
        "value": "ltr"
      },
      {
        "label": "rtl",
        "value": "rtl"
      }
    ]
  },
  {
    "name": "activeKey",
    "label": "activeKey",
    "type": "input"
  },
  {
    "name": "locale",
    "label": "locale",
    "type": "input"
  },
  {
    "name": "defaultActiveKey",
    "label": "defaultActiveKey",
    "type": "input"
  },
  {
    "name": "animated",
    "label": "animated",
    "type": "switch"
  },
  {
    "name": "renderTabBar",
    "label": "renderTabBar",
    "type": "input"
  },
  {
    "name": "tabBarExtraContent",
    "label": "tabBarExtraContent",
    "type": "input"
  },
  {
    "name": "tabBarGutter",
    "label": "tabBarGutter",
    "type": "inputNumber"
  },
  {
    "name": "tabBarStyle",
    "label": "tabBarStyle",
    "type": "input"
  },
  {
    "name": "tabPosition",
    "label": "tabPosition",
    "type": "select",
    "options": [
      {
        "label": "left",
        "value": "left"
      },
      {
        "label": "right",
        "value": "right"
      },
      {
        "label": "top",
        "value": "top"
      },
      {
        "label": "bottom",
        "value": "bottom"
      }
    ]
  },
  {
    "name": "indicator",
    "label": "indicator",
    "type": "input"
  }
],
  events: [
  {
    "name": "onEdit",
    "label": "onEdit事件"
  },
  {
    "name": "onChange",
    "label": "onChange事件"
  },
  {
    "name": "onTabClick",
    "label": "onTabClick事件"
  },
  {
    "name": "onTabScroll",
    "label": "onTabScroll事件"
  }
],
};

export default meta;
