/**
 * @file /src/editor/components/Setting/BoxModelEditor.tsx
 * @description
 * 一个可视化的 CSS 盒模型 (Box Model) 编辑器组件。
 * 用户可以通过这个界面直观地修改元素的 margin 和 padding。
 * 它被设计为一个受控组件。
 * @module Components/Setting/BoxModelEditor
 */
import { debounce } from "lodash-es";
import React, {
  useEffect,
  useState,
  useRef,
  type CSSProperties,
  useCallback,
} from "react";
import { addUnit, stripUnit } from "../../../../../utils/styles";

/* ---------- 常量 (Constants) ---------- */
const BAR_SIZE = 20; // 条带的厚度
const WEDGE_SIZE = BAR_SIZE; // 斜切尺寸，保持 45° 角
const RETRACT = 3; // 条带向内收缩的距离，用于视觉微调
const GAP_SIZE = 5; // margin 和 padding 区域的间隙

const DIRS = ["top", "right", "bottom", "left"] as const;
type Direction = (typeof DIRS)[number];

/* ---------- 工具函数 (Utilities) ---------- */
/**

/**
 * @description 将方向字符串的首字母大写 (e.g., 'top' -> 'Top')。
 */
const cap = (s: Direction) => s[0].toUpperCase() + s.slice(1);

/**
 * @description 计算并返回单个方向条带的 CSS 样式。
 * @param {Direction} dir - 方向 ('top', 'right', 'bottom', 'left')。
 * @param {string} color - 条带的背景颜色。
 * @returns {CSSProperties} 计算出的样式对象。
 */
function getStripStyle(dir: Direction): CSSProperties {
  const b = BAR_SIZE,
    w = WEDGE_SIZE,
    r = RETRACT;
  const base: CSSProperties = {};
  // 使用 clip-path 属性将矩形裁剪成梯形，以实现边角斜切的视觉效果
  switch (dir) {
    case "top":
      return {
        ...base,
        top: 0,
        left: r,
        right: r,
        height: b,
        clipPath: `polygon(0 0, 100% 0, calc(100% - ${w}px) 100%, ${w}px 100%)`,
      };
    case "bottom":
      return {
        ...base,
        bottom: 0,
        left: r,
        right: r,
        height: b,
        clipPath: `polygon(${w}px 0, calc(100% - ${w}px) 0, 100% 100%, 0 100%)`,
      };
    case "left":
      return {
        ...base,
        left: 0,
        top: r,
        bottom: r,
        width: b,
        clipPath: `polygon(0 0, 100% ${w}px, 100% calc(100% - ${w}px), 0 100%)`,
      };
    case "right":
      return {
        ...base,
        right: 0,
        top: r,
        bottom: r,
        width: b,
        clipPath: `polygon(0 ${w}px, 100% 0, 100% 100%, 0 calc(100% - ${w}px))`,
      };
  }
}

/* ---------- 输入框子组件 (BoxInput Sub-component) ---------- */
interface BoxInputProps {
  type: "margin" | "padding";
  dir: Direction;
  value: string;
  tabIndex: number;
  onChange: (val: string) => void;
}
/**
 * @description 用于输入单个方向值的受控输入框组件。
 */
const BoxInput: React.FC<BoxInputProps> = ({
  type,
  dir,
  value,
  tabIndex,
  onChange,
}) => {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // 只允许输入最多4位数字
    if (/^\d{0,4}$/.test(v)) {
      onChange(v);
    }
  };

  const wCls = type === "margin" ? "w-[80px]" : "w-[68px]";
  return (
    <input
      className={`absolute bg-transparent text-center text-xs font-mono
        placeholder:text-gray-400
        focus:outline-none focus:ring-0 rounded-[2px] ${wCls}`}
      style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      placeholder="0"
      value={value}
      onChange={handle}
      aria-label={`${type} ${dir}`}
      tabIndex={tabIndex}
    />
  );
};

/* ---------- 条带子组件 (Strip Sub-component) ---------- */
interface StripProps {
  type: "margin" | "padding";
  dir: Direction;
  value: string;
  onFieldChange: (
    type: "margin" | "padding",
    dir: Direction,
    v: string
  ) => void;
}
/**
 * @description 渲染单个方向（上/下/左/右）的可视化条带及其内部的输入框。
 */
const Strip: React.FC<StripProps> = ({ type, dir, value, onFieldChange }) => {
  const tabBase = type === "margin" ? 1 : 5;
  const tabIdx = tabBase + DIRS.indexOf(dir);

  return (
    <div
      className="absolute grid place-items-center select-none bg-[hsl(220_100%_90%)] hover:bg-[hsl(220_100%_86%)]"
      style={getStripStyle(dir)}
    >
      <BoxInput
        type={type}
        dir={dir}
        value={value}
        tabIndex={tabIdx}
        onChange={(v) => onFieldChange(type, dir, v)}
      />
    </div>
  );
};

