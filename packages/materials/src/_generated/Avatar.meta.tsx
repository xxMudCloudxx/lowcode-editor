/* eslint-disable */
/**
 * 此文件由 scripts/gen-antd-metas.ts 自动生成。
 * 请勿手动修改；如需变更，请参考该脚本中的 component-map.ts。
 */
import type { ComponentProtocol } from '@lowcode/schema';

const meta: Partial<ComponentProtocol> = {
  name: "Avatar",
  desc: "Avatar",
  category: "DataDisplay",
  defaultProps: {},
  setter: [
  {
    "name": "shape",
    "label": "shape",
    "type": "select",
    "options": [
      {
        "label": "circle",
        "value": "circle"
      },
      {
        "label": "square",
        "value": "square"
      }
    ]
  },
  {
    "name": "size",
    "label": "尺寸",
    "type": "input"
  },
  {
    "name": "gap",
    "label": "gap",
    "type": "inputNumber"
  },
  {
    "name": "src",
    "label": "src",
    "type": "input"
  },
  {
    "name": "srcSet",
    "label": "srcSet",
    "type": "input"
  },
  {
    "name": "draggable",
    "label": "draggable",
    "type": "switch"
  },
  {
    "name": "icon",
    "label": "icon",
    "type": "input"
  },
  {
    "name": "alt",
    "label": "alt",
    "type": "input"
  },
  {
    "name": "crossOrigin",
    "label": "crossOrigin",
    "type": "select",
    "options": [
      {
        "label": "",
        "value": ""
      },
      {
        "label": "anonymous",
        "value": "anonymous"
      },
      {
        "label": "use-credentials",
        "value": "use-credentials"
      }
    ]
  }
],
  events: [
  {
    "name": "onClick",
    "label": "onClick事件"
  },
  {
    "name": "onError",
    "label": "onError事件"
  }
],
};

export default meta;
