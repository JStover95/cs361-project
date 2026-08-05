import { fireEvent, render } from "@testing-library/react-native";
import { LogoutConfirmation } from "./LogoutConfirmation";

describe("LogoutConfirmation", () => {
  it("renders confirmation message and buttons", async () => {
    const { getByText } = await render(
      <LogoutConfirmation onConfirm={() => {}} onCancel={() => {}} />
    );

    expect(getByText("Log out?")).toBeTruthy();
    expect(getByText("Are you sure you want to log out?")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Log out")).toBeTruthy();
  });

  it("calls onConfirm when Log out is pressed", async () => {
    const onConfirm = jest.fn();
    const { getByText } = await render(
      <LogoutConfirmation onConfirm={onConfirm} onCancel={() => {}} />
    );

    await fireEvent.press(getByText("Log out"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel is pressed", async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <LogoutConfirmation onConfirm={() => {}} onCancel={onCancel} />
    );

    await fireEvent.press(getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
