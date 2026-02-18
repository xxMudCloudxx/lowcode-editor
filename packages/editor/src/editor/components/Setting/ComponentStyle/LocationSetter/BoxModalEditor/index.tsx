/**
 * @file /src/editor/components/Setting/ComponentStyle/LocationSetter/BoxModalEditor/index.tsx
 * @description
 * 一个可视化的 CSS 绝对/相对定位编辑器。
 * 用户可以通过这个界面直观地修改元素的 top, right, bottom, left 属性。
 * 它复用了 `StyleStripInputEditor` 组件来实现四个方向的输入。
 * @module Components/Setting/ComponentStyle/LocationBoxModalEditor
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import {
  DIRS,
  Strip,
  type Direction,
} from "../../../../common/StyleStripInputEditor";
import { addUnit, stripUnit } from "../../../../../utils/styles";

/* ---------- 常量 (Constants) ---------- */
const BAR_SIZE = 30; // 条带的厚度
const WEDGE_SIZE = BAR_SIZE; // 斜切尺寸，保持 45° 角
const RETRACT = 3; // 条带向内收缩的距离，用于视觉微调

/* ---------------- 主组件 (Main Component) ---------------- */

interface LocationBoxModalProps {
  /**
   * @description 外部传入的样式对象，用于初始化或更新组件状态。
   */
  value?: CSSProperties;
  /**
   * @description 当值发生变化时，将增量样式回调给父组件。
   */
  onChange?: (css: CSSProperties) => void;
}

const LocationBoxModalEditor = (props: LocationBoxModalProps) => {
  const { value, onChange } = props;
  const [local, setLocal] = useState<Record<Direction, string>>({
    top: "",
    right: "",
    bottom: "",
    left: "",
  });

  useEffect(() => {
    if (!value) return;

    setLocal((current) => {
      const next = { ...current };
      let changed = false;
      DIRS.forEach((d) => {
        const key = `${d}` as keyof CSSProperties;
        const v = stripUnit("px", value[key]);
        if (current[d] !== v) {
          next[d] = v;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [value]);
  /**
   * @description 当输入框的值发生变化时，立即更新本地状态，并通知父组件。
   * @param dir - 更改的方向 ("top" | "right" | "bottom" | "left")
   * @param v - 输入框的最新值 (字符串)
   */
  const onFieldChange = useCallback(
    (dir: Direction, v: string) => {
      // 增加一个简单的校验，确保输入的是数字或空字符串
      if (/^\d*$/.test(v)) {
        setLocal((current) => ({
          ...current,
          [dir]: v, // 使用计算属性名来动态更新对应的方向
        }));
        onChange?.({ [dir]: addUnit("px", v) });
      }
    },
    [onChange] // 依赖项是 onChange
  );

  return (
    <div className="flex justify-center items-center py-4 select-none">
      <div className="w-[240px] h-[160px] transition-transform origin-center">
        <div className="relative w-full h-full">
          {DIRS.map((d) => (
            <Strip
              key={d}
              dir={d}
              value={local[d]}
              onChange={onFieldChange}
              barSize={BAR_SIZE}
              wedgeSize={WEDGE_SIZE}
              retract={RETRACT}
              inputWidth={80}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationBoxModalEditor;
