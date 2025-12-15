import { Segmented, Drawer, Button } from "antd";
import { useState, useRef, useCallback } from "react";
import { ExpandOutlined } from "@ant-design/icons";
import { Material } from "./Material";
import { Outline } from "./Outline";
import { Source } from "./Source/index.tsx";

export function MaterialWrapper() {
  const [key, setKey] = useState<string>("物料");
  const [outlineDrawerOpen, setOutlineDrawerOpen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(800);
  const [isResizing, setIsResizing] = useState(false);
  const rafRef = useRef<number | null>(null);

  // 拖拽调整宽度 - 使用 RAF 节流优化性能
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return; // 节流
      rafRef.current = requestAnimationFrame(() => {
        const newWidth = Math.max(
          400,
          Math.min(e.clientX, window.innerWidth - 100)
        );
        setDrawerWidth(newWidth);
        rafRef.current = null;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 分段控制器 */}
      <div className="mb-6">
        <Segmented
          value={key}
          onChange={setKey}
          block
          options={[
            { label: "物料", value: "物料" },
            { label: "大纲", value: "大纲" },
            { label: "源码", value: "源码" },
          ]}
          className=""
        />
      </div>

      {/* 内容区域 */}
      <div className="custom-scrollbar h-[calc(100vh-100px)] w-full">
        {key === "物料" && <Material />}
        {key === "大纲" && (
          <div className="relative h-full w-full">
            <div className="absolute top-0 right-0 z-10">
              {/* 展开按钮 */}
              <Button
                icon={<ExpandOutlined />}
                size="small"
                onClick={() => setOutlineDrawerOpen(true)}
                title="展开查看"
              />
            </div>
            <Outline />
          </div>
        )}
        {key === "源码" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <Source />
            </div>
          </div>
        )}
      </div>

      {/* 大纲抽屉 - 可拖拽调整宽度 */}
      <Drawer
        title="组件大纲"
        placement="left"
        width={drawerWidth}
        open={outlineDrawerOpen}
        onClose={() => setOutlineDrawerOpen(false)}
        styles={{
          body: { padding: 0 },
          // 拖拽时禁用过渡动画以提高性能
          wrapper: isResizing ? { transition: "none" } : undefined,
        }}
      >
        <div className="h-full overflow-auto p-4">
          <Outline />
        </div>
        {/* 拖拽把手 - 加宽点击区域 */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-400/30 active:bg-blue-400/50"
          style={{ userSelect: "none" }}
        />
      </Drawer>
    </div>
  );
}
