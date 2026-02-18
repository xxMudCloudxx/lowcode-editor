/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Switch",
  desc: "Switch",
  category: "DataEntry",
  defaultProps: {},
  setter: [
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
    "name": "checked",
    "label": "checked",
    "type": "switch"
  },
  {
    "name": "defaultChecked",
    "label": "defaultChecked",
    "type": "switch"
  },
  {
    "name": "value",
    "label": "value",
    "type": "switch"
  },
  {
    "name": "defaultValue",
    "label": "defaultValue",
    "type": "switch"
  },
  {
    "name": "checkedChildren",
    "label": "checkedChildren",
    "type": "input"
  },
  {
    "name": "unCheckedChildren",
    "label": "unCheckedChildren",
    "type": "input"
  },
  {
    "name": "disabled",
    "label": "禁用",
    "type": "switch"
  },
  {
    "name": "loading",
    "label": "加载中",
    "type": "switch"
  },
  {
    "name": "title",
    "label": "标题",
    "type": "input"
  }
],
  events: [
  {
    "name": "onChange",
    "label": "onChange事件"
  },
  {
    "name": "onClick",
    "label": "onClick事件"
  }
],
};

export default meta;
