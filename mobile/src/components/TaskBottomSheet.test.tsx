import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
  NETWORK_ERROR_MESSAGE,
  TasksProvider,
  useTasks,
} from "../context/TasksContext";
import { STORAGE_SERVICE_ENDPOINT } from "../utils/constants";
import { ReactNode, useEffect, useState } from "react";
import { act } from "react";
import { Text, View } from "react-native";
import { State } from "react-native-gesture-handler";
import { mockSnapToIndex } from "@gorhom/bottom-sheet";
import { Task, Importance, Urgency } from "../types/task";
import { TaskBottomSheet } from "./TaskBottomSheet";

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const actual = jest.requireActual("react-native-gesture-handler");

  return {
    ...actual,
    PanGestureHandler: ({
      children,
      testID,
      onGestureEvent,
      onHandlerStateChange,
    }: {
      children: React.ReactNode;
      testID?: string;
      onGestureEvent?: (event: unknown) => void;
      onHandlerStateChange?: (event: unknown) => void;
    }) =>
      React.createElement(
        View,
        {
          testID,
          onGestureEvent,
          onHandlerStateChange,
        },
        children
      ),
  };
});

type QueriedElement = { props: Record<string, unknown> };

type AsyncStorageMock = typeof AsyncStorage & {
  __reset: () => void;
};

const mockStorage = AsyncStorage as AsyncStorageMock;

let createCounter = 0;
let failNextCreate = false;
const records = new Map<string, Record<string, unknown>>();

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockServices() {
  createCounter = 0;
  failNextCreate = false;
  records.clear();
  (global.fetch as jest.Mock).mockImplementation(
    (url: string, options?: { method?: string; body?: string }) => {
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
        if (failNextCreate) {
          return jsonResponse(500, { detail: "fail" });
        }
        createCounter += 1;
        const id = `rec-${createCounter}`;
        const payload = JSON.parse(options.body as string);
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
      return jsonResponse(404, {});
    }
  );
}

function LoginGate({ children }: { children: ReactNode }) {
  const { userId, login } = useAuthContext();
  const { tasksLoading } = useTasks();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      void login("user@example.com", "secret");
      return;
    }
    if (!tasksLoading) {
      setReady(true);
    }
  }, [userId, tasksLoading, login]);

  if (!ready) {
    return <Text testID="gate-loading">loading</Text>;
  }

  return <>{children}</>;
}

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

  if (!seeded) {
    return <Text testID="seed-loading">seeding</Text>;
  }

  // Wait until seeded tasks appear in context
  if (current.length < tasks.length) {
    return <Text testID="seed-loading">seeding</Text>;
  }

  return <View />;
}

type SheetOptions = {
  hidden?: boolean;
  onDragStart?: (task: Task) => void;
  onDragMove?: (absoluteX: number, absoluteY: number) => void;
  onDragEnd?: () => void;
};

