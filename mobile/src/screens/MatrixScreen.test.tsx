import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import { TasksProvider, useTasks } from "../context/TasksContext";
import {
  GROUPING_SERVICE_ENDPOINT,
  STORAGE_SERVICE_ENDPOINT,
} from "../utils/constants";
import { MatrixScreen } from "./MatrixScreen";

type AsyncStorageMock = typeof AsyncStorage & {
  __reset: () => void;
};

const mockStorage = AsyncStorage as AsyncStorageMock;

let createCounter = 0;
const records = new Map<string, Record<string, unknown>>();

function SeedTasks({
  tasks,
}: {
  tasks: Array<{
    title: string;
    timeRequired: string;
    importance: "High" | "Low";
    urgency: "High" | "Low";
  }>;
}) {
  const { addTask, tasks: current, tasksLoading } = useTasks();
  const [seeded, setSeeded] = useState(tasks.length === 0);

  useEffect(() => {
    if (tasksLoading || seeded || tasks.length === 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      for (const task of tasks) {
        await addTask(task);
      }
      if (!cancelled) {
        setSeeded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tasks, addTask, tasksLoading, seeded]);

  if (!seeded || current.length < tasks.length) {
    return <Text testID="seed-loading">seeding</Text>;
  }

  return <View />;
}

function LoginGate({ children }: { children: React.ReactNode }) {
  const { userId, login } = useAuthContext();
  const { tasksLoading } = useTasks();
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      void login("user@example.com", "secret");
    }
  }, [started, login]);

  useEffect(() => {
    if (userId && !tasksLoading) {
      setReady(true);
    }
  }, [userId, tasksLoading]);

  if (!ready) {
    return <Text testID="gate-loading">loading</Text>;
  }

  return <>{children}</>;
}

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

const seedTasks = [
  {
    title: "Call mom",
    timeRequired: "30m",
    importance: "High" as const,
    urgency: "High" as const,
  },
  {
    title: "Read a book",
    timeRequired: "1h",
    importance: "High" as const,
    urgency: "Low" as const,
  },
  {
    title: "Answer email",
    timeRequired: "15m",
    importance: "Low" as const,
    urgency: "High" as const,
  },
  {
    title: "Browse news",
    timeRequired: "20m",
    importance: "Low" as const,
    urgency: "Low" as const,
  },
];

async function renderMatrix(seed: typeof seedTasks = [], onClose?: () => void) {
  const result = await render(
    <AuthProvider>
      <TasksProvider>
        <LoginGate>
          <SeedTasks tasks={seed} />
          <MatrixScreen onClose={onClose} />
        </LoginGate>
      </TasksProvider>
    </AuthProvider>
  );

  await waitFor(() => {
    expect(result.queryByTestId("gate-loading")).toBeNull();
    expect(result.queryByTestId("seed-loading")).toBeNull();
  });

  return result;
}

function flattenStyle(style: unknown) {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean));
  }
  return (style ?? {}) as Record<string, unknown>;
}

