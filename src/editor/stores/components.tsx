import type { CSSProperties } from "react";
import { create } from "zustand";

export interface Component {
  id: number;
  name: string;
  props: any;
  desc: string;
  children?: Component[];
  parentId?: number;
  styles?: CSSProperties;
}

interface State {
  components: Component[];
  mode: "edit" | "preview";
  curComponentId?: number | null;
  curComponent: Component | null;
}

interface Action {
  addComponent: (Component: Component, parentId?: number) => void;
  deleteComponent: (ComponentId: number) => void;
  updateComponentProps: (ComponentId: number, props: any) => void;
  updateComponentStyles: (
    ComponentId: number,
    styles: CSSProperties,
    replace?: boolean
  ) => void;
  setCurComponentId: (componetId: number | null) => void;
  setMode: (mode: State["mode"]) => void;
}

export const useComponetsStore = create<State & Action>((set, get) => ({
  components: [
    {
      id: 1,
      name: "Page",
      props: {},
      desc: "页面",
    },
  ],
  curComponent: null,
  curComponentId: null,
  mode: "edit",
  setMode: (mode) => set({ mode }),
  updateComponentStyles: (ComponentId, styles, replace) =>
    set((state) => {
      const component = getComponentById(ComponentId, state.components);
      if (component) {
        component.styles = replace
          ? { ...styles }
          : { ...component.styles, ...styles };
        return { components: [...state.components] };
      }

      return { components: [...state.components] };
    }),

  setCurComponentId: (comId) =>
    set((state) => ({
      curComponent: getComponentById(comId, state.components),
      curComponentId: comId,
    })),
  addComponent: (component, parentId) =>
    set((state) => {
      if (parentId) {
        const parentComponent = getComponentById(parentId, state.components);

        if (parentComponent) {
          if (parentComponent.children) {
            parentComponent.children.push(component);
          } else {
            parentComponent.children = [component];
          }
        }

        component.parentId = parentId;
        return { components: [...state.components] };
      }
      return { components: [...state.components, component] };
    }),
  deleteComponent: (componentId) => {
    if (!componentId) return;

    const component = getComponentById(componentId, get().components);
    if (component?.parentId) {
      const parentComponent = getComponentById(
        component.parentId,
        get().components
      );

      if (parentComponent) {
        parentComponent.children = parentComponent?.children?.filter(
          (item) => item.id !== +componentId
        );

        set({ components: [...get().components] });
      }
    }
  },
  updateComponentProps: (componentId, props) =>
    set((state) => {
      const component = getComponentById(componentId, state.components);
      if (component) {
        component.props = { ...component.props, ...props };

        return { components: [...state.components] };
      }

      return { components: [...state.components] };
    }),
}));

export function getComponentById(
  id: number | null,
  components: Component[]
): Component | null {
  if (id === null) return null;

  for (const component of components) {
    if (component.id === id) return component;

    const result = getComponentById(id, component.children ?? []);
    if (result) return result;
  }

  return null;
}
