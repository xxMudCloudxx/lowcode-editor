import { useMemo, useState } from "react";
import { useComponentConfigStore } from "../../../stores/component-config";
import { MaterialItem } from "./MaterialItem";

const categoryOrder = [
  "基础",
  "布局",
  "数据录入",
  "数据展示",
  "导航",
  "反馈",
  "通用",
  "其他",
];

export function Material() {
  const { componentConfig } = useComponentConfigStore();

  // 管理每个分类的展开/收起状态，默认全部展开
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(
    categoryOrder.reduce(
      (acc, category) => {
        acc[category] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );

  // 切换分类展开状态
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const categorizedComponents = useMemo(() => {
    const components = Object.values(componentConfig).filter(
      (item) => item.name !== "Page",
    );

    // 按分类分组
    const grouped = components.reduce(
      (acc, component) => {
        const category = component.category || "其他";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(component);
        return acc;
      },
      {} as Record<string, typeof components>,
    );

    // 按预定义顺序排序分类
    const sortedCategories = categoryOrder.filter(
      (category) => grouped[category],
    );

    return sortedCategories.map((category) => ({
      category,
      components: grouped[category],
    }));
  }, [componentConfig]);

  return (
    <div className="w-full custom-scrollbar overflow-y-auto absolute overscroll-y-contain pr-6 h-full pb-20">
      {categorizedComponents.map(({ category, components }) => (
        <div key={category} className="mb-6">
          {/* 分类标题 */}
          <div
            className="px-2 pb-2 mb-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors duration-200"
            onClick={() => toggleCategory(category)}
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                {category}
              </h3>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  expandedCategories[category] ? "rotate-90" : ""
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

          {/* 该分类下的组件 */}
          {expandedCategories[category] && (
            <div className="grid grid-cols-2 gap-2 transition-all duration-200 ease-in-out">
              {components.map((item, index) => (
                <MaterialItem
                  name={item.name}
                  key={item.name + index}
                  desc={item.desc}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