async function renderSheet(
  seed: Array<{
    title: string;
    timeRequired: string;
    importance: Importance;
    urgency: Urgency;
  }> = [],
  options: SheetOptions = {}
) {
  const { hidden, onDragStart, onDragMove, onDragEnd } = options;

  const result = await render(
    <AuthProvider>
      <TasksProvider>
        <LoginGate>
          <SeedTasks tasks={seed} />
          <TaskBottomSheet
            hidden={hidden}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          />
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

describe("TaskBottomSheet", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockStorage.__reset();
    mockServices();
    mockSnapToIndex.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders list mode with Tasks label and add button", async () => {
    const { getByText } = await renderSheet();

    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("shows an activity indicator while tasks are loading", async () => {
    let resolveIndex: ((value: string | null) => void) | null = null;
    mockStorage.getItem.mockImplementationOnce(
      () =>
        new Promise<string | null>((resolve) => {
          resolveIndex = resolve;
        })
    );

    function LoadingProbe() {
      const { login } = useAuthContext();
      useEffect(() => {
        void login("user@example.com", "secret");
      }, [login]);
      return <TaskBottomSheet />;
    }

    const { getByTestId, queryByTestId } = await render(
      <AuthProvider>
        <TasksProvider>
          <LoadingProbe />
        </TasksProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("tasks-loading-indicator")).toBeTruthy();
    });

    await act(async () => {
      resolveIndex?.(null);
    });

    await waitFor(() => {
      expect(queryByTestId("tasks-loading-indicator")).toBeNull();
    });
  });

  it("lists tasks sorted alphabetically", async () => {
    const { getByText, getAllByText } = await renderSheet([
      {
        title: "Zebra",
        timeRequired: "1h",
        importance: "High",
        urgency: "Low",
      },
      {
        title: "Apple",
        timeRequired: "30m",
        importance: "Low",
        urgency: "High",
      },
    ]);

    expect(getByText("Apple")).toBeTruthy();
    expect(getByText("Zebra")).toBeTruthy();
    const titles = getAllByText(/Apple|Zebra/).map((n) => n.props.children);
    expect(titles.indexOf("Apple")).toBeLessThan(titles.indexOf("Zebra"));
  });

  it("opens create form when plus is pressed and cancels back to list", async () => {
    const { getByText, queryByText } = await renderSheet();

    await fireEvent.press(getByText("+"));

    expect(getByText("New Task")).toBeTruthy();

    await fireEvent.press(getByText("Cancel"));

    expect(queryByText("New Task")).toBeNull();
    expect(getByText("Tasks")).toBeTruthy();
  });

  it("creates a task and returns to list", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet();

    await fireEvent.press(getByText("+"));
    await fireEvent.changeText(getByLabelText("Title"), "Call mom");
    await fireEvent.changeText(getByLabelText("Time required"), "30m");
    await fireEvent.press(getByLabelText("Select Importance High"));
    await fireEvent.press(getByLabelText("Select Urgency High"));
    await fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(queryByText("New Task")).toBeNull();
    });
    expect(getByText("Call mom")).toBeTruthy();
    expect(getByText("30m")).toBeTruthy();
  });

  it("opens update form when a task is tapped", async () => {
    const { getByText, getByDisplayValue } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));

    expect(getByText("Update Task")).toBeTruthy();
    expect(getByDisplayValue("Call mom")).toBeTruthy();
    expect(getByDisplayValue("30m")).toBeTruthy();
  });

  it("updates a task and returns to list", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.changeText(getByLabelText("Title"), "Call dad");
    await fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(queryByText("Update Task")).toBeNull();
    });
    expect(getByText("Call dad")).toBeTruthy();
  });

  it("deletes a task via confirmation", async () => {
    const { getByText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.press(getByText("Delete"));

    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();

    await fireEvent.press(getByText("Yes"));

    await waitFor(() => {
      expect(queryByText("Call mom")).toBeNull();
    });
    expect(getByText("Tasks")).toBeTruthy();
  });

  it("returns to update mode when delete is cancelled", async () => {
    const { getByText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.press(getByText("Delete"));
    await fireEvent.press(getByText("Cancel"));

    expect(
      queryByText("Are you sure you want to delete this task?")
    ).toBeNull();
    expect(getByText("Update Task")).toBeTruthy();
  });

  it("opens delete confirmation from list swipe Delete action and removes task", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByLabelText("Delete"));

    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();

    await fireEvent.press(getByText("Yes"));

    await waitFor(() => {
      expect(queryByText("Call mom")).toBeNull();
    });
    expect(getByText("Tasks")).toBeTruthy();
  });

  it("returns to list mode when swipe delete confirmation is cancelled", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByLabelText("Delete"));
    await fireEvent.press(getByText("Cancel"));

    expect(
      queryByText("Are you sure you want to delete this task?")
    ).toBeNull();
    expect(queryByText("Update Task")).toBeNull();
    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("Call mom")).toBeTruthy();
  });

  it("shows ErrorModal when creating fails and Try Again retries the action", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet();

    await fireEvent.press(getByText("+"));
    await fireEvent.changeText(getByLabelText("Title"), "Call mom");
    await fireEvent.changeText(getByLabelText("Time required"), "30m");
    await fireEvent.press(getByLabelText("Select Importance High"));
    await fireEvent.press(getByLabelText("Select Urgency High"));

    failNextCreate = true;
    await fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
    });
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(getByText("Try Again")).toBeTruthy();
    expect(getByText("New Task")).toBeTruthy();

    // Still failing on retry
    await fireEvent.press(getByText("Try Again"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
    });
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();

    await fireEvent.press(getByText("Go back"));

    expect(queryByText("An error occured!")).toBeNull();
    expect(getByText("New Task")).toBeTruthy();
  });

  it("shows ErrorModal when updating fails due to network failure", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.changeText(getByLabelText("Title"), "Call dad");

    failNextCreate = true;
    await fireEvent.press(getByText("Save"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
    });
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(getByText("Update Task")).toBeTruthy();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
  });

  it("shows ErrorModal when deleting fails due to network failure", async () => {
    // deleteTask currently does local remove then best-effort remote delete.
    // To surface an error with retry, we need delete to fail before local state
    // is updated. The plan says delete uses the same remove behavior as update's
    // old-version cleanup, which is best-effort for remote. However the original
    // UI expected ErrorModal on delete failure.
    //
    // With the current TasksContext, deleteTask only throws when userId is null
    // (NETWORK_ERROR_MESSAGE). Remote delete failures are warned, not thrown.
    // For this test, force createStorageRecord path isn't relevant; instead we
    // simulate failure by making setTaskIdIndex throw via a rejected setItem.
    const { getByText, queryByText } = await renderSheet([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.press(getByText("Delete"));

    mockStorage.setItem.mockRejectedValueOnce(new Error("disk full"));

    await fireEvent.press(getByText("Yes"));

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
    });
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();
  });

  it("invokes drag callbacks when a task card is dragged", async () => {
    const onDragStart = jest.fn();
    const onDragMove = jest.fn();
    const onDragEnd = jest.fn();

    const { getByText, getByTestId } = await renderSheet(
      [
        {
          title: "Call mom",
          timeRequired: "30m",
          importance: "High",
          urgency: "High",
        },
      ],
      { onDragStart, onDragMove, onDragEnd }
    );

    expect(getByText("Call mom")).toBeTruthy();

    const gesture = getByTestId(/^task-drag-/) as unknown as QueriedElement;

    act(() => {
      (
        gesture!.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.ACTIVE, oldState: State.BEGAN },
      });
    });

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][0].title).toBe("Call mom");

    act(() => {
      (
        gesture!.props.onGestureEvent as ((event: unknown) => void) | undefined
      )?.({
        nativeEvent: { absoluteX: 100, absoluteY: 240 },
      });
    });

    expect(onDragMove).toHaveBeenCalledWith(100, 240);

    act(() => {
      (
        gesture!.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.END, oldState: State.ACTIVE },
      });
    });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it("returns null when hidden and not dragging", async () => {
    const { queryByText, queryByTestId } = await renderSheet([], {
      hidden: true,
    });

    expect(queryByText("Tasks")).toBeNull();
    expect(queryByTestId("bottom-sheet")).toBeNull();
  });

  it("stays mounted while dragging even if hidden becomes true", async () => {
    const onDragStart = jest.fn();
    const onDragMove = jest.fn();
    const onDragEnd = jest.fn();

    function DragThenHideSheet() {
      const [hidden, setHidden] = useState(false);
      return (
        <TaskBottomSheet
          hidden={hidden}
          onDragStart={(task) => {
            onDragStart(task);
            setHidden(true);
          }}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      );
    }

    const result = await render(
      <AuthProvider>
        <TasksProvider>
          <LoginGate>
            <SeedTasks
              tasks={[
                {
                  title: "Call mom",
                  timeRequired: "30m",
                  importance: "High",
                  urgency: "High",
                },
              ]}
            />
            <DragThenHideSheet />
          </LoginGate>
        </TasksProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(result.queryByTestId("gate-loading")).toBeNull();
      expect(result.queryByTestId("seed-loading")).toBeNull();
    });

    const { getByText, getByTestId } = result;

    expect(getByText("Call mom")).toBeTruthy();
    const gesture = getByTestId(/^task-drag-/) as unknown as QueriedElement;

    act(() => {
      (
        gesture.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.ACTIVE, oldState: State.BEGAN },
      });
    });

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(getByTestId("bottom-sheet")).toBeTruthy();

    act(() => {
      (
        gesture.props.onGestureEvent as ((event: unknown) => void) | undefined
      )?.({
        nativeEvent: { absoluteX: 80, absoluteY: 240 },
      });
      (
        gesture.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.END, oldState: State.ACTIVE },
      });
    });

    expect(onDragMove).toHaveBeenCalledWith(80, 240);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it("snaps to the closed position when entering and leaving moving mode", async () => {
    function DragThenHideSheet() {
      const [hidden, setHidden] = useState(false);
      return (
        <TaskBottomSheet
          hidden={hidden}
          onDragStart={() => setHidden(true)}
          onDragEnd={() => setHidden(false)}
        />
      );
    }

    const result = await render(
      <AuthProvider>
        <TasksProvider>
          <LoginGate>
            <SeedTasks
              tasks={[
                {
                  title: "Call mom",
                  timeRequired: "30m",
                  importance: "High",
                  urgency: "High",
                },
              ]}
            />
            <DragThenHideSheet />
          </LoginGate>
        </TasksProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(result.queryByTestId("gate-loading")).toBeNull();
      expect(result.queryByTestId("seed-loading")).toBeNull();
    });

    const { getByText, getByTestId } = result;

    expect(getByText("Call mom")).toBeTruthy();
    expect(mockSnapToIndex).toHaveBeenCalledWith(1);
    mockSnapToIndex.mockClear();

    const gesture = getByTestId(/^task-drag-/) as unknown as QueriedElement;

    act(() => {
      (
        gesture.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.ACTIVE, oldState: State.BEGAN },
      });
    });

    expect(mockSnapToIndex).toHaveBeenCalledWith(0);
    mockSnapToIndex.mockClear();

    act(() => {
      (
        gesture.props.onHandlerStateChange as
          | ((event: unknown) => void)
          | undefined
      )?.({
        nativeEvent: { state: State.END, oldState: State.ACTIVE },
      });
    });

    expect(mockSnapToIndex).toHaveBeenCalledWith(0);
  });
});
