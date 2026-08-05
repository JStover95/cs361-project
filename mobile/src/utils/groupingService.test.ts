import { Task } from "../types/task";
import { GROUPING_SERVICE_ENDPOINT } from "./constants";
import { groupTasksByQuadrant } from "./groupingService";

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

const sampleTasks: Task[] = [
  {
    id: "task-1",
    userId: "user-1",
    title: "Call mom",
    timeRequired: "30m",
    importance: "High",
    urgency: "High",
  },
  {
    id: "task-2",
    userId: "user-1",
    title: "Read a book",
    timeRequired: "1h",
    importance: "High",
    urgency: "Low",
  },
  {
    id: "task-3",
    userId: "user-1",
    title: "Answer email",
    timeRequired: "15m",
    importance: "Low",
    urgency: "High",
  },
  {
    id: "task-4",
    userId: "user-1",
    title: "Browse news",
    timeRequired: "20m",
    importance: "Low",
    urgency: "Low",
  },
];

describe("groupTasksByQuadrant", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("posts to the grouping endpoint with tasks annotated by quadrant", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        groups: {
          do: [{ ...sampleTasks[0], quadrant: "do" }],
          decide: [{ ...sampleTasks[1], quadrant: "decide" }],
          delegate: [{ ...sampleTasks[2], quadrant: "delegate" }],
          delete: [{ ...sampleTasks[3], quadrant: "delete" }],
        },
      })
    );

    await groupTasksByQuadrant(sampleTasks);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`${GROUPING_SERVICE_ENDPOINT}/group`);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });

    const body = JSON.parse(options.body);
    expect(body.attribute).toBe("quadrant");
    expect(body.data).toEqual([
      { ...sampleTasks[0], quadrant: "do" },
      { ...sampleTasks[1], quadrant: "decide" },
      { ...sampleTasks[2], quadrant: "delegate" },
      { ...sampleTasks[3], quadrant: "delete" },
    ]);
  });

  it("returns tasks bucketed under do/decide/delegate/delete, defaulting missing keys to []", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        groups: {
          do: [{ ...sampleTasks[0], quadrant: "do" }],
          decide: [{ ...sampleTasks[1], quadrant: "decide" }],
        },
      })
    );

    const result = await groupTasksByQuadrant(sampleTasks);

    expect(result.do).toHaveLength(1);
    expect(result.do[0].title).toBe("Call mom");
    expect(result.decide).toHaveLength(1);
    expect(result.decide[0].title).toBe("Read a book");
    expect(result.delegate).toEqual([]);
    expect(result.delete).toEqual([]);
  });

  it("throws when the response is non-2xx", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(400, { error: "Invalid request." })
    );

    await expect(groupTasksByQuadrant(sampleTasks)).rejects.toThrow(
      "Grouping request failed."
    );
  });

  it("throws when the response is missing groups", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, { notGroups: {} })
    );

    await expect(groupTasksByQuadrant(sampleTasks)).rejects.toThrow(
      "Grouping request failed."
    );
  });

  it("rejects when fetch itself rejects", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(groupTasksByQuadrant(sampleTasks)).rejects.toThrow(
      "Network error"
    );
  });
});
