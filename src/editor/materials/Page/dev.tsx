import { useState, useLayoutEffect } from "react";
import type { CommonComponentProps } from "../../interface";
import { useMaterailDrop } from "../../hooks/useMatrialDrop";

/**
 * @description Page 组件的“开发”版本，用于编辑器画布内。
 * @see /src/editor/materials/README.md - 详细规范请参考物料组件开发文档。
 */
function PageDev({ children, id, name, isSelected }: CommonComponentProps) {
  const { isOver, drop } = useMaterailDrop(id, name);

  // 创建一个 state 来管理动态的高度 class
  const [heightClass, setHeightClass] = useState("h-[100%]");

  // 使用 useLayoutEffect 来动态监测 EditArea 的滚动条状态
  useLayoutEffect(() => {
    // 找到画布的容器
    const editArea = document.querySelector(".edit-area");

    if (editArea) {
      // 检查 scrollHeight 是否大于 clientHeight
      const hasScrollbar = editArea.scrollHeight > editArea.clientHeight;

      // 根据是否有滚动条来更新高度 class
      setHeightClass(hasScrollbar ? "h-max" : "h-[100%]");
    }

    // 依赖项是 children，这样每当画布内容变化时，我们都会重新检查
  }, [children]);

  return (
    <div
      ref={drop}
      className={`p-[20px] ${heightClass} box-border ${
        // 应用动态的高度 class
        isSelected
          ? "" // 如果被选中，就不要任何边框和轮廓，完全交给 SelectedMask
          : `border border-solid border-[#000] ${
              isOver ? "outline outline-blue-500" : ""
            }` // 否则，显示常规边框和悬浮轮廓
      }`}
      data-component-id={id}
    >
      {children}
    </div>
  );
}

export default PageDev;
