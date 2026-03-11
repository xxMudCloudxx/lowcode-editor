import { describe, it, expect, beforeEach } from "vitest";
import { runStateLifter } from "../../../src/preprocessor/state-lifter";
import {
  createIRNode,
  createIRPage,
  createIRProject,
  createRegistry,
  createDescriptor,
  createDependency,
} from "../../helpers/factory";
import type { CodeGenRegistry } from "../../../src/registry/codegen-registry";
import type { IRAction, IRStateRef, IRMethodRef } from "@lowcode/schema";

let registry: CodeGenRegistry;

beforeEach(() => {
  // 注册 Modal 组件，包含 open/close methods + stateBinding
  registry = createRegistry([
    createDescriptor({
      name: "Page",
      dependency: createDependency({ package: "", destructuring: false }),
      isContainer: true,
    }),
    createDescriptor({ name: "Button" }),
    createDescriptor({
      name: "Modal",
      dependency: createDependency({ exportName: "Modal" }),
      methods: [
        {
          name: "open",
          stateBinding: { prop: "visible", value: true },
        },
        {
          name: "close",
          stateBinding: { prop: "visible", value: false },
          eventBinding: "onCancel",
        },
      ],
    }),
  ]);
});

describe("runStateLifter", () => {
  it("should return IR unchanged when no componentMethod actions exist", () => {
    const page = createIRPage({
      node: createIRNode({
        id: "root",
        componentName: "Page",
        children: [
          createIRNode({
            id: "btn_1",
            componentName: "Button",
            props: {
              onClick: {
                type: "Action",
                actionType: "navigateTo",
                config: { url: "/" },
              } as IRAction,
            },
          }),
        ],
      }),
    });
    const project = createIRProject({ pages: [page] });

    const result = runStateLifter(project, registry);

    // 原 action 不变
    const btn = result.pages[0].node.children![0];
    expect((btn.props.onClick as IRAction).actionType).toBe("navigateTo");
    // 不应注入 states/methods
    expect(result.pages[0].states).toBeUndefined();
  });

  it("should lift componentMethod to page-level state and method", () => {
    const modalId = "modal_100";
    const modal = createIRNode({
      id: modalId,
      componentName: "Modal",
      props: {},
    });
    const button = createIRNode({
      id: "btn_1",
      componentName: "Button",
      props: {
        onClick: {
          type: "Action",
          actionType: "componentMethod",
          config: { componentId: modalId, method: "open" },
        } as IRAction,
      },
    });
    const page = createIRPage({
      node: createIRNode({
        id: "root",
        componentName: "Page",
        children: [button, modal],
      }),
    });
    const project = createIRProject({ pages: [page] });

    const result = runStateLifter(project, registry);
    const resultPage = result.pages[0];

    // 1. page.states 应被注入 visible_modal_100
    expect(resultPage.states).toBeDefined();
    const stateKey = `visible_${modalId}`;
    expect(resultPage.states![stateKey]).toEqual({
      type: "Literal",
      value: false,
    });

    // 2. page.methods 应被注入 handleOpen_modal_100
    expect(resultPage.methods).toBeDefined();
    const methodKey = `handleOpen_${modalId}`;
    expect(resultPage.methods![methodKey]).toBeDefined();
    expect(resultPage.methods![methodKey].type).toBe("StateUpdater");
    expect(resultPage.methods![methodKey].stateName).toBe(stateKey);
    expect(resultPage.methods![methodKey].value).toBe(true);

    // 3. Modal 的 visible prop 应被绑定为 StateRef
    const resultModal = resultPage.node.children![1];
    expect((resultModal.props.visible as IRStateRef).type).toBe("StateRef");
    expect((resultModal.props.visible as IRStateRef).stateName).toBe(stateKey);

    // 4. 原 action 应被替换为 callMethod
    const resultBtn = resultPage.node.children![0];
    expect((resultBtn.props.onClick as IRAction).actionType).toBe("callMethod");
  });

  it("should auto-bind close method to onCancel event", () => {
    const modalId = "modal_200";
    const modal = createIRNode({
      id: modalId,
      componentName: "Modal",
      props: {},
    });
    const button = createIRNode({
      id: "btn_2",
      componentName: "Button",
      props: {
        onClick: {
          type: "Action",
          actionType: "componentMethod",
          config: { componentId: modalId, method: "open" },
        } as IRAction,
      },
    });
    const page = createIRPage({
      node: createIRNode({
        id: "root",
        componentName: "Page",
        children: [button, modal],
      }),
    });
    const project = createIRProject({ pages: [page] });

    const result = runStateLifter(project, registry);
    const resultModal = result.pages[0].node.children![1];

    // Modal 的 onCancel 应被自动绑定
    expect(resultModal.props.onCancel).toBeDefined();
    expect((resultModal.props.onCancel as IRMethodRef).type).toBe("MethodRef");
    expect((resultModal.props.onCancel as IRMethodRef).methodName).toBe(
      `handleClose_${modalId}`,
    );
  });

  it("should handle missing target component gracefully", () => {
    const button = createIRNode({
      id: "btn_3",
      componentName: "Button",
      props: {
        onClick: {
          type: "Action",
          actionType: "componentMethod",
          config: { componentId: "non_existent_id", method: "open" },
        } as IRAction,
      },
    });
    const page = createIRPage({
      node: createIRNode({
        id: "root",
        componentName: "Page",
        children: [button],
      }),
    });
    const project = createIRProject({ pages: [page] });

    // 不应抛异常
    const result = runStateLifter(project, registry);

    // action 应被过滤掉（返回 null -> filter）
    const resultBtn = result.pages[0].node.children![0];
    // onClick 可能变成空数组或被移除
    const onClick = resultBtn.props.onClick;
    if (Array.isArray(onClick)) {
      expect(onClick).toHaveLength(0);
    }
  });

  it("should handle component without stateBinding gracefully", () => {
    // 注册一个没有 stateBinding 的组件
    registry.registerDescriptors([
      createDescriptor({
        name: "Drawer",
        dependency: createDependency({ exportName: "Drawer" }),
        methods: [{ name: "open" }], // 无 stateBinding
      }),
    ]);

    const drawer = createIRNode({
      id: "drawer_1",
      componentName: "Drawer",
      props: {},
    });
    const button = createIRNode({
      id: "btn_4",
      componentName: "Button",
      props: {
        onClick: {
          type: "Action",
          actionType: "componentMethod",
          config: { componentId: "drawer_1", method: "open" },
        } as IRAction,
      },
    });

    const page = createIRPage({
      node: createIRNode({
        id: "root",
        componentName: "Page",
        children: [button, drawer],
      }),
    });
    const project = createIRProject({ pages: [page] });

    // 不应抛异常
    const result = runStateLifter(project, registry);
    expect(result.pages[0].states).toBeUndefined();
  });
});
