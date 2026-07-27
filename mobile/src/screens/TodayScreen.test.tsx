import { fireEvent, render } from "@testing-library/react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { TasksProvider, useTasks } from "../context/TasksContext";
import { TodayScreen } from "./TodayScreen";

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

function renderToday(
  seed: Array<{
    title: string;
    timeRequired: string;
    importance: "High" | "Low";
    urgency: "High" | "Low";
  }> = []
) {
  return render(
    <TasksProvider>
      <SeedTasks tasks={seed} />
      <TodayScreen />
    </TasksProvider>
  );
}

async function completeIntro(
  getByText: (text: string | RegExp) => ReturnType<
    Awaited<ReturnType<typeof renderToday>>["getByText"]
  >
) {
  await fireEvent.press(getByText("Next"));
  await fireEvent.press(getByText("Next"));
  await fireEvent.press(getByText("Done"));
}

describe("TodayScreen", () => {
  it("renders schedule chrome and welcome intro on mount", async () => {
    const { getByText, queryByText } = await renderToday();

    expect(getByText("Channtto")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("View Matrix")).toBeTruthy();
    expect(getByText("Block Time")).toBeTruthy();
    expect(getByText("Welcome!")).toBeTruthy();
    expect(
      getByText(
        /With Channtto you can start prioritizing and scheduling to get more out of your day!/
      )
    ).toBeTruthy();
    expect(queryByText("Start with blocking some time")).toBeNull();
    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("shows tooltip after completing the intro", async () => {
    const { getByText, queryByText } = await renderToday();

    await completeIntro(getByText);

    expect(queryByText("Welcome!")).toBeNull();
    expect(getByText("Start with blocking some time")).toBeTruthy();
  });

  it("hides tooltip when Block Time is pressed after intro", async () => {
    const { getByText, queryByText } = await renderToday();

    await completeIntro(getByText);
    expect(getByText("Start with blocking some time")).toBeTruthy();

    await fireEvent.press(getByText("Block Time"));

    expect(queryByText("Start with blocking some time")).toBeNull();
  });

  it("shows undo toast after deleting a task and restores on Undo", async () => {
    const { getByText, getByLabelText, queryByText } = await renderToday([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    await fireEvent.press(getByLabelText("Delete"));
    await fireEvent.press(getByText("Yes"));

    expect(queryByText("Call mom")).toBeNull();
    expect(getByText("Task deleted")).toBeTruthy();
    expect(getByText("Undo")).toBeTruthy();

    await fireEvent.press(getByText("Undo"));

    expect(queryByText("Task deleted")).toBeNull();
    expect(getByText("Call mom")).toBeTruthy();
  });

  it("toggles simulated network failure via the header switch", async () => {
    const { getByText, getByLabelText, queryByText } = await renderToday([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const failureSwitch = getByLabelText("Simulate network failure");
    expect(failureSwitch).toBeTruthy();

    await fireEvent(failureSwitch, "valueChange", true);

    await fireEvent.press(getByLabelText("Delete"));
    await fireEvent.press(getByText("Yes"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText("Network request failed. Please try again.")).toBeTruthy();
    expect(queryByText("Task deleted")).toBeNull();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();
  });
});
