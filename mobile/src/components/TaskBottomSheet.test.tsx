import { fireEvent, render } from "@testing-library/react-native";
import { TaskBottomSheet } from "./TaskBottomSheet";

describe("TaskBottomSheet", () => {
  it("renders Tasks label and add button", async () => {
    const { getByText } = await render(
      <TaskBottomSheet onAddTask={() => {}} />
    );

    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("calls onAddTask when plus is pressed", async () => {
    const onAddTask = jest.fn();
    const { getByText } = await render(
      <TaskBottomSheet onAddTask={onAddTask} />
    );

    await fireEvent.press(getByText("+"));

    expect(onAddTask).toHaveBeenCalledTimes(1);
  });
});
