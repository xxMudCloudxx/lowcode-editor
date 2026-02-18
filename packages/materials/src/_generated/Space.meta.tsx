/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Space",
  desc: "Space",
  category: "Layout",
  defaultProps: {},
  setter: [
  {
    "name": "size",
    "label": "尺寸",
    "type": "input"
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
    "name": "align",
    "label": "align",
    "type": "select",
    "options": [
      {
        "label": "start",
        "value": "start"
      },
      {
        "label": "end",
        "value": "end"
      },
      {
        "label": "center",
        "value": "center"
      },
      {
        "label": "baseline",
        "value": "baseline"
      }
    ]
  },
  {
    "name": "split",
    "label": "split",
    "type": "input"
  },
  {
    "name": "wrap",
    "label": "wrap",
    "type": "switch"
  }
],
  events: [],
};

export default meta;
