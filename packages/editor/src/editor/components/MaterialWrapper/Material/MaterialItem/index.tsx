import { useDrag } from "react-dnd";
import { simulatorHost } from "../../../../simulator/SimulatorHost";
import { useComponentConfigStore } from "../../../../stores/component-config";

export interface MaterialItemProps {
  name: string;
  desc: string;
}

export function MaterialItem(props: MaterialItemProps) {
  const { name, desc } = props;
  const { componentConfig } = useComponentConfigStore();

  const [_, drag] = useDrag({
    type: name,
    item: {
      type: name,
    },
  });

  /**
   * 原生拖拽桥接：当从物料区开始拖拽时，
   * 通过 dataTransfer 设置数据以使浏览器允许 drop 到 iframe，
   * 同时通过 postMessage 旁路发送完整的物料 schema。
   */
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", `lowcode-component:${name}`);
    e.dataTransfer.effectAllowed = "copy";

    const config = componentConfig[name];
    if (config) {
      simulatorHost.sendDragStartMetadata({
        componentName: name,
        defaultProps: config.defaultProps ?? {},
        desc: config.desc,
      });
    }
  };

  const handleDragEnd = () => {
    simulatorHost.sendDragEnd();
  };

  return (
    <div
      ref={drag}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="
        custom-card
        p-3 m-2 cursor-move
        border border-gray-200
        bg-white
        hover:border-indigo-300
        hover:shadow-lg
        hover:scale-105
        active:scale-95
        transition-all duration-200 ease-in-out
        group
        rounded-lg
      "
    >
      <div className="flex items-center justify-between">
        {/* 文本区域 */}
        <div className="flex-1">
          <div className="font-medium text-gray-800 text-sm">{desc}</div>
          <div className="text-xs text-gray-500 mt-1">{name}</div>
        </div>

        {/* 拖拽指示器 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
