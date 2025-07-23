import type { CSSProperties } from "react";
import type { Component } from "../../../../stores/components";
import BoxModelEditor from "./BoxModelEditor";
import LayoutModal from "./LayoutModal";
import SizeEditor from "./SizeEditor";
import { Divider } from "antd";

interface LayoutProps {
  curComponent: Component;
  onChange?: (css: CSSProperties) => void;
}

const LayoutSetter = (props: LayoutProps) => {
  const { curComponent, onChange } = props;

  return (
    <>
      <Divider orientation="left">布局</Divider>
      <LayoutModal value={curComponent.styles} onChange={onChange} />
      <BoxModelEditor value={curComponent.styles} onChange={onChange} />
      <SizeEditor
        value={curComponent.styles}
        onChange={onChange}
        curComponentId={curComponent.id}
      />
    </>
  );
};

export default LayoutSetter;
