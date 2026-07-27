import { fireEvent, render } from "@testing-library/react-native";
import { TasksProvider } from "../context/TasksContext";
import { TodayScreen } from "./TodayScreen";

function renderToday() {
  return render(
    <TasksProvider>
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
});
