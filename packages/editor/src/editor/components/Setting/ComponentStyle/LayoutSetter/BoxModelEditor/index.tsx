/**
 * @file /src/editor/components/Setting/ComponentStyle/LayoutSetter/BoxModelEditor/index.tsx
 * @description
 * 一个可视化的 CSS 盒模型 (Box Model) 编辑器组件。
 * 用户可以通过这个界面直观地修改元素的 margin 和 padding。
 * 它被设计为一个受控组件，内部通过防抖（debounce）来优化 onChange 事件的触发频率。
 * @module Components/Setting/ComponentStyle/BoxModelEditor
 */
import { debounce } from "lodash-es";
import {
  useEffect,
  useState,
  useRef,
  type CSSProperties,
  useCallback,
  useMemo,
} from "react";
import { addUnit, cap, stripUnit } from "../../../../../utils/styles";
import {
  DIRS,
  Strip,
  type Direction,
} from "../../../../common/StyleStripInputEditor";

/* ---------- 常量 (Constants) ---------- */
const BAR_SIZE = 20; // 条带的厚度
const WEDGE_SIZE = BAR_SIZE; // 斜切尺寸，保持 45° 角
const RETRACT = 3; // 条带向内收缩的距离，用于视觉微调
const GAP_SIZE = 5; // margin 和 padding 区域的间隙

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
  // 2. 同步逻辑：当外部 `value` prop 变化时，同步更新到内部的 `local` state。（render-time sync）
  //
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      setLocal((prev) => {
        const next = {
          margin: { ...prev.margin },
          padding: { ...prev.padding },
        };
        let changed = false;

        DIRS.forEach((d) => {
          const mKey = `margin${cap(d)}` as keyof CSSProperties;
          const pKey = `padding${cap(d)}` as keyof CSSProperties;
          const m = stripUnit("px", value[mKey]);
          const p = stripUnit("px", value[pKey]);

          if (prev.margin[d] !== m) {
            next.margin[d] = m;
            changed = true;
          }
          if (prev.padding[d] !== p) {
            next.padding[d] = p;
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }
  }

  //
  // 3. 事件处理：将本地 state 的变化通过防抖函数上报给父组件。
  //
  const debouncedEmit = useMemo(
    () =>
      debounce((css: BoxModelValue) => {
        onChange?.(css);
      }, 300),
    [onChange],
  );

  const onFieldChange = useCallback(
    (type: "margin" | "padding", dir: Direction, v: string) => {
      // 立即更新本地 state，保证输入框的即时响应
      setLocal((prev) => ({
        ...prev,
        [type]: { ...prev[type], [dir]: v },
      }));
      // 触发防抖回调，延迟上报给父组件
      debouncedEmit({ [`${type}${cap(dir)}`]: addUnit("px", v) });
    },
    [debouncedEmit],
  );

  const handleMargin = useCallback(
    (dir: Direction, v: string) => onFieldChange("margin", dir, v),
    [onFieldChange],
  );
  const handlePadding = useCallback(
    (dir: Direction, v: string) => onFieldChange("padding", dir, v),
    [onFieldChange],
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
    <div className="flex justify-center items-center  select-none">
      <div
        // ref={wrapRef}
        className="w-[340px] h-[160px] transition-transform origin-center"
      >
        <div className="relative w-full h-full">
          {/* 外层: margin */}
          {DIRS.map((d, i) => (
            <Strip
              key={`m-${d}`}
              dir={d}
              value={local.margin[d]}
              onChange={handleMargin}
              barSize={BAR_SIZE}
              wedgeSize={WEDGE_SIZE}
              retract={RETRACT}
              inputWidth={80}
              tabIndex={1 + i}
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
            {DIRS.map((d, i) => (
              <Strip
                key={`p-${d}`}
                dir={d}
                value={local.padding[d]}
                onChange={handlePadding}
                barSize={BAR_SIZE}
                wedgeSize={WEDGE_SIZE}
                retract={RETRACT}
                inputWidth={68}
                tabIndex={5 + i}
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
