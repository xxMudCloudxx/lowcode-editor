/**
 * @file ZoomControl.tsx
 * @description
 * Figma 风格的悬浮缩放控件
 * 支持拖拽移动位置，使用 fixed 定位
 */

import { useEffect, useCallback, useState, useRef } from "react";
import { MinusOutlined, PlusOutlined, DragOutlined } from "@ant-design/icons";
import { Button, Tooltip, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { useUIStore } from "../../../stores/uiStore";

export function ZoomControl() {
  const { localScale, zoomIn, zoomOut, resetZoom, setLocalScale } =
    useUIStore();

  // 拖拽状态
  const [position, setPosition] = useState({ right: 24, bottom: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, right: 0, bottom: 0 });

  // 预设比例菜单
  const items: MenuProps["items"] = [
    { key: "0.5", label: "50%" },
    { key: "0.75", label: "75%" },
    { key: "1.0", label: "100%" },
    { key: "1.5", label: "150%" },
    { key: "2.0", label: "200%" },
    { type: "divider" },
    { key: "reset", label: "重置为 100%" },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "reset") {
      resetZoom();
    } else {
      setLocalScale(parseFloat(key));
    }
  };

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    },
    [zoomIn, zoomOut, resetZoom]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 拖拽开始
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        right: position.right,
        bottom: position.bottom,
      };
    },
    [position]
  );

  // 拖拽移动
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = dragStartRef.current.x - e.clientX;
      const deltaY = dragStartRef.current.y - e.clientY;

      // 限制在视口范围内
      const newRight = Math.max(
        10,
        Math.min(window.innerWidth - 150, dragStartRef.current.right + deltaX)
      );
      const newBottom = Math.max(
        10,
        Math.min(window.innerHeight - 50, dragStartRef.current.bottom + deltaY)
      );

      setPosition({ right: newRight, bottom: newBottom });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 4,
        backgroundColor: "white",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 4,
        backdropFilter: "blur(8px)",
        opacity: isDragging ? 1 : 0.9,
        transition: isDragging ? "none" : "opacity 0.2s",
        cursor: isDragging ? "grabbing" : "default",
        userSelect: "none",
      }}
      onMouseEnter={(e) => !isDragging && (e.currentTarget.style.opacity = "1")}
      onMouseLeave={(e) =>
        !isDragging && (e.currentTarget.style.opacity = "0.9")
      }
    >
      {/* 拖拽手柄 */}
      <div
        onMouseDown={handleDragStart}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          padding: "4px 2px",
          color: "#999",
          display: "flex",
          alignItems: "center",
        }}
        title="拖拽移动"
      >
        <DragOutlined style={{ fontSize: 12 }} />
      </div>

      <Tooltip title="缩小 (Ctrl -)">
        <Button
          size="small"
          type="text"
          icon={<MinusOutlined />}
          onClick={zoomOut}
          disabled={localScale <= 0.1}
        />
      </Tooltip>

      <Dropdown
        menu={{ items, onClick: handleMenuClick }}
        placement="top"
        trigger={["click"]}
      >
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            width: 48,
            textAlign: "center",
            cursor: "pointer",
            userSelect: "none",
            padding: "4px 0",
            borderRadius: 4,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f5f5f5")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {Math.round(localScale * 100)}%
        </span>
      </Dropdown>

      <Tooltip title="放大 (Ctrl +)">
        <Button
          size="small"
          type="text"
          icon={<PlusOutlined />}
          onClick={zoomIn}
          disabled={localScale >= 3}
        />
      </Tooltip>
    </div>
  );
}

export default ZoomControl;
