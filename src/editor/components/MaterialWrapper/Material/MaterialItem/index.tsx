import { useDrag } from "react-dnd";

export interface MaterialItemProps {
  name: string;
  desc: string;
}

export function MaterialItem(props: MaterialItemProps) {
  const { name, desc } = props;

  const [_, drag] = useDrag({
    type: name,
    item: {
      type: name,
    },
  });
  return (
    <div
      ref={drag}
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
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
