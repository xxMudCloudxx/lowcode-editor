import { describe, it, expect } from "vitest";
import { isIRActionArray, buildIrNodeMap } from "../../../src/utils/ir-helper";
import { createIRNode } from "../../helpers/factory";

// ============================================================
// isIRActionArray
// ============================================================
describe("isIRActionArray", () => {
  it("should return false for null / undefined", () => {
    expect(isIRActionArray(null)).toBe(false);
    expect(isIRActionArray(undefined)).toBe(false);
  });

  it("should return false for an empty array", () => {
    expect(isIRActionArray([])).toBe(false);
  });

  it("should return false for a non-Action array", () => {
    expect(isIRActionArray([{ type: "Literal", value: 1 }])).toBe(false);
    expect(isIRActionArray(["hello"])).toBe(false);
    expect(isIRActionArray([42])).toBe(false);
  });

  it("should return true for a single Action array", () => {
    const actions = [
      { type: "Action", actionType: "navigateTo", config: { url: "/" } },
    ];
    expect(isIRActionArray(actions)).toBe(true);
  });

  it("should return true for a multi-Action array", () => {
    const actions = [
      { type: "Action", actionType: "navigateTo", config: {} },
      { type: "Action", actionType: "customJS", config: {} },
    ];
    expect(isIRActionArray(actions)).toBe(true);
  });

  it("should return false for a plain object (not array)", () => {
    expect(
      isIRActionArray({ type: "Action", actionType: "x", config: {} }),
    ).toBe(false);
  });
});

// ============================================================
// buildIrNodeMap
// ============================================================
describe("buildIrNodeMap", () => {
  it("should index a single flat node", () => {
    const node = createIRNode({ id: "a" });
    const map = new Map();
    buildIrNodeMap(node, map);

    expect(map.size).toBe(1);
    expect(map.get("a")).toBe(node);
  });

  it("should recursively index children", () => {
    const child1 = createIRNode({ id: "c1" });
    const child2 = createIRNode({ id: "c2" });
    const root = createIRNode({ id: "root", children: [child1, child2] });

    const map = new Map();
    buildIrNodeMap(root, map);

    expect(map.size).toBe(3);
    expect(map.get("root")).toBe(root);
    expect(map.get("c1")).toBe(child1);
    expect(map.get("c2")).toBe(child2);
  });

  it("should index JSSlot nodes inside props (single)", () => {
    const slotNode = createIRNode({ id: "slot_1", componentName: "Icon" });
    const root = createIRNode({
      id: "root",
      props: { icon: slotNode as any },
    });

    const map = new Map();
    buildIrNodeMap(root, map);

    expect(map.size).toBe(2);
    expect(map.get("slot_1")).toBe(slotNode);
  });

  it("should index JSSlot nodes inside props (array)", () => {
    const slot1 = createIRNode({ id: "s1", componentName: "Tab" });
    const slot2 = createIRNode({ id: "s2", componentName: "Tab" });
    const root = createIRNode({
      id: "root",
      props: { tabs: [slot1, slot2] as any },
    });

    const map = new Map();
    buildIrNodeMap(root, map);

    expect(map.size).toBe(3);
    expect(map.get("s1")).toBe(slot1);
    expect(map.get("s2")).toBe(slot2);
  });

  it("should handle deeply nested tree", () => {
    const leaf = createIRNode({ id: "leaf" });
    const mid = createIRNode({ id: "mid", children: [leaf] });
    const root = createIRNode({ id: "root", children: [mid] });

    const map = new Map();
    buildIrNodeMap(root, map);

    expect(map.size).toBe(3);
    expect(map.get("leaf")).toBe(leaf);
  });
});
