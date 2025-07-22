import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import BoxModelEditor from "./BoxModelEditor";
import LayoutModal from "./LayoutModal";
import SizeEditor from "./SizeEditor";

interface LayoutProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const LayoutSetter = (props: LayoutProps) => {
  const { curComponent, onChange } = props;

  return (
    <div className="ml-6">
      <LayoutModal value={curComponent.styles} onChange={onChange} />
      <BoxModelEditor value={curComponent.styles} onChange={onChange} />
      <SizeEditor
        value={curComponent.styles}
        onChange={onChange}
        curComponentId={curComponent.id}
      />
    </div>
  );
};

export default LayoutSetter;
