// 自定义箭头图标
export const ArrowIcon = ({ isActive }: { isActive?: boolean }) => (
  <div className="flex items-start justify-center w-8 h-6 mt-4 -mr-1">
    <svg
      className={`w-5 h-5 text-gray-700 transition-transform duration-200 ${
        isActive ? "rotate-90" : ""
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M9 5l7 7-7 7"
      />
    </svg>
  </div>
);
