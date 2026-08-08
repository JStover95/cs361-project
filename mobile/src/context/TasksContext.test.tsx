import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { AuthProvider, useAuthContext } from "./AuthContext";
import {
  NETWORK_ERROR_MESSAGE,
  SCHEDULE_OVERLAP_MESSAGE,
  TasksProvider,
  useTasks,
} from "./TasksContext";
import { STORAGE_SERVICE_ENDPOINT } from "../utils/constants";
import { setTaskIdIndex } from "../utils/taskIndexStorage";

type AsyncStorageMock = typeof AsyncStorage & {
  __reset: () => void;
};

const mockStorage = AsyncStorage as AsyncStorageMock;

function TasksProbe() {
  const {
    tasks,
    tasksLoading,
    lastDeletedTaskId,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
    scheduleTask,
    unscheduleTask,
    listTasks,
  } = useTasks();
  const [actionError, setActionError] = useState<string | null>(null);
  const [listedCount, setListedCount] = useState<number | null>(null);

  const run = async (action: () => void | Promise<void>) => {
    try {
      await action();
      setActionError(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <View>
      <Text testID="task-count">{tasks.length}</Text>
      <Text testID="tasks-loading">{tasksLoading ? "yes" : "no"}</Text>
      <Text testID="last-deleted">{lastDeletedTaskId ?? "none"}</Text>
      <Text testID="action-error">{actionError ?? "none"}</Text>
      <Text testID="listed-count">
        {listedCount === null ? "none" : listedCount}
      </Text>
      {tasks.map((task) => (
        <Text key={task.id} testID={`task-${task.id}`}>
          {task.title}|{task.timeRequired}|{task.importance}|{task.urgency}|
          {task.scheduledStartMinutes ?? "unscheduled"}|{task.userId}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() =>
            addTask({
              title: "Zebra",
              timeRequired: "1h",
              importance: "High",
              urgency: "Low",
            })
          )
        }
      >
        <Text>Add Zebra</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() =>
            addTask({
              title: "Apple",
              timeRequired: "30m",
              importance: "Low",
              urgency: "High",
            })
          )
        }
      >
        <Text>Add Apple</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(async () => {
            const first = tasks[0];
            if (first) {
              await updateTask(first.id, {
                title: "Updated",
                timeRequired: "2h",
                importance: "High",
                urgency: "High",
              });
            }
          })
        }
      >
        <Text>Update First</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(async () => {
            const first = tasks[0];
            if (first) {
              await deleteTask(first.id);
            }
          })
        }
      >
        <Text>Delete First</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(async () => {
            const second = tasks[1];
            if (second) {
              await deleteTask(second.id);
            }
          })
        }
      >
        <Text>Delete Second</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => run(() => undoDelete())}
      >
        <Text>Undo Delete</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() => {
            const apple = tasks.find((t) => t.title === "Apple");
            if (apple) {
              scheduleTask(apple.id, 11 * 60 + 30);
            }
          })
        }
      >
        <Text>Schedule Apple 11:30</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() => {
            const zebra = tasks.find((t) => t.title === "Zebra");
            if (zebra) {
              scheduleTask(zebra.id, 11 * 60);
            }
          })
        }
      >
        <Text>Schedule Zebra 11:00</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() => {
            const zebra = tasks.find((t) => t.title === "Zebra");
            if (zebra) {
              scheduleTask(zebra.id, 14 * 60);
            }
          })
        }
      >
        <Text>Schedule Zebra 14:00</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() => {
            setListedCount(listTasks().length);
          })
        }
      >
        <Text>List Unscheduled</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          run(() => {
            const apple = tasks.find((t) => t.title === "Apple");
            if (apple) {
              unscheduleTask(apple.id);
            }
          })
        }
      >
        <Text>Unschedule Apple</Text>
      </Pressable>
    </View>
  );
}

