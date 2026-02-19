/**
 * @file /src/editor/components/Header/Header.tsx
 * @description
 * 应用的顶部全局页头组件。
 * 采用三区布局：左区（品牌）、中区（工作台控件）、右区（元操作）
 * @module Components/Header
 */

import {
  Button,
  Space,
  Popconfirm,
  Typography,
  Popover,
  Dropdown,
  Avatar,
  Tooltip,
  Segmented,
  type MenuProps,
} from "antd";
import {
  QuestionCircleOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CodeOutlined,
  UserOutlined,
  ClearOutlined,
  DeleteOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;
import {
  useComponentsStore,
  buildComponentTree,
} from "../../stores/components";
import { useUIStore } from "../../stores/uiStore";
import { useHistoryStore } from "../../stores/historyStore";
import { exportSourceCode } from "@lowcode/code-generator";
import type { IGeneratedFile, ISchema } from "@lowcode/schema";
import { useState } from "react";
import { CodePreviewDrawer } from "../CodePreviewDrawer";

/**
 * @description 快捷键指南的 Popover 内容
 */
const shortcutsContent = (
  <div className="w-64 space-y-3">
    <div>
      <Text className="text-text-secondary text-xs font-medium uppercase tracking-wide">
        通用快捷键
      </Text>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + Z
        </Text>
        <Text className="text-text-secondary text-sm">撤销</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + Shift + Z
        </Text>
        <Text className="text-text-secondary text-sm">恢复</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + C
        </Text>
        <Text className="text-text-secondary text-sm">复制</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Cmd/Ctrl + V
        </Text>
        <Text className="text-text-secondary text-sm">粘贴</Text>
      </div>
      <div className="flex justify-between items-center">
        <Text code className="text-xs">
          Delete
        </Text>
        <Text className="text-text-secondary text-sm">删除</Text>
      </div>
    </div>
  </div>
);

/**
 * @description
 * 页头组件 - 三区布局
 *
 * 左区 (Brand & Context): Logo、应用名称、保存状态
 * 中区 (Workbench Controls): 撤销/重做、画布尺寸、快捷键
 * 右区 (Meta Actions): 出码、预览、更多菜单、用户头像
 */
export function Header() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<IGeneratedFile[]>([]);
  const { resetComponents } = useComponentsStore();
  const {
    mode,
    setMode,
    setCurComponentId,
    canvasSize,
    setCanvasSize,
    setCanvasPreset,
  } = useUIStore();
  const { undo, redo, clear, past, future } = useHistoryStore();

  const handleReset = () => {
    resetComponents();
  };

  const handleOpenCodePreview = async () => {
    setIsExporting(true);
    const { components, rootId } = useComponentsStore.getState();
    const schema = buildComponentTree(components, rootId);

    if (!schema || schema.length === 0) {
      console.error("Schema 为空，无法导出");
      setIsExporting(false);
      return;
    }

    try {
      const result = await exportSourceCode(schema as ISchema, {
        skipPublisher: true,
      });

      if (result.success && result.files) {
        setGeneratedFiles(result.files);
        setIsDrawerVisible(true);
      } else {
        console.error("出码失败:", result.message);
        alert(`出码失败: ${result.message}`);
      }
    } catch (error) {
      console.error("执行 exportSourceCode 时发生异常", error);
      alert(`出码异常: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  // // 更多菜单（危险操作折叠）
  // const moreMenuItems: MenuProps["items"] = [
  //   {
  //     key: "reset-history",
  //     label: (
  //       <Popconfirm
  //         title="确认重置历史记录？"
  //         description="此操作将清空所有撤销/重做历史，且无法恢复。"
  //         onConfirm={clear}
  //         okText="确认"
  //         cancelText="取消"
  //       >
  //         <span className="text-red-500">重置历史记录</span>
  //       </Popconfirm>
  //     ),
  //   },
  //   {
  //     key: "reset-canvas",
  //     label: (
  //       <Popconfirm
  //         title="确认清空画布？"
  //         description="此操作将清空所有组件，且无法撤销。"
  //         onConfirm={handleReset}
  //         okText="确认"
  //         cancelText="取消"
  //       >
  //         <span className="text-red-500">清空画布</span>
  //       </Popconfirm>
  //     ),
  //   },
  // ];

  // 用户菜单
  const userMenuItems: MenuProps["items"] = [
    { key: "profile", label: "个人设置" },
    { key: "projects", label: "我的项目" },
    { type: "divider" },
    { key: "logout", label: "退出登录", danger: true },
  ];

  return (
    <div className="w-full h-full">
      {/* 使用 CSS Grid 实现三区布局，中间真正居中 */}
      <div className="h-full grid grid-cols-[auto_1fr_auto] items-center">
        {/* ========== 左区：Brand & Context ========== */}
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-accent-600"
            viewBox="0 0 1112 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M952.181449 1024.005564H158.694126C71.050677 1024.005564 0 953.093996 0 865.617475V158.438168C0 70.961648 71.050677 0.050079 158.694126 0.050079h793.487323C1039.824898 0.050079 1112.862033 70.961648 1112.862033 158.438168v707.179307c0 87.47652-73.037135 158.388089-160.680584 158.388089zM311.601369 289.455415L89.028963 512.027822l217.008096 222.572406 61.207412-55.643101-161.364995-166.929305 166.929305-161.364995-61.207412-61.207412z m400.630332-133.543444h-144.672064L478.530674 795.80764H400.630332v72.336032h155.800685l77.900342-639.895669h77.900342V155.911971z m89.028963 133.543444l-61.207412 61.207412 166.929305 161.364995-161.364995 166.929305 61.207412 55.643101 217.008097-222.572406-222.572407-222.572407z"
              fill="currentColor"
            />
          </svg>
          <div>
            <Title level={5} className="mb-0! text-neutral-800 font-semibold">
              低代码编辑器
            </Title>
            <Text className="text-xs text-neutral-400">
              {mode === "edit" ? "编辑中" : "预览模式"}
            </Text>
          </div>
        </div>

        {/* ========== 中区：Workbench Controls ========== */}
        <div className="flex items-center justify-center gap-4">
          {mode === "edit" && (
            <>
              {/* 撤销/重做 */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-1">
                <Tooltip title="撤销 (Ctrl+Z)">
                  <Button
                    onClick={() => undo()}
                    disabled={!past.length}
                    size="small"
                    icon={<UndoOutlined />}
                    type="text"
                  />
                </Tooltip>
                <Tooltip title="重做 (Ctrl+Shift+Z)">
                  <Button
                    onClick={() => redo()}
                    disabled={!future.length}
                    size="small"
                    icon={<RedoOutlined />}
                    type="text"
                  />
                </Tooltip>
              </div>
              {/* 画布尺寸切换 */}
              <Segmented
                size="small"
                value={canvasSize.mode}
                onChange={(v) =>
                  setCanvasPreset(v as "desktop" | "tablet" | "mobile")
                }
                options={[
                  { value: "desktop", icon: <DesktopOutlined /> },
                  { value: "tablet", icon: <TabletOutlined /> },
                  { value: "mobile", icon: <MobileOutlined /> },
                ]}
              />

              {/* 画布尺寸输入 - 仅在非 desktop 模式显示 */}
              {canvasSize.mode !== "desktop" && (
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="number"
                    value={
                      typeof canvasSize.width === "number"
                        ? canvasSize.width
                        : 375
                    }
                    onChange={(e) => {
                      const width = parseInt(e.target.value) || 375;
                      setCanvasSize({ ...canvasSize, width });
                    }}
                    className="w-18 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                    min={200}
                    max={2000}
                  />
                  <span className="text-gray-400">×</span>
                  <input
                    type="number"
                    value={
                      typeof canvasSize.height === "number"
                        ? canvasSize.height
                        : 667
                    }
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || 667;
                      setCanvasSize({ ...canvasSize, height });
                    }}
                    className="w-18 px-2 py-1 border border-gray-300 rounded text-center text-xs"
                    min={200}
                    max={3000}
                  />
                </div>
              )}

              {/* 快捷键指南 */}
              <Popover
                content={shortcutsContent}
                title={
                  <Title level={5} className="mb-2!">
                    快捷键指南
                  </Title>
                }
                trigger="click"
                placement="bottom"
              >
                <Button
                  icon={<QuestionCircleOutlined />}
                  size="small"
                  type="text"
                />
              </Popover>
            </>
          )}
        </div>

        {/* ========== 右区：Meta Actions ========== */}
        <Space size="middle">
          {mode === "edit" && (
            <>
              {/* 重置按钮组 */}
              <div className="flex gap-2">
                <Popconfirm
                  title="确认重置历史记录？"
                  description="此操作将清空所有撤销/重做历史，且无法恢复。"
                  onConfirm={clear}
                  okText="确认重置"
                  cancelText="取消"
                  placement="bottomRight"
                >
                  <Button size="middle" icon={<ClearOutlined />} danger>
                    重置历史
                  </Button>
                </Popconfirm>

                <Popconfirm
                  title="确认重置画布？"
                  description="此操作将清空所有组件，且无法撤销。"
                  onConfirm={handleReset}
                  okText="确认重置"
                  cancelText="取消"
                  placement="bottomRight"
                >
                  <Button size="middle" icon={<DeleteOutlined />} danger>
                    重置画布
                  </Button>
                </Popconfirm>
              </div>
              {/* 出码 */}
              <Button
                onClick={handleOpenCodePreview}
                loading={isExporting}
                icon={<CodeOutlined />}
                size="middle"
              >
                {isExporting ? "生成中..." : "出码"}
              </Button>
              <CodePreviewDrawer
                visible={isDrawerVisible}
                loading={isExporting}
                files={generatedFiles}
                onClose={() => setIsDrawerVisible(false)}
              />

              {/* 预览（Primary Action） */}
              <Button
                onClick={() => {
                  setMode("preview");
                  setCurComponentId(null);
                }}
                type="primary"
                size="middle"
                icon={<EyeOutlined />}
              >
                预览
              </Button>

              {/* 用户头像 */}
              {/* TODO: 后面使用Clerk替代 */}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  className="cursor-pointer bg-accent-500"
                />
              </Dropdown>
            </>
          )}

          {mode === "preview" && (
            <Button
              onClick={() => setMode("edit")}
              type="primary"
              size="middle"
              icon={<EyeInvisibleOutlined />}
            >
              退出预览
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
