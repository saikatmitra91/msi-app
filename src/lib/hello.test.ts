import { describe, expect, it } from "vitest";
import { greeting } from "./hello";

describe("greeting", () => {
  it("returns hello, world for empty input", () => {
    expect(greeting("")).toBe("Hello, world!");
    expect(greeting("   ")).toBe("Hello, world!");
  });

  it("greets the provided name", () => {
    expect(greeting("CEO")).toBe("Hello, CEO!");
  });
});
