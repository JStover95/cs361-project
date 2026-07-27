import { fireEvent, render } from "@testing-library/react-native";
import { TodayScreen } from "./TodayScreen";

describe("TodayScreen", () => {
  it("renders schedule chrome, tooltip, and tasks sheet", async () => {
    const { getByText } = await render(<TodayScreen />);

    expect(getByText("Channtto")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("View Matrix")).toBeTruthy();
    expect(getByText("Block Time")).toBeTruthy();
    expect(getByText("Start with blocking some time")).toBeTruthy();
    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("hides tooltip when Block Time is pressed", async () => {
    const { getByText, queryByText } = await render(<TodayScreen />);

    expect(getByText("Start with blocking some time")).toBeTruthy();

    await fireEvent.press(getByText("Block Time"));

    expect(queryByText("Start with blocking some time")).toBeNull();
  });
});
