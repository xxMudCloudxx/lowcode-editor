/**
 * @file /src/editor/components/common/StyleStripInputEditor/index.tsx
 * @description
 * 一个用于可视化编辑 CSS 盒模型（margin/padding）或位置（top/left/right/bottom）的 UI 组件。
 * 它渲染了一个带有斜切效果的条带，并在其中嵌入一个 input 用于修改值。
 * 本身是一个受控组件。
 * @module Components/Common/StyleStripInputEditor
 */
import { getStripStyle } from "../../../utils/styles";
export const DIRS = ["top", "right", "bottom", "left"] as const;
export type Direction = (typeof DIRS)[number];

interface StripInputProps {
  dir: Direction;
  value: string;
  placeholder?: string;
  width?: number;
  tabIndex?: number;
  onChange: (val: string) => void;
}
const StripInput: React.FC<StripInputProps> = ({
  dir,
  value,
  placeholder = "0",
  width = 68,
  tabIndex,
  onChange,
}) => {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (/^\d{0,4}$/.test(v)) onChange(v);
  };

  return (
    <input
      className="absolute bg-transparent text-center text-2xs font-mono
                 placeholder:text-gray-400 focus:outline-none focus:ring-0
                 rounded-[2px]"
      style={{
        width,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      aria-label={`${dir}`}
      placeholder={placeholder}
      value={value}
      onChange={handle}
      tabIndex={tabIndex}
    />
  );
};

/* ---------- 条带 (纯展示 ＋ 回调) ---------- */
interface StripProps {
  dir: Direction;
  value: string;
  onChange: (dir: Direction, v: string) => void;

  /* 非业务核心但常用的定制项 —— 设置默认值即可 */
  barSize?: number;
  wedgeSize?: number;
  retract?: number;
  /** 传给内部输入框的宽度 */
  inputWidth?: number;
  /** 输入框 tabIndex */
  tabIndex?: number;
  /** Hover / 背景色之类，方便不同业务染色 */
  className?: string;
}
export const Strip: React.FC<StripProps> = ({
  dir,
  value,
  onChange,
  barSize = 20,
  wedgeSize = 20,
  retract = 3,
  inputWidth = 68,
  tabIndex,
  className = "bg-[hsl(220_100%_90%)] hover:bg-[hsl(220_100%_86%)]",
}) => {
  return (
    <div
      className={`absolute grid place-items-center select-none ${className}`}
      style={getStripStyle(dir, barSize, wedgeSize, retract)}
    >
      <StripInput
        dir={dir}
        value={value}
        width={inputWidth}
        tabIndex={tabIndex}
        onChange={(v) => onChange(dir, v)}
      />
    </div>
  );
};
export default Strip;
