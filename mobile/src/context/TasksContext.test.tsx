import { fireEvent, render } from "@testing-library/react-native";
import { Pressable, Text, View } from "react-native";
import { TasksProvider, useTasks } from "./TasksContext";

function TasksProbe() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

  return (
    <View>
      <Text testID="task-count">{tasks.length}</Text>
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
});
