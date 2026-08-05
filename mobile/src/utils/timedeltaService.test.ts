import { TIMEDELTA_SERVICE_ENDPOINT } from "./constants";
import {
  minutesToTimestamp,
  requestScheduledEndTime,
} from "./timedeltaService";

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("minutesToTimestamp", () => {
  it("maps minutes since midnight onto the fixed anchor date", () => {
    // 11:30am = 690 minutes
    expect(minutesToTimestamp(690)).toBe("2000-01-01T11:30:00.000Z");
  });

  it("maps midnight to the anchor itself", () => {
    expect(minutesToTimestamp(0)).toBe("2000-01-01T00:00:00.000Z");
  });
});

describe("requestScheduledEndTime", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("calls fetch with the expected timedelta URL params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        ResultingTimestamp: "2000-01-01T12:30:00.000Z",
      })
    );

    await requestScheduledEndTime(690, 60);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith(`${TIMEDELTA_SERVICE_ENDPOINT}/timedelta?`)).toBe(
      true
    );
    expect(url).toContain(
      `timestamp=${encodeURIComponent("2000-01-01T11:30:00.000Z")}`
    );
    expect(url).toContain("operation=add");
    expect(url).toContain("value=60");
    expect(url).toContain("unit=minutes");
  });

  it("resolves with ResultingTimestamp on a 200 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        ResultingTimestamp: "2000-01-01T12:30:00.000Z",
      })
    );

    await expect(requestScheduledEndTime(690, 60)).resolves.toBe(
      "2000-01-01T12:30:00.000Z"
    );
  });

  it("rejects when the response is non-2xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(400, {
        Error: "Invalid request.",
      })
    );

    await expect(requestScheduledEndTime(690, 60)).rejects.toThrow(
      "Timedelta request failed."
    );
  });

  it("rejects when fetch itself rejects", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(requestScheduledEndTime(690, 60)).rejects.toThrow(
      "Network error"
    );
  });
});
