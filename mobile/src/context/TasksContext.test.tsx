import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { TasksProvider, useTasks } from "./TasksContext";

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

describe("TasksContext", () => {
  it("starts with an empty task list", async () => {
    const { getByTestId } = await render(
      <TasksProvider>
        <TasksProbe />
      </TasksProvider>
    );

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(getByTestId("last-deleted").props.children).toBe("none");
  });

  it("adds tasks and returns them sorted alphabetically by title", async () => {
    const { getByText, getByTestId, getAllByTestId } = await render(
      <TasksProvider>
        <TasksProbe />
      </TasksProvider>
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
    const { getByText, getByTestId, queryByText } = await render(
      <TasksProvider>
        <TasksProbe />
      </TasksProvider>
    );

    await fireEvent.press(getByText("Add Apple"));
    await fireEvent.press(getByText("Update First"));

    expect(getByText(/Updated\|2h\|High\|High/)).toBeTruthy();

    await fireEvent.press(getByText("Delete First"));

    expect(getByTestId("task-count").props.children).toBe(0);
    expect(queryByText(/Updated\|2h\|High\|High/)).toBeNull();
  });

  it("tracks lastDeletedTaskId after delete and restores on undo", async () => {
    const { getByText, getByTestId, queryByText } = await render(
      <TasksProvider>
        <TasksProbe />
      </TasksProvider>
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
    const { getByText, getByTestId, queryByText } = await render(
      <TasksProvider>
        <TasksProbe />
      </TasksProvider>
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
});