/* ---------------- 主组件 (Main Component) ---------------- */
export interface BoxModelValue extends CSSProperties {}
interface Props {
  /**
   * @description 外部传入的样式对象，用于初始化或更新组件状态。
   */
  value?: BoxModelValue;
  /**
   * @description 当值发生变化时（经过300ms防抖处理），将增量样式回调给父组件。
   */
  onChange?: (css: BoxModelValue) => void;
}

/**
 * @description 可视化的 CSS 盒模型编辑器主组件。
 */
export default function BoxModelEditor({ value, onChange }: Props) {
  //
  // 1. 本地 state：用于即时响应用户输入，提供流畅的体验。
  //
  const [local, setLocal] = useState<
    Record<"margin" | "padding", Record<Direction, string>>
  >({
    margin: { top: "", right: "", bottom: "", left: "" },
    padding: { top: "", right: "", bottom: "", left: "" },
  });

  //
  // 2. 同步逻辑：当外部 `value` prop 变化时，同步更新到内部的 `local` state。
  //
  useEffect(() => {
    if (!value) return;

    // 使用函数式更新 `setLocal(prev => ...)`，可以避免将 `local` 作为此 effect 的依赖项，
    // 防止在本地更新时（`onFieldChange`中）反向触发此 effect，造成不必要的渲染循环。
    setLocal((prev) => {
      const next = {
        margin: { ...prev.margin },
        padding: { ...prev.padding },
      };
      let changed = false;

      DIRS.forEach((d) => {
        const mKey = `margin${cap(d)}` as keyof CSSProperties;
        const pKey = `padding${cap(d)}` as keyof CSSProperties;
        const m = stripUnit(value[mKey]);
        const p = stripUnit(value[pKey]);

        if (prev.margin[d] !== m) {
          next.margin[d] = m;
          changed = true;
        }
        if (prev.padding[d] !== p) {
          next.padding[d] = p;
          changed = true;
        }
      });

      // 仅当解析出的值与当前 state 不同时，才进行更新，避免无效渲染。
      return changed ? next : prev;
    });
  }, [value]);

  //
  // 3. 事件处理：将本地 state 的变化通过防抖函数上报给父组件。
  //
  const debouncedEmit = useCallback(
    debounce((css: BoxModelValue) => {
      onChange?.(css);
    }, 30),
    [onChange] // 依赖项是 onChange，确保能拿到最新的回调函数引用
  );

  const onFieldChange = useCallback(
    (type: "margin" | "padding", dir: Direction, v: string) => {
      // 立即更新本地 state，保证输入框的即时响应
      setLocal((prev) => ({
        ...prev,
        [type]: { ...prev[type], [dir]: v },
      }));
      // 触发防抖回调，延迟上报给父组件
      debouncedEmit({ [`${type}${cap(dir)}`]: addUnit(v) });
    },
    [debouncedEmit]
  );

  //
  // 4. 响应式缩放：使用 ResizeObserver 监听容器宽度，使组件能适应小空间。
  //
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current?.parentElement;
    if (!el) return;

    const ro = new ResizeObserver(([e]) => {
      if (wrapRef.current) {
        // 当容器宽度小于280px时，缩小组件
        wrapRef.current.style.transform =
          e.contentRect.width < 280 ? "scale(0.8)" : "scale(1)";
      }
    });

    ro.observe(el);
    // 组件卸载时，断开观察，防止内存泄漏
    return () => ro.disconnect();
  }, []);

  //
  // 5. 渲染UI
  //
  return (
    <div className="flex justify-center items-center py-4 select-none">
      <div
        ref={wrapRef}
        className="w-[240px] h-[160px] transition-transform origin-center"
      >
        <div className="relative w-full h-full">
          {/* 外层: margin */}
          {DIRS.map((d) => (
            <Strip
              key={`m-${d}`}
              type="margin"
              dir={d}
              value={local.margin[d]}
              onFieldChange={onFieldChange}
            />
          ))}
          <span className="absolute bottom-1 left-2 text-xs text-gray-500 pl-3">
            MARGIN
          </span>
          {/* 中心: content 区域 */}
          <div
            className="absolute bg-white border-gray-400 border-1 "
            style={{ inset: `calc(${BAR_SIZE}px + ${GAP_SIZE / 2}px)` }}
          />

          {/* 内层: padding */}
          <div
            className="absolute"
            style={{ inset: `calc(${BAR_SIZE}px + ${GAP_SIZE}px)` }}
          >
            {DIRS.map((d) => (
              <Strip
                key={`p-${d}`}
                type="padding"
                dir={d}
                value={local.padding[d]}
                onFieldChange={onFieldChange}
              />
            ))}
            <span className="absolute bottom-1 left-2 text-xs text-gray-500 pl-3">
              PADDING
            </span>
            <div className="absolute inset-8  flex items-center justify-center">
              <span className="text-gray-500">content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
