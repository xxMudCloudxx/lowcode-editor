import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RendererDraggableNode } from "./RendererDraggableNode";

describe("RendererDraggableNode", () => {
  it("injects stable editor classes and preserves existing className", () => {
    render(
      <RendererDraggableNode id={2} name="Card" isContainer>
        <div className="existing-node">content</div>
      </RendererDraggableNode>,
    );

    const node = screen.getByText("content");
    expect(node.className).toContain("existing-node");
    expect(node.className).toContain("editor-node");
    expect(node.className).toContain("editor-container");
    expect(node.className).toContain("editor-type-card");
  });
});
