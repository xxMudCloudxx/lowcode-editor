import { describe, expect, it } from "vitest";
import TabsProtocol from "../Navigation/Tabs/meta";

describe("Tabs protocol", () => {
  it("allows native interaction in editor so tab switching works", () => {
    expect(TabsProtocol.editor.interactiveInEditor).toBe(true);
  });
});