function mockAuthStorageAndGroup(
  groupHandler?: (url: string, options?: RequestInit) => Promise<Response> | Response
) {
  createCounter = 0;
  records.clear();
  return jest.fn(async (url: string, options?: RequestInit) => {
    if (typeof url === "string" && url.includes("/login")) {
      return jsonResponse(200, {
        message: "Login successful.",
        user_id: "user-1",
      });
    }
    if (
      typeof url === "string" &&
      url === `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage` &&
      options?.method === "POST"
    ) {
      createCounter += 1;
      const id = `rec-${createCounter}`;
      const payload = JSON.parse((options.body as string) ?? "{}");
      records.set(id, payload.data);
      return jsonResponse(201, { id });
    }
    if (
      typeof url === "string" &&
      url.startsWith(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
      (options?.method === "GET" || options?.method == null)
    ) {
      const id = url.split("/").pop()!;
      const data = records.get(id);
      if (!data) {
        return jsonResponse(404, { detail: "not found" });
      }
      return jsonResponse(200, {
        id,
        client_id: "MobileAppClient",
        data,
        metadata: {},
      });
    }
    if (
      typeof url === "string" &&
      url.startsWith(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
      options?.method === "DELETE"
    ) {
      const id = url.split("/").pop()!;
      records.delete(id);
      return jsonResponse(200, { message: "deleted" });
    }
    if (typeof url === "string" && url.includes("/group")) {
      if (groupHandler) {
        return groupHandler(url, options);
      }
      const body = JSON.parse((options?.body as string) ?? "{}");
      const groups: Record<string, unknown[]> = {
        do: [],
        decide: [],
        delegate: [],
        delete: [],
      };
      for (const item of body.data ?? []) {
        const key = item.quadrant as string;
        if (groups[key]) {
          groups[key].push(item);
        }
      }
      return jsonResponse(200, { groups });
    }
    return jsonResponse(500, { error: "Unexpected fetch in test" });
  });
}

describe("MatrixScreen", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockStorage.__reset();
    global.fetch = mockAuthStorageAndGroup();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders all four quadrant headers", async () => {
    const { getByText } = await renderMatrix();

    await waitFor(() => {
      expect(getByText("Do")).toBeTruthy();
      expect(getByText("Decide")).toBeTruthy();
      expect(getByText("Delegate")).toBeTruthy();
      expect(getByText("Delete")).toBeTruthy();
    });
  });

  it("on mount calls fetch with the grouping POST body derived from seeded tasks", async () => {
    await renderMatrix(seedTasks);

    await waitFor(() => {
      const groupCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]: [string]) =>
          typeof url === "string" &&
          url === `${GROUPING_SERVICE_ENDPOINT}/group`
      );
      expect(groupCalls.length).toBeGreaterThanOrEqual(1);

      const [, options] = groupCalls[groupCalls.length - 1];
      expect(options.method).toBe("POST");
      const body = JSON.parse(options.body);
      expect(body.attribute).toBe("quadrant");
      expect(body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "Call mom", quadrant: "do" }),
          expect.objectContaining({ title: "Read a book", quadrant: "decide" }),
          expect.objectContaining({
            title: "Answer email",
            quadrant: "delegate",
          }),
          expect.objectContaining({ title: "Browse news", quadrant: "delete" }),
        ])
      );
    });
  });

  it("places a returned task title under its resolved quadrant container", async () => {
    const { getByTestId } = await renderMatrix(seedTasks);

    await waitFor(() => {
      expect(
        within(getByTestId("quadrant-do")).getByText("Call mom")
      ).toBeTruthy();
    });

    expect(
      within(getByTestId("quadrant-decide")).getByText("Read a book")
    ).toBeTruthy();
    expect(
      within(getByTestId("quadrant-delegate")).getByText("Answer email")
    ).toBeTruthy();
    expect(
      within(getByTestId("quadrant-delete")).getByText("Browse news")
    ).toBeTruthy();
  });

  it("bottom-aligns do/decide scroll containers and top-aligns delegate/delete", async () => {
    const { getByTestId } = await renderMatrix(seedTasks);

    await waitFor(() => {
      expect(getByTestId("quadrant-scroll-do")).toBeTruthy();
    });

    expect(
      flattenStyle(getByTestId("quadrant-scroll-do").props.contentContainerStyle)
    ).toEqual(expect.objectContaining({ justifyContent: "flex-end" }));
    expect(
      flattenStyle(
        getByTestId("quadrant-scroll-decide").props.contentContainerStyle
      )
    ).toEqual(expect.objectContaining({ justifyContent: "flex-end" }));

    const delegateStyle = flattenStyle(
      getByTestId("quadrant-scroll-delegate").props.contentContainerStyle
    );
    const deleteStyle = flattenStyle(
      getByTestId("quadrant-scroll-delete").props.contentContainerStyle
    );

    expect(delegateStyle.justifyContent).not.toBe("flex-end");
    expect(deleteStyle.justifyContent).not.toBe("flex-end");
  });

  it("does not render TaskBottomSheet content", async () => {
    const { getByText, queryByText } = await renderMatrix();

    await waitFor(() => {
      expect(getByText("Do")).toBeTruthy();
    });

    expect(queryByText("+")).toBeNull();
  });

  it("tapping a task card does not open an edit form", async () => {
    const { getByText, queryByText } = await renderMatrix(seedTasks);

    await waitFor(() => {
      expect(getByText("Call mom")).toBeTruthy();
    });

    await fireEvent.press(getByText("Call mom"));

    expect(queryByText("Save")).toBeNull();
    expect(queryByText("Cancel")).toBeNull();
    expect(queryByText("Importance")).toBeNull();
  });

  it("tapping the active View Matrix button calls onClose", async () => {
    const onClose = jest.fn();
    const { getByText, getByRole } = await renderMatrix([], onClose);

    await waitFor(() => {
      expect(getByText("View Matrix")).toBeTruthy();
    });

    const button = getByRole("button", { name: "View Matrix" });
    const flatStyle = flattenStyle(button.props.style);
    expect(flatStyle.backgroundColor).toBe("#000");

    await fireEvent.press(getByText("View Matrix"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an ErrorModal with retry when the grouping fetch fails, and retrying re-issues the request", async () => {
    let shouldFail = true;
    let groupCallCount = 0;
    global.fetch = mockAuthStorageAndGroup(async (url: string) => {
      if (typeof url === "string" && url.includes("/group")) {
        groupCallCount += 1;
        if (shouldFail) {
          return jsonResponse(500, { error: "boom" });
        }
        return jsonResponse(200, {
          groups: { do: [], decide: [], delegate: [], delete: [] },
        });
      }
      return jsonResponse(500, { error: "Unexpected" });
    });

    const { getByText, queryByText } = await renderMatrix(seedTasks);

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
    });

    expect(getByText("Try Again")).toBeTruthy();
    const callsBeforeRetry = groupCallCount;
    expect(callsBeforeRetry).toBeGreaterThanOrEqual(1);

    shouldFail = false;
    await fireEvent.press(getByText("Try Again"));

    await waitFor(() => {
      expect(queryByText("An error occured!")).toBeNull();
    });
    expect(groupCallCount).toBeGreaterThan(callsBeforeRetry);
  });
});
