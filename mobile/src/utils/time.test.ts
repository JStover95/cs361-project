import { getDurationMinutes } from "./time";

describe("getDurationMinutes", () => {
  it("parses hours only", () => {
    expect(getDurationMinutes("1h")).toBe(60);
  });

  it("parses minutes only", () => {
    expect(getDurationMinutes("30m")).toBe(30);
  });

  it("parses hours and minutes", () => {
    expect(getDurationMinutes("1h 30m")).toBe(90);
  });

  it("parses hour abbreviation with minutes", () => {
    expect(getDurationMinutes("2hr 15m")).toBe(135);
  });
});
