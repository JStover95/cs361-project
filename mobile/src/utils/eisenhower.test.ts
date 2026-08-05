import { getEisenhowerColor, getQuadrant } from "./eisenhower";

describe("getEisenhowerColor", () => {
  it("returns green for important and urgent (Do)", () => {
    expect(getEisenhowerColor("High", "High")).toBe("green");
  });

  it("returns blue for important and not urgent (Decide)", () => {
    expect(getEisenhowerColor("High", "Low")).toBe("blue");
  });

  it("returns red for not important and urgent (Delegate)", () => {
    expect(getEisenhowerColor("Low", "High")).toBe("red");
  });

  it("returns delete for not important and not urgent (Delete)", () => {
    expect(getEisenhowerColor("Low", "Low")).toBe("delete");
  });
});

describe("getQuadrant", () => {
  it("returns do for important and urgent", () => {
    expect(getQuadrant("High", "High")).toBe("do");
  });

  it("returns decide for important and not urgent", () => {
    expect(getQuadrant("High", "Low")).toBe("decide");
  });

  it("returns delegate for not important and urgent", () => {
    expect(getQuadrant("Low", "High")).toBe("delegate");
  });

  it("returns delete for not important and not urgent", () => {
    expect(getQuadrant("Low", "Low")).toBe("delete");
  });
});