function ScopedProbe() {
  const { userId, login } = useAuthContext();
  const { tasks, tasksLoading, addTask } = useTasks();
  const [lastAddedUserId, setLastAddedUserId] = useState<string | null>(null);

  return (
    <View>
      <Text testID="auth-user-id">{userId ?? "null"}</Text>
      <Text testID="task-count">{tasks.length}</Text>
      <Text testID="tasks-loading">{tasksLoading ? "yes" : "no"}</Text>
      <Text testID="last-added-user-id">{lastAddedUserId ?? "null"}</Text>
      {tasks.map((task) => (
        <Text key={task.id} testID={`task-${task.id}`}>
          {task.title}|{task.userId}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => login("a@example.com", "secret")}
      >
        <Text>Login A</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => login("b@example.com", "secret")}
      >
        <Text>Login B</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          addTask({
            title: "Task A",
            timeRequired: "30m",
            importance: "High",
            urgency: "High",
          }).then((task) => setLastAddedUserId(task.userId))
        }
      >
        <Text>Add Task A</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          addTask({
            title: "Task B",
            timeRequired: "1h",
            importance: "Low",
            urgency: "Low",
          }).then((task) => setLastAddedUserId(task.userId))
        }
      >
        <Text>Add Task B</Text>
      </Pressable>
    </View>
  );
}

function LoginAndProbe({ children }: { children: React.ReactNode }) {
  const { userId, login } = useAuthContext();

  return (
    <View>
      <Text testID="auth-user-id">{userId ?? "null"}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => login("user@example.com", "secret")}
      >
        <Text>Login</Text>
      </Pressable>
      {children}
    </View>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <TasksProvider>
        <LoginAndProbe>{ui}</LoginAndProbe>
      </TasksProvider>
    </AuthProvider>
  );
}

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

let createCounter = 0;

