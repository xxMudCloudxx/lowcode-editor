import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Table from "../DataDisplay/Table";

describe("Table material", () => {
  it("forwards editor drag metadata to the root container", () => {
    const html = renderToStaticMarkup(
      <Table
        data-component-id={1001}
        data-component-type="Table"
        data-is-container="true"
      />,
    );

    expect(html).toContain('data-component-id="1001"');
    expect(html).toContain('data-component-type="Table"');
    expect(html).toContain('data-is-container="true"');
  });
});
