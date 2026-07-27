import { validateTask } from "./validateTask";

describe("validateTask", () => {
  it("returns error when any field is empty", () => {
    expect(
      validateTask({
        title: "",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      })
    ).toBe("All fields are required.");

    expect(
      validateTask({
        title: "Call mom",
        timeRequired: "",
        importance: "High",
        urgency: "High",
      })
    ).toBe("All fields are required.");

    expect(
      validateTask({
        title: "Call mom",
        timeRequired: "30m",
        importance: "",
        urgency: "High",
      })
    ).toBe("All fields are required.");

    expect(
      validateTask({
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "",
      })
    ).toBe("All fields are required.");
  });

  it("accepts valid time formats", () => {
    const base = {
      title: "Call mom",
      importance: "High" as const,
      urgency: "High" as const,
    };

    expect(validateTask({ ...base, timeRequired: "1h" })).toBeNull();
    expect(validateTask({ ...base, timeRequired: "30m" })).toBeNull();
    expect(validateTask({ ...base, timeRequired: "1h 30m" })).toBeNull();
    expect(validateTask({ ...base, timeRequired: "2hr 15m" })).toBeNull();
  });

  it("rejects invalid time formats", () => {
    expect(
      validateTask({
        title: "Call mom",
        timeRequired: "half an hour",
        importance: "High",
        urgency: "High",
      })
    ).toBe("Time required must be a valid format (e.g. 1h, 30m, or 1h 30m).");
  });
});
