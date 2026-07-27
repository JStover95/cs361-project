import { fireEvent, render } from "@testing-library/react-native";
import {
  NETWORK_ERROR_MESSAGE,
  TasksProvider,
  useTasks,
} from "../context/TasksContext";
import { ReactNode, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { TaskBottomSheet } from "./TaskBottomSheet";

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
  const { addTask } = useTasks();

  useEffect(() => {
    tasks.forEach((task) => addTask(task));
  }, []);

  return <View />;
}

function FailureToggle() {
  const { setSimulateFailure, simulateFailure } = useTasks();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => setSimulateFailure(!simulateFailure)}
    >
      <Text>Toggle Failure</Text>
    </Pressable>
  );
}

function SeedFailureThenSheet({ children }: { children: ReactNode }) {
  const { setSimulateFailure, simulateFailure } = useTasks();

  useEffect(() => {
    setSimulateFailure(true);
  }, []);

  if (!simulateFailure) {
    return null;
  }

  return <>{children}</>;
}

function renderSheet(
  seed: Array<{
    title: string;
    timeRequired: string;
    importance: "High" | "Low";
    urgency: "High" | "Low";
  }> = [],
  options: { withFailureToggle?: boolean; failureBeforeMount?: boolean } = {}
) {
  const { withFailureToggle = false, failureBeforeMount = false } = options;

  if (failureBeforeMount) {
    return render(
      <TasksProvider>
        <SeedFailureThenSheet>
          <TaskBottomSheet />
        </SeedFailureThenSheet>
      </TasksProvider>
    );
  }

  return render(
    <TasksProvider>
      <SeedTasks tasks={seed} />
      {withFailureToggle && <FailureToggle />}
      <TaskBottomSheet />
    </TasksProvider>
  );
}

describe("TaskBottomSheet", () => {
  it("renders list mode with Tasks label and add button", async () => {
    const { getByText } = await renderSheet();

    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
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

    expect(queryByText("New Task")).toBeNull();
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

    expect(queryByText("Update Task")).toBeNull();
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

    expect(queryByText("Call mom")).toBeNull();
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

    expect(queryByText("Call mom")).toBeNull();
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

  it("shows ErrorModal when listing fails due to simulated network failure", async () => {
    const { getByText } = await renderSheet([], { failureBeforeMount: true });

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(getByText("Try Again")).toBeTruthy();
    expect(getByText("Go back")).toBeTruthy();
  });

  it("shows ErrorModal when creating fails and Try Again retries the action", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet([], {
      withFailureToggle: true,
    });

    await fireEvent.press(getByText("+"));
    await fireEvent.press(getByText("Toggle Failure"));
    await fireEvent.changeText(getByLabelText("Title"), "Call mom");
    await fireEvent.changeText(getByLabelText("Time required"), "30m");
    await fireEvent.press(getByLabelText("Select Importance High"));
    await fireEvent.press(getByLabelText("Select Urgency High"));
    await fireEvent.press(getByText("Save"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(getByText("Try Again")).toBeTruthy();
    expect(getByText("New Task")).toBeTruthy();

    await fireEvent.press(getByText("Try Again"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();

    await fireEvent.press(getByText("Go back"));

    expect(queryByText("An error occured!")).toBeNull();
    expect(getByText("New Task")).toBeTruthy();
  });

  it("shows ErrorModal when updating fails due to simulated network failure", async () => {
    const { getByText, getByLabelText, queryByText } = await renderSheet(
      [
        {
          title: "Call mom",
          timeRequired: "30m",
          importance: "High",
          urgency: "High",
        },
      ],
      { withFailureToggle: true }
    );

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.press(getByText("Toggle Failure"));
    await fireEvent.changeText(getByLabelText("Title"), "Call dad");
    await fireEvent.press(getByText("Save"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(getByText("Update Task")).toBeTruthy();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
  });

  it("shows ErrorModal when deleting fails due to simulated network failure", async () => {
    const { getByText, queryByText } = await renderSheet(
      [
        {
          title: "Call mom",
          timeRequired: "30m",
          importance: "High",
          urgency: "High",
        },
      ],
      { withFailureToggle: true }
    );

    await fireEvent.press(getByText("Call mom"));
    await fireEvent.press(getByText("Delete"));
    await fireEvent.press(getByText("Toggle Failure"));
    await fireEvent.press(getByText("Yes"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();

    await fireEvent.press(getByText("Try Again"));
    expect(getByText("An error occured!")).toBeTruthy();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();
  });
});
