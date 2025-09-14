/**
 * @file /src/editor/components/Setting/ComponentStyle/index.tsx
 * @description
 * “样式”设置面板。
 * 提供两种方式修改组件样式：
 * 1. 通过表单快速修改通用样式 (基于 `styleSetter` 配置)。
 * 2. 通过内联的 CSS 编辑器进行高级、自由的样式编辑。
 * @module Components/Setting/ComponentStyle
 */

import { Form } from "antd";
import { useComponentConfigStore } from "../../../stores/component-config";
import { useState } from "react";
import CssEditor from "../CssEditor";
import LayoutSetter from "./LayoutSetter";
import FrontSetter from "./FrontSetter";
import BackGroundSetter from "./BackGroundSetter";
import LocationSetter from "./LocationSetter";
import BoardSetter from "./BoardSetter/indx";
import OtherSetter from "./OtherSetter";
import { useComponentStyleManager } from "../../../hooks/useComponentStyleManager";

export function ComponentStyle() {
  const [form] = Form.useForm();

  const { componentConfig } = useComponentConfigStore();

  const { css, curComponent, handleFormValueChange, handleEditorChange } =
    useComponentStyleManager(form);

  // 管理各个样式分类的展开/收起状态，默认全部展开
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    CSS编辑器: true,
    布局: true,
    文字: true,
    背景: true,
    位置: true,
    边框: true,
    其他: true,
  });

  // 切换分类展开状态
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!curComponent) return null;

  // 样式分类配置
  const styleCategories = [
    {
      title: "CSS编辑器",
      component: (
        <div className=" border-[1px] border-[#ccc] h-[200px]">
          <CssEditor value={css} onSave={handleEditorChange} />
        </div>
      ),
    },
    {
      title: "布局",
      component: (
        <LayoutSetter
          curComponent={curComponent}
          onChange={handleFormValueChange}
        />
      ),
    },
    {
      title: "文字",
      component: (
        <FrontSetter
          curComponent={curComponent}
          onChange={handleFormValueChange}
        />
      ),
    },
    {
      title: "背景",
      component: (
        <BackGroundSetter
          curComponent={curComponent}
          onChange={handleFormValueChange}
        />
      ),
    },
    {
      title: "位置",
      component: (
        <LocationSetter
          curComponent={curComponent}
          onChange={handleFormValueChange}
        />
      ),
    },
    {
      title: "边框",
      component: (
        <BoardSetter
          curComponent={curComponent}
          onChange={handleFormValueChange}
        />
      ),
    },
  ];

  // 获取当前组件的配置
  const currentComponentConfig = componentConfig[curComponent?.name || ""];

  // 如果组件有styleSetter配置且不为空，则添加"其他"分类
  if (
    currentComponentConfig?.styleSetter &&
    currentComponentConfig.styleSetter.length > 0
  ) {
    styleCategories.push({
      title: "其他",
      component: (
        <OtherSetter
          form={form}
          onChange={handleFormValueChange}
          curComponent={curComponent}
          componentConfig={componentConfig}
        />
      ),
    });
  }

  return (
    <div className="overflow-y-auto h-[100%] w-[100%] absolute pb-30 overscroll-y-contain ">
      {styleCategories.map(({ title, component }) => (
        <div key={title} className="mb-4">
          {/* 分类标题 */}
          <div
            className="px-3 py-2 mb-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors duration-200"
            onClick={() => toggleSection(title)}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSections[title] ? "rotate-90" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* 分类内容 */}
          {expandedSections[title] && (
            <div
              className={`transition-all duration-200 ease-in-out ${
                title === "CSS编辑器" ? "" : "pr-9"
              }`}
            >
              {component}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
