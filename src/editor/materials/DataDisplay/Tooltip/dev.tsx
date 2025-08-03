import { Tooltip as AntdTooltip } from "antd";
import type { CommonComponentProps } from "../../../interface";
import { useDrag } from "react-dnd";
import { useMaterailDrop } from "../../../hooks/useMatrialDrop";
import { useEffect, useRef } from "react";

const TooltipDev = ({
  id,
  name,
  styles,
  title,
  placement,
  children,
  isSelected,
}: CommonComponentProps) => {
  const { isOver, drop } = useMaterailDrop(id, name);

  const divRef = useRef<HTMLDivElement>(null);

  const [_, drag] = useDrag({
    type: name,
    item: { type: name, dragType: "move", id },
  });

  useEffect(() => {
    drop(divRef);
    drag(divRef);
  }, []);

  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : !!children;

  return (
    <div
      ref={divRef}
      data-component-id={id}
      style={{ display: "inline-block" }}
      className={` -ml-px -mt-px ${
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : ` ${isOver ? "outline outline-blue-600" : ""}` // 否则，显示常规边框和悬浮轮廓
      }`}
    >
      <AntdTooltip title={title} placement={placement} style={styles}>
        {hasChildren ? (
          children
        ) : (
          <div className="h-[80px] w-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm select-none pointer-events-none">
            请拖拽需有Tooltiptis提示的组件到这里
          </div>
        )}
      </AntdTooltip>
    </div>
  );
};

export default TooltipDev;
