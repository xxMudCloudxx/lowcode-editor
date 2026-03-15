import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Tabs from "../Navigation/Tabs";

describe("Tabs material", () => {
  it("forwards editor drag metadata to the root container", () => {
    const html = renderToStaticMarkup(
      <Tabs
        data-component-id={2001}
        data-component-type="Tabs"
        data-is-container="true"
      />,
    );

    expect(html).toContain('data-component-id="2001"');
    expect(html).toContain('data-component-type="Tabs"');
    expect(html).toContain('data-is-container="true"');
  });
});
