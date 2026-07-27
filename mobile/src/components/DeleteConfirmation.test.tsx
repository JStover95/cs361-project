import { fireEvent, render } from "@testing-library/react-native";
import { DeleteConfirmation } from "./DeleteConfirmation";

describe("DeleteConfirmation", () => {
  it("renders confirmation message and buttons", async () => {
    const { getByText } = await render(
      <DeleteConfirmation onConfirm={() => {}} onCancel={() => {}} />
    );

    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();
    expect(getByText("Yes")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("calls onConfirm when Yes is pressed", async () => {
    const onConfirm = jest.fn();
    const { getByText } = await render(
      <DeleteConfirmation onConfirm={onConfirm} onCancel={() => {}} />
    );

    await fireEvent.press(getByText("Yes"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is pressed", async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <DeleteConfirmation onConfirm={() => {}} onCancel={onCancel} />
    );

    await fireEvent.press(getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
