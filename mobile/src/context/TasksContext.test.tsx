import { useState } from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { AuthProvider, useAuthContext } from "./AuthContext";
import {
  NETWORK_ERROR_MESSAGE,
  TasksProvider,
  useTasks,
} from "./TasksContext";

function TasksProbe() {
  const {
    tasks,
    lastDeletedTaskId,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
  } = useTasks();

  return (
    <View>
      <Text testID="task-count">{tasks.length}</Text>
      <Text testID="last-deleted">{lastDeletedTaskId ?? "none"}</Text>
      {tasks.map((task) => (
        <Text key={task.id} testID={`task-${task.id}`}>
          {task.title}|{task.timeRequired}|{task.importance}|{task.urgency}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          addTask({
            title: "Zebra",
            timeRequired: "1h",
            importance: "High",
            urgency: "Low",
          })
        }
      >
        <Text>Add Zebra</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          addTask({
            title: "Apple",
            timeRequired: "30m",
            importance: "Low",
            urgency: "High",
          })
        }
      >
        <Text>Add Apple</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const first = tasks[0];
          if (first) {
            updateTask(first.id, {
              title: "Updated",
              timeRequired: "2h",
              importance: "High",
              urgency: "High",
            });
          }
        }}
      >
        <Text>Update First</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const first = tasks[0];
          if (first) {
            deleteTask(first.id);
          }
        }}
      >
        <Text>Delete First</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const second = tasks[1];
          if (second) {
            deleteTask(second.id);
          }
        }}
      >
        <Text>Delete Second</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={undoDelete}>
        <Text>Undo Delete</Text>
      </Pressable>
    </View>
  );
}

