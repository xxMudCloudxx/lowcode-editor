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
import { useComponetsStore } from "../../../stores/components";
import { useComponentConfigStore } from "../../../stores/component-config";
import { useEffect, useState, type CSSProperties } from "react";
import CssEditor from "../CssEditor";
import { debounce } from "lodash-es";
import StyleToObject from "style-to-object"; // 用于将 CSS 字符串解析为 JS 对象
import LayoutSetter from "./LayoutSetter";
import FrontSetter from "./FrontSetter";
import BackGroundSetter from "./BackGroundSetter";
import LocationSetter from "./LocationSetter";
import BoardSetter from "./BoardSetter/indx";
import OtherSetter from "./OtherSetter";

export function ComponentStyle() {
  const [form] = Form.useForm();

  const { curComponentId, curComponent, updateComponentStyles } =
    useComponetsStore();
  const { componentConfig } = useComponentConfigStore();

  // State: 存储 CSS 编辑器中的文本内容
  const [css, setCss] = useState<string>(`.comp{\n\n}`);
  
  // 管理各个样式分类的展开/收起状态，默认全部展开
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "CSS编辑器": true,
    "布局": true,
    "文字": true,
    "背景": true,
    "位置": true,
    "边框": true,
    "其他": true
  });
  
  // 切换分类展开状态
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    form.resetFields();

    const data = form.getFieldsValue();
    form.setFieldsValue({
      ...data,
      ...curComponent?.styles,
    });

    setCss(toCSSStr(curComponent?.styles || {}));
  }, [curComponent, form]);

  if (!curComponentId || !curComponent) return null;

  function valueChange(changeValues: CSSProperties) {
    if (curComponentId) {
      updateComponentStyles(curComponentId, changeValues);
    }
  }

  /**
   * @description 将 style 对象转换为格式化的 CSS 字符串。
   */
  function toCSSStr(css: Record<string, any>) {
    let str = `.comp {\n`;
    for (const key in css) {
      let value = css[key];
      if (!value) {
        continue;
      }
      // 将驼峰式 key 转换为横杠式
      const cssKey = key.replace(
        /[A-Z]/g,
        (match) => `-${match.toLocaleLowerCase()}`
      );
      if (
        ["width", "height"].includes(key) &&
        !value.toString().endsWith("px")
      ) {
        value += "px";
      }

      str += `\t${cssKey}: ${value};\n`;
    }
    str += `}`;
    return str;
  }

  /**
   * @description CSS 编辑器内容变化时的回调，使用防抖优化性能。
   */
  const handleEditorChange = debounce((value) => {
    let css: Record<string, any> = {};

    try {
      // 提取 CSS 规则内容
      const cssStr = value
        .replace(/\/\*.*\*\//, "") // 去掉注释 /** */
        .replace(/(\.?[^{]+{)/, "") // 去掉 .comp {
        .replace("}", ""); // 去掉 }

      StyleToObject(cssStr, (name, value) => {
        css[
          // 将 kebab-case (如 a-b) 转换为 camelCase (如 aB)
          name.replace(/-\w/, (item) => item.toUpperCase().replace("-", ""))
        ] = value;
      });

      // 调用 store action 更新样式，`true` 表示完全替换旧样式
      updateComponentStyles(
        curComponentId,
        { ...form.getFieldsValue(), ...css },
        true
      );
    } catch (e) {
      console.error("CSS parsing error:", e);
    }
  }, 500);

  // 样式分类配置
  const styleCategories = [
    {
      title: "CSS编辑器",
      component: (
        <div className=" border-[1px] border-[#ccc] h-[200px]">
          <CssEditor value={css} onSave={handleEditorChange} />
        </div>
      )
    },
    {
      title: "布局",
      component: <LayoutSetter curComponent={curComponent} onChange={valueChange} />
    },
    {
      title: "文字",
      component: <FrontSetter curComponent={curComponent} onChange={valueChange} />
    },
    {
      title: "背景",
      component: <BackGroundSetter curComponent={curComponent} onChange={valueChange} />
    },
    {
      title: "位置",
      component: <LocationSetter curComponent={curComponent} onChange={valueChange} />
    },
    {
      title: "边框",
      component: <BoardSetter curComponent={curComponent} onChange={valueChange} />
    }
  ];
  
  // 获取当前组件的配置
  const currentComponentConfig = componentConfig[curComponent?.name || ''];
  
  // 如果组件有styleSetter配置且不为空，则添加"其他"分类
  if (currentComponentConfig?.styleSetter && currentComponentConfig.styleSetter.length > 0) {
    styleCategories.push({
      title: "其他",
      component: (
        <OtherSetter
          form={form}
          onChange={valueChange}
          curComponent={curComponent}
          componentConfig={componentConfig}
        />
      )
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
              <h3 className="text-sm font-semibold text-gray-700">
                {title}
              </h3>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedSections[title] ? 'rotate-90' : ''
                }`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* 分类内容 */}
          {expandedSections[title] && (
            <div className={`transition-all duration-200 ease-in-out ${title === "CSS编辑器" ? "" : "pr-9"}`}>
              {component}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
