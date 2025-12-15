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
  Tooltip,
  Segmented,
  message,
  Badge,
  Dropdown,
} from "antd";
import {
  QuestionCircleOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CodeOutlined,
  ClearOutlined,
  DeleteOutlined,
  DesktopOutlined,
  TabletOutlined,
  MobileOutlined,
  CloudUploadOutlined,
  LinkOutlined,
  WifiOutlined,
  DisconnectOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { SignInButton, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
import {
  useComponentsStore,
  buildComponentTree,
} from "../../stores/components";
import { useUIStore } from "../../stores/uiStore";
import { useHistoryStore } from "../../stores/historyStore";
import { useCollaborationStore } from "../../stores/collaborationStore";
import { exportSourceCode } from "../../../code-generator";
import type { IGeneratedFile, ISchema } from "../../../code-generator/types/ir";
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
  const [isGoingLive, setIsGoingLive] = useState(false);

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

  // Clerk 认证
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const { editorMode, isConnected, connectionError } = useCollaborationStore();
  const isLiveMode = editorMode === "live";

  const handleReset = () => {
    resetComponents();
  };

  /**
   * 开启协同:
   * 1. 检查登录态
   * 2. 上传当前 Schema 到后端
   * 3. 重定向到协同编辑页面
   */
  const handleGoLive = async () => {
    if (!isSignedIn) {
      message.info("请先登录以开启协同编辑");
      return;
    }

    setIsGoingLive(true);
    try {
      const token = await getToken();

      // 调试：打印 Token 信息
      console.log(
        "[GoLive] Token received:",
        token ? `${token.substring(0, 20)}...` : "NULL"
      );

      if (!token) {
        message.error("获取认证 Token 失败，请重新登录");
        return;
      }

      // 生成唯一的 pageId（使用时间戳 + 随机数）
      const pageId = `page_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log("[GoLive] Generated pageId:", pageId);

      // 获取当前画布的 schema
      const { components, rootId } = useComponentsStore.getState();
      const schema = buildComponentTree(components, rootId);
      console.log("[GoLive] Schema to upload:", schema);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      console.log("[GoLive] Sending to:", `${apiUrl}/api/pages`);

      // 上传 pageId 和当前 schema
      const res = await fetch(`${apiUrl}/api/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pageId, schema }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("[GoLive] Server error response:", error);
        throw new Error(
          error.details || error.message || error.error || "创建页面失败"
        );
      }

      const data = await res.json();
      message.success("协同模式已开启！");
      navigate(`/editor/${data.pageId}`);
    } catch (error) {
      console.error("Go Live failed:", error);
      message.error(
        `开启协同失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setIsGoingLive(false);
    }
  };

  /**
   * 复制链接
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success("链接已复制到剪贴板");
    } catch (error) {
      message.error("复制失败，请手动复制地址栏链接");
    }
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
        publisher: "none",
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

  // 用户菜单已由 Clerk UserButton 替代

  return (
    <div className="w-full h-full relative">
      {/* 使用 CSS Grid + 绝对定位实现中区真正居中 */}
      <div className="h-full flex items-center justify-between">
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
            {/* 联机模式连接状态 */}
            {isLiveMode ? (
              <Tooltip
                title={isConnected ? "已连接" : connectionError || "连接中..."}
              >
                <Badge
                  status={isConnected ? "success" : "processing"}
                  text={
                    <span className="text-sm">
                      {isConnected ? (
                        <>
                          <WifiOutlined className="mr-1" />
                          已连接
                        </>
                      ) : (
                        <>
                          <DisconnectOutlined className="mr-1" />
                          连接中...
                        </>
                      )}
                    </span>
                  }
                />
              </Tooltip>
            ) : (
              <Text className="text-xs text-neutral-400">
                {mode === "edit" ? "编辑中" : "预览模式"}
              </Text>
            )}
          </div>
        </div>

        {/* ========== 中区：Workbench Controls（绝对居中） ========== */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
          {mode === "edit" && (
            <>
              {/* 撤销/重做 */}
              <div className="flex items-center bg-neutral-100 rounded-lg p-1 gap-1">
                <Tooltip title="撤销 (Ctrl+Z)">
                  <Button
                    onClick={() => undo()}
                    disabled={!past.length || isLiveMode}
                    size="small"
                    icon={<UndoOutlined />}
                    type="text"
                  />
                </Tooltip>
                <Tooltip title="重做 (Ctrl+Shift+Z)">
                  <Button
                    onClick={() => redo()}
                    disabled={!future.length || isLiveMode}
                    size="small"
                    icon={<RedoOutlined />}
                    type="text"
                  />
                </Tooltip>
              </div>
              {/* 画布尺寸切换 - 小屏幕隐藏 */}
              <div className="hidden xl:block">
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
              </div>

              {/* 画布尺寸输入 */}
              {
                <div className="hidden xl:flex items-center gap-1 text-sm">
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
                </div>
              }

              {/* 快捷键指南 - 小屏幕隐藏 */}
              <div className="hidden md:block">
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
              </div>
            </>
          )}
        </div>

        {/* ========== 右区：Meta Actions ========== */}
        <Space size="middle">
          {mode === "edit" && (
            <>
              {/* ===== 大屏幕：完整按钮 ===== */}
              <div className="hidden xl:flex items-center gap-2">
                {/* 重置按钮组 */}
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

                {/* 出码 */}
                <Button
                  onClick={handleOpenCodePreview}
                  loading={isExporting}
                  icon={<CodeOutlined />}
                  size="middle"
                >
                  {isExporting ? "生成中..." : "出码"}
                </Button>

                {/* 预览 */}
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
                {/* 协同按钮 - 始终显示 */}
                {!isLiveMode ? (
                  // 本地模式：显示 "开启协同" 按钮
                  isSignedIn ? (
                    <Button
                      onClick={handleGoLive}
                      loading={isGoingLive}
                      disabled={isGoingLive}
                      icon={<CloudUploadOutlined />}
                      type="primary"
                      ghost
                    >
                      <span className="hidden sm:inline">
                        {isGoingLive ? "上传中..." : "开启协同"}
                      </span>
                    </Button>
                  ) : (
                    <SignInButton mode="modal">
                      <Button
                        icon={<CloudUploadOutlined />}
                        type="primary"
                        ghost
                      >
                        <span className="hidden sm:inline">开启协同</span>
                      </Button>
                    </SignInButton>
                  )
                ) : (
                  // 联机模式：显示复制链接按钮（连接状态已移到左区）
                  <Button onClick={handleCopyLink} icon={<LinkOutlined />}>
                    <span className="hidden sm:inline">复制链接</span>
                  </Button>
                )}
              </div>

              {/* ===== 小屏幕：下拉菜单 ===== */}
              <div className="xl:hidden">
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "preview",
                        icon: <EyeOutlined />,
                        label: "预览",
                        onClick: () => {
                          setMode("preview");
                          setCurComponentId(null);
                        },
                      },
                      {
                        key: "export",
                        icon: <CodeOutlined />,
                        label: isExporting ? "生成中..." : "出码",
                        onClick: handleOpenCodePreview,
                        disabled: isExporting,
                      },
                      { type: "divider" },
                      {
                        key: "clear-history",
                        icon: <ClearOutlined />,
                        label: "重置历史",
                        danger: true,
                        onClick: clear,
                      },
                      {
                        key: "reset-canvas",
                        icon: <DeleteOutlined />,
                        label: "重置画布",
                        danger: true,
                        onClick: handleReset,
                      },
                    ],
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Button icon={<MenuOutlined />} />
                </Dropdown>
              </div>

              {/* CodePreviewDrawer 放在外面，两种模式共用 */}
              <CodePreviewDrawer
                visible={isDrawerVisible}
                loading={isExporting}
                files={generatedFiles}
                onClose={() => setIsDrawerVisible(false)}
              />
              {/* 用户头像 - 始终显示 */}
              {isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="modal">
                  <Button type="text" size="small">
                    登录
                  </Button>
                </SignInButton>
              )}
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