function FailureProbe() {
  const {
    tasks,
    simulateFailure,
    setSimulateFailure,
    listTasks,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const [actionError, setActionError] = useState<string | null>(null);

  const run = (action: () => void) => {
    try {
      action();
      setActionError(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "error");
    }
  };

  return (
    <View>
      <Text testID="task-count">{tasks.length}</Text>
      <Text testID="simulate-failure">{simulateFailure ? "on" : "off"}</Text>
      <Text testID="action-error">{actionError ?? "none"}</Text>
      {tasks.map((task) => (
        <Text key={task.id} testID={`task-${task.id}`}>
          {task.title}|{task.timeRequired}|{task.importance}|{task.urgency}
        </Text>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => setSimulateFailure(true)}
      >
        <Text>Enable Failure</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSimulateFailure(false)}
      >
        <Text>Disable Failure</Text>
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
          run(() => {
            const first = tasks[0];
            if (first) {
              updateTask(first.id, {
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
          run(() => {
            const first = tasks[0];
            if (first) {
              deleteTask(first.id);
            }
          })
        }
      >
        <Text>Delete First</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => run(() => listTasks())}
      >
        <Text>List Tasks</Text>
      </Pressable>
    </View>
  );
}

function ScopedProbe() {
  const { userId, login } = useAuthContext();
  const { tasks, addTask } = useTasks();
  const [lastAddedUserId, setLastAddedUserId] = useState<string | null>(null);

  return (
    <View>
      <Text testID="auth-user-id">{userId ?? "null"}</Text>
      <Text testID="task-count">{tasks.length}</Text>
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
        onPress={() => {
          const task = addTask({
            title: "Task A",
            timeRequired: "30m",
            importance: "High",
            urgency: "High",
          });
          setLastAddedUserId(task.userId);
        }}
      >
        <Text>Add Task A</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const task = addTask({
            title: "Task B",
            timeRequired: "1h",
            importance: "Low",
            urgency: "Low",
          });
          setLastAddedUserId(task.userId);
        }}
      >
        <Text>Add Task B</Text>
      </Pressable>
    </View>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <TasksProvider>{ui}</TasksProvider>
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

describe("TasksContext", () => {
  it("starts with an empty task list", async () => {
    const { getByTestId } = await renderWithProviders(<TasksProbe />);

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("last-deleted").props.children).toBe("none");
  });

  it("adds tasks and returns them sorted alphabetically by title", async () => {
    const { getByText, getByTestId, getAllByTestId } = await renderWithProviders(
      <TasksProbe />
    );

    await fireEvent.press(getByText("Add Zebra"));
    await fireEvent.press(getByText("Add Apple"));

    expect(getByTestId("task-count").props.children).toBe(2);
    const rendered = getAllByTestId(/^task-task-/).map(
      (node) => node.props.children
    );
    expect(rendered[0]).toContain("Apple");
    expect(rendered[1]).toContain("Zebra");
  });

  it("updates and deletes tasks", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await fireEvent.press(getByText("Add Apple"));
    await fireEvent.press(getByText("Update First"));

    expect(getByText(/Updated\|2h\|High\|High/)).toBeTruthy();

    await fireEvent.press(getByText("Delete First"));

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(queryByText(/Updated\|2h\|High\|High/)).toBeNull();
  });

  it("tracks lastDeletedTaskId after delete and restores on undo", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await fireEvent.press(getByText("Add Apple"));

    expect(getByTestId("last-deleted").props.children).toBe("none");

    const appleNode = getByText(/Apple\|30m\|Low\|High/);
    const appleId = appleNode.props.testID.replace("task-", "");

    await fireEvent.press(getByText("Delete First"));

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("last-deleted").props.children).toBe(appleId);
    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();

    await fireEvent.press(getByText("Undo Delete"));

    expect(getByTestId("task-count").props.children).toBe(1);
    expect(getByTestId("last-deleted").props.children).toBe("none");
    expect(getByText(/Apple\|30m\|Low\|High/)).toBeTruthy();
  });

  it("replaces lastDeletedTaskId when a second task is deleted", async () => {
    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <TasksProbe />
    );

    await fireEvent.press(getByText("Add Apple"));
    await fireEvent.press(getByText("Add Zebra"));

    await fireEvent.press(getByText("Delete First"));

    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
    expect(getByText(/Zebra\|1h\|High\|Low/)).toBeTruthy();
    const firstDeletedId = getByTestId("last-deleted").props.children;

    await fireEvent.press(getByText("Delete First"));

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("last-deleted").props.children).not.toBe(firstDeletedId);
    expect(queryByText(/Zebra\|1h\|High\|Low/)).toBeNull();

    await fireEvent.press(getByText("Undo Delete"));

    expect(getByTestId("task-count").props.children).toBe(1);
    expect(getByText(/Zebra\|1h\|High\|Low/)).toBeTruthy();
    expect(queryByText(/Apple\|30m\|Low\|High/)).toBeNull();
  });

  it("throws on add, update, delete, and list when simulateFailure is enabled", async () => {
    const { getByText, getByTestId } = await renderWithProviders(
      <FailureProbe />
    );

    await fireEvent.press(getByText("Add Apple"));
    expect(getByTestId("task-count").props.children).toBe(1);
    expect(getByTestId("action-error").props.children).toBe("none");

    await fireEvent.press(getByText("Enable Failure"));
    expect(getByTestId("simulate-failure").props.children).toBe("on");

    await fireEvent.press(getByText("Add Apple"));
    expect(getByTestId("action-error").props.children).toBe(
      NETWORK_ERROR_MESSAGE
    );
    expect(getByTestId("task-count").props.children).toBe(1);

    await fireEvent.press(getByText("Update First"));
    expect(getByTestId("action-error").props.children).toBe(
      NETWORK_ERROR_MESSAGE
    );
    expect(getByText(/Apple\|30m\|Low\|High/)).toBeTruthy();

    await fireEvent.press(getByText("Delete First"));
    expect(getByTestId("action-error").props.children).toBe(
      NETWORK_ERROR_MESSAGE
    );
    expect(getByTestId("task-count").props.children).toBe(1);

    await fireEvent.press(getByText("List Tasks"));
    expect(getByTestId("action-error").props.children).toBe(
      NETWORK_ERROR_MESSAGE
    );

    await fireEvent.press(getByText("Disable Failure"));
    expect(getByTestId("simulate-failure").props.children).toBe("off");

    await fireEvent.press(getByText("List Tasks"));
    expect(getByTestId("action-error").props.children).toBe("none");

    await fireEvent.press(getByText("Update First"));
    expect(getByTestId("action-error").props.children).toBe("none");
    expect(getByText(/Updated\|2h\|High\|High/)).toBeTruthy();
  });
});

describe("TasksContext per-user scoping", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("stamps addTask with the logged-in user's id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        message: "Login successful.",
        user_id: "user-a",
      })
    );

    const { getByText, getByTestId } = await renderWithProviders(
      <ScopedProbe />
    );

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });

    await fireEvent.press(getByText("Add Task A"));

    expect(getByTestId("last-added-user-id").props.children).toBe("user-a");
    expect(getByText(/Task A\|user-a/)).toBeTruthy();
  });

  it("filters tasks to only those belonging to the logged-in user", async () => {
    (global.fetch as jest.Mock).mockImplementation((_url: string, options) => {
      const body = JSON.parse(options.body as string);
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
    });

    const { getByText, getByTestId, queryByText } = await renderWithProviders(
      <ScopedProbe />
    );

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });
    await fireEvent.press(getByText("Add Task A"));
    expect(getByText(/Task A\|user-a/)).toBeTruthy();

    await fireEvent.press(getByText("Login B"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-b");
    });
    expect(queryByText(/Task A\|user-a/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(0);

    await fireEvent.press(getByText("Add Task B"));
    expect(getByText(/Task B\|user-b/)).toBeTruthy();
    expect(queryByText(/Task A\|user-a/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(1);

    await fireEvent.press(getByText("Login A"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("user-a");
    });
    expect(getByText(/Task A\|user-a/)).toBeTruthy();
    expect(queryByText(/Task B\|user-b/)).toBeNull();
    expect(getByTestId("task-count").props.children).toBe(1);
  });
});