function mockAuthAndStorage() {
  createCounter = 0;
  (global.fetch as jest.Mock).mockImplementation((url: string, options?: { method?: string; body?: string }) => {
    if (typeof url === "string" && url.includes("/login")) {
      return jsonResponse(200, {
        message: "Login successful.",
        user_id: "user-1",
      });
    }
    if (typeof url === "string" && url.includes("/register")) {
      return jsonResponse(200, {
        message: "Registration successful.",
        user_id: "user-1",
      });
    }
    if (
      typeof url === "string" &&
      url === `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage` &&
      options?.method === "POST"
    ) {
      createCounter += 1;
      return jsonResponse(201, { id: `rec-${createCounter}` });
    }
    if (
      typeof url === "string" &&
      url.startsWith(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
      (options?.method === "GET" || options?.method == null)
    ) {
      return jsonResponse(404, { detail: "Record not found or access denied." });
    }
    if (
      typeof url === "string" &&
      url.startsWith(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
      options?.method === "DELETE"
    ) {
      return jsonResponse(200, { message: "deleted" });
    }
    return jsonResponse(404, { error: "not found" });
  });
}

async function loginAsUser(
  getByText: (text: string | RegExp) => ReturnType<
    Awaited<ReturnType<typeof renderWithProviders>>["getByText"]
  >,
  getByTestId: (id: string) => ReturnType<
    Awaited<ReturnType<typeof renderWithProviders>>["getByTestId"]
  >
) {
  await fireEvent.press(getByText("Login"));
  await waitFor(() => {
    expect(getByTestId("auth-user-id").props.children).toBe("user-1");
  });
  await waitFor(() => {
    expect(getByTestId("tasks-loading").props.children).toBe("no");
  });
}

describe("TasksContext initialization", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockStorage.__reset();
    mockAuthAndStorage();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("creates an empty task id index when none exists and finishes loading", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("tasks-loading").props.children).toBe("no");
    expect(await mockStorage.getItem("task-ids:user-1")).toBe(
      JSON.stringify([])
    );
  });

  it("loads existing task ids sequentially and stores retrieved tasks", async () => {
    await setTaskIdIndex("user-1", ["id-a", "id-b"]);

    const getOrder: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (typeof url === "string" && url.includes("/login")) {
          return jsonResponse(200, {
            message: "Login successful.",
            user_id: "user-1",
          });
        }
        if (
          typeof url === "string" &&
          url.includes(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
          (options?.method === "GET" || options?.method == null)
        ) {
          const id = url.split("/").pop()!;
          getOrder.push(id);
          if (id === "id-a") {
            return jsonResponse(200, {
              id: "id-a",
              client_id: "MobileAppClient",
              data: {
                userId: "user-1",
                title: "Apple",
                timeRequired: "30m",
                importance: "Low",
                urgency: "High",
              },
              metadata: {},
            });
          }
          if (id === "id-b") {
            return jsonResponse(200, {
              id: "id-b",
              client_id: "MobileAppClient",
              data: {
                userId: "user-1",
                title: "Zebra",
                timeRequired: "1h",
                importance: "High",
                urgency: "Low",
              },
              metadata: {},
            });
          }
          return jsonResponse(404, { detail: "not found" });
        }
        return jsonResponse(404, {});
      }
    );

    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    expect(getOrder).toEqual(["id-a", "id-b"]);
    expect(getByTestId("task-count").props.children).toBe(2);
    expect(getByText(/Apple\|30m\|Low\|High/)).toBeTruthy();
    expect(getByText(/Zebra\|1h\|High\|Low/)).toBeTruthy();
  });

  it("warns and continues when a task id is not found", async () => {
    await setTaskIdIndex("user-1", ["missing", "id-b"]);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (typeof url === "string" && url.includes("/login")) {
          return jsonResponse(200, {
            message: "Login successful.",
            user_id: "user-1",
          });
        }
        if (
          typeof url === "string" &&
          url.includes(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/`) &&
          (options?.method === "GET" || options?.method == null)
        ) {
          const id = url.split("/").pop()!;
          if (id === "id-b") {
            return jsonResponse(200, {
              id: "id-b",
              client_id: "MobileAppClient",
              data: {
                userId: "user-1",
                title: "Zebra",
                timeRequired: "1h",
                importance: "High",
                urgency: "Low",
              },
              metadata: {},
            });
          }
          return jsonResponse(404, { detail: "not found" });
        }
        return jsonResponse(404, {});
      }
    );

    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    expect(getByTestId("task-count").props.children).toBe(1);
    expect(getByText(/Zebra\|1h\|High\|Low/)).toBeTruthy();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("TasksContext CRUD", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockStorage.__reset();
    mockAuthAndStorage();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("starts with an empty task list after login", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("last-deleted").props.children).toBe("none");
  });

  it("adds tasks and returns them sorted alphabetically by title", async () => {
    const { getByText, getByTestId, getAllByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Zebra"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });
    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(2);
    });

    const rendered = getAllByTestId(/^task-rec-/).map(
      (node) => node.props.children
    );
    expect(rendered[0]).toContain("Apple");
    expect(rendered[1]).toContain("Zebra");
    expect(await mockStorage.getItem("task-ids:user-1")).toBe(
      JSON.stringify(["rec-1", "rec-2"])
    );
  });

  it("throws NETWORK_ERROR_MESSAGE when create fails and does not add the task", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: { method?: string }) => {
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
          return jsonResponse(500, { detail: "fail" });
        }
        return jsonResponse(404, {});
      }
    );

    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });

    await waitFor(() => {
      expect(getByTestId("action-error").props.children).toBe(
        NETWORK_ERROR_MESSAGE
      );
    });
    expect(getByTestId("task-count").props.children).toBe(0);
  });

  it("updates a task by creating a new record and swapping atomically", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });

    await act(async () => {
      await fireEvent.press(getByText("Update First"));
    });

    await waitFor(() => {
      expect(getByText(/Updated\|2h\|High\|High/)).toBeTruthy();
    });
    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(1);
    expect(await mockStorage.getItem("task-ids:user-1")).toBe(
      JSON.stringify(["rec-2"])
    );
  });

  it("deletes a task, updates the index, and tracks lastDeletedTaskId", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });

    const appleId = getByText(/Apple\|30m\|Low\|High/).props.testID.replace(
      "task-",
      ""
    );

    await act(async () => {
      await fireEvent.press(getByText("Delete First"));
    });

    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(0);
    });
    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
    expect(getByTestId("last-deleted").props.children).toBe(appleId);
    expect(await mockStorage.getItem("task-ids:user-1")).toBe(
      JSON.stringify([])
    );
  });

  it("restores a deleted task via undoDelete by creating a new record", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });

    await act(async () => {
      await fireEvent.press(getByText("Delete First"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(0);
    });

    await act(async () => {
      await fireEvent.press(getByText("Undo Delete"));
    });

    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });
    expect(getByTestId("last-deleted").props.children).toBe("none");
    expect(getByText(/Apple\|30m\|Low\|High/)).toBeTruthy();
  });

  it("replaces lastDeletedTaskId when a second task is deleted", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await act(async () => {
      await fireEvent.press(getByText("Add Zebra"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(2);
    });

    await act(async () => {
      await fireEvent.press(getByText("Delete First"));
    });
    await waitFor(() => {
      expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
    });
    const firstDeletedId = getByTestId("last-deleted").props.children;

    await act(async () => {
      await fireEvent.press(getByText("Delete First"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(0);
    });
    expect(getByTestId("last-deleted").props.children).not.toBe(firstDeletedId);

    await act(async () => {
      await fireEvent.press(getByText("Undo Delete"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });
    expect(getByText(/Zebra\|1h\|High\|Low/)).toBeTruthy();
    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
  });

  it("schedules a task at the given start minutes", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });

    await act(async () => {
      await fireEvent.press(getByText("Schedule Apple 11:30"));
    });

    expect(getByTestId("action-error").props.children).toBe("none");
    expect(getByText(/Apple\|30m\|Low\|High\|690/)).toBeTruthy();
  });

  it("throws on overlap and leaves the overlapping task unscheduled", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await act(async () => {
      await fireEvent.press(getByText("Add Zebra"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(2);
    });

    await act(async () => {
      await fireEvent.press(getByText("Schedule Apple 11:30"));
    });
    expect(getByText(/Apple\|30m\|Low\|High\|690/)).toBeTruthy();

    await act(async () => {
      await fireEvent.press(getByText("Schedule Zebra 11:00"));
    });

    expect(getByTestId("action-error").props.children).toBe(
      SCHEDULE_OVERLAP_MESSAGE
    );
    expect(getByText(/Zebra\|1h\|High\|Low\|unscheduled/)).toBeTruthy();
  });

  it("schedules non-overlapping tasks successfully", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await act(async () => {
      await fireEvent.press(getByText("Add Zebra"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(2);
    });

    await act(async () => {
      await fireEvent.press(getByText("Schedule Apple 11:30"));
    });
    await act(async () => {
      await fireEvent.press(getByText("Schedule Zebra 14:00"));
    });

    expect(getByTestId("action-error").props.children).toBe("none");
    expect(getByText(/Apple\|30m\|Low\|High\|690/)).toBeTruthy();
    expect(getByText(/Zebra\|1h\|High\|Low\|840/)).toBeTruthy();
  });

  it("excludes scheduled tasks from listTasks", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await act(async () => {
      await fireEvent.press(getByText("Add Zebra"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(2);
    });

    await act(async () => {
      await fireEvent.press(getByText("List Unscheduled"));
    });
    expect(getByTestId("listed-count").props.children).toBe(2);

    await act(async () => {
      await fireEvent.press(getByText("Schedule Apple 11:30"));
    });
    await act(async () => {
      await fireEvent.press(getByText("List Unscheduled"));
    });
    expect(getByTestId("listed-count").props.children).toBe(1);
    expect(getByTestId("task-count").props.children).toBe(2);
  });

  it("unschedules a task and returns it to the unscheduled list", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await loginAsUser(getByText, getByTestId);

    await act(async () => {
      await fireEvent.press(getByText("Add Apple"));
    });
    await waitFor(() => {
      expect(getByTestId("task-count").props.children).toBe(1);
    });

    await act(async () => {
      await fireEvent.press(getByText("Schedule Apple 11:30"));
    });
    expect(getByText(/Apple\|30m\|Low\|High\|690/)).toBeTruthy();

    await act(async () => {
      await fireEvent.press(getByText("Unschedule Apple"));
    });

    expect(getByTestId("action-error").props.children).toBe("none");
    expect(getByText(/Apple\|30m\|Low\|High\|unscheduled/)).toBeTruthy();
    await act(async () => {
      await fireEvent.press(getByText("List Unscheduled"));
    });
    expect(getByTestId("listed-count").props.children).toBe(1);
  });
});

describe("TasksContext per-user scoping", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockStorage.__reset();
    createCounter = 0;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("stamps addTask with the logged-in user's id", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: { method?: string }) => {
        if (typeof url === "string" && url.includes("/login")) {
          return jsonResponse(200, {
            message: "Login successful.",
            user_id: "user-a",
          });
        }
        if (
          typeof url === "string" &&
          url === `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage` &&
          options?.method === "POST"
        ) {
          createCounter += 1;
          return jsonResponse(201, { id: `rec-${createCounter}` });
        }
        return jsonResponse(404, {});
      }
    );

    const { getByText, getByTestId } = await render(
      <AuthProvider>
        <TasksProvider>
          <ScopedProbe />
        </TasksProvider>
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });
    await waitFor(() => {
      expect(getByTestId("tasks-loading").props.children).toBe("no");
    });

    await act(async () => {
      await fireEvent.press(getByText("Add Task A"));
    });

    await waitFor(() => {
      expect(getByTestId("last-added-user-id").props.children).toBe("user-a");
    });
    expect(getByText(/Task A\|user-a/)).toBeTruthy();
  });

  it("filters tasks to only those belonging to the logged-in user", async () => {
    const records = new Map<string, Record<string, unknown>>();

    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options?: { method?: string; body?: string }) => {
        if (typeof url === "string" && url.includes("/login")) {
          const body = JSON.parse(options?.body as string);
          if (body.email === "a@example.com") {
            return jsonResponse(200, {
              message: "Login successful.",
              user_id: "user-a",
            });
          }
          return jsonResponse(200, {
            message: "Login successful.",
            user_id: "user-b",
          });
        }
        if (
          typeof url === "string" &&
          url === `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage` &&
          options?.method === "POST"
        ) {
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

    const { getByText, getByTestId, queryByText } = await render(
      <AuthProvider>
        <TasksProvider>
          <ScopedProbe />
        </TasksProvider>
      </AuthProvider>
    );

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });
    await waitFor(() => {
      expect(getByTestId("tasks-loading").props.children).toBe("no");
    });

    await act(async () => {
      await fireEvent.press(getByText("Add Task A"));
    });
    await waitFor(() => {
      expect(getByText(/Task A\|user-a/)).toBeTruthy();
    });

    await fireEvent.press(getByText("Login B"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-b");
    });
    await waitFor(() => {
      expect(getByTestId("tasks-loading").props.children).toBe("no");
    });
    expect(queryByText(/Task A\|user-a/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(0);

    await act(async () => {
      await fireEvent.press(getByText("Add Task B"));
    });
    await waitFor(() => {
      expect(getByText(/Task B\|user-b/)).toBeTruthy();
    });
    expect(queryByText(/Task A\|user-a/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(1);

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });
    await waitFor(() => {
      expect(getByTestId("tasks-loading").props.children).toBe("no");
    });
    expect(getByText(/Task A\|user-a/)).toBeTruthy();
    expect(queryByText(/Task B\|user-b/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(1);
  });
});
