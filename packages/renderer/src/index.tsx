 
import React, { Suspense } from "react";
import type { Component, ComponentProtocol } from "@lowcode/schema";
import { materials } from "@lowcode/materials";

interface RendererProps {
  component: Component;
}

const materialMap = new Map<string, ComponentProtocol>(
  materials.map((m) => [m.name, m]),
);

export const Renderer: React.FC<RendererProps> = ({ component }) => {
  const { name, props, children, id } = component;
  const material = materialMap.get(name);

  if (!material) {
    return <div>Component {name} not found</div>;
  }

  const ComponentToRender = material.runtimeComponent || material.component;

  // 递归渲染子组件
  // 注意：这里假设 children 是 Component[]，实际项目中可能是 id[] 需要结合 store 获取
  // 为了从简，这里先假设 component 结构体已经包含了完整的 children 树，或者我们在上层做了转换
  // 在当前 store 设计中，children 是 number[]，所以 Renderer 需要配合 Store 使用
  // 但为了解耦，Renderer 最好只接受标准 Tree 结构

  // 临时：如果 children 是 id 数组，这里无法渲染，需要上层转换。
  // 我们先假设传入的 component 是已经转换好的树状结构 ComponentTree (在 schema/component.ts 中定义)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentToRender {...props} id={id}>
        {Array.isArray(children) &&
          children.map((child: any) => (
            <Renderer key={child.id} component={child} />
          ))}
      </ComponentToRender>
    </Suspense>
  );
};
