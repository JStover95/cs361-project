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

describe("TodayScreen", () => {
  it("renders schedule chrome, tooltip, and tasks sheet", async () => {
    const { getByText } = await renderToday();

    expect(getByText("Channtto")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("View Matrix")).toBeTruthy();
    expect(getByText("Block Time")).toBeTruthy();
    expect(getByText("Start with blocking some time")).toBeTruthy();
    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("hides tooltip when Block Time is pressed", async () => {
    const { getByText, queryByText } = await renderToday();

    expect(getByText("Start with blocking some time")).toBeTruthy();

    await fireEvent.press(getByText("Block Time"));

    expect(queryByText("Start with blocking some time")).toBeNull();
  });
});
