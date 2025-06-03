import { create } from "zustand";
import Container from "../materials/Container";
import Button from "../materials/Button";
import Page from "../materials/Page";

export interface ComponentConfig {
  name: string;
  defaultProps: Record<string, any>;
  component: any;
  desc: string;
}

interface State {
  componentConfig: { [key: string]: ComponentConfig };
}
interface Action {
  registerComponent: (name: string, componentConfig: ComponentConfig) => void;
}
export const useComponentConfigStore = create<State & Action>((set) => ({
  componentConfig: {
    Container: {
      name: "Container",
      desc: "容器",
      defaultProps: {},
      component: Container,
    },
    Button: {
      name: "Button",
      desc: "按钮",
      defaultProps: {
        type: "primary",
        text: "按钮",
      },
      component: Button,
    },
    Page: {
      name: "Page",
      desc: "页面",
      defaultProps: {},
      component: Page,
    },
  },
  registerComponent: (name, componentConfig) =>
    set((state) => {
      return {
        ...state,
        componentConfig: {
          ...state.componentConfig,
          [name]: componentConfig,
        },
      };
    }),
}));
