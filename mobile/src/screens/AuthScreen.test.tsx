import { fireEvent, render } from "@testing-library/react-native";
import { AuthScreen } from "./AuthScreen";

describe("AuthScreen", () => {
  it("renders login mode by default without confirm password", async () => {
    const { getByText, queryByText } = await render(<AuthScreen />);

    expect(getByText("Channtto Scheduler")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
    expect(getByText("Password")).toBeTruthy();
    expect(queryByText("Confirm Password")).toBeNull();
    expect(getByText("Login")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("shows confirm password when Sign Up is pressed in login mode", async () => {
    const { getByText } = await render(<AuthScreen />);

    await fireEvent.press(getByText("Sign Up"));

    expect(getByText("Confirm Password")).toBeTruthy();
  });

  it("hides confirm password when Login is pressed in signup mode", async () => {
    const { getByText, queryByText } = await render(<AuthScreen />);

    await fireEvent.press(getByText("Sign Up"));
    expect(getByText("Confirm Password")).toBeTruthy();

    await fireEvent.press(getByText("Login"));
    expect(queryByText("Confirm Password")).toBeNull();
  });

  it("calls onLoginSuccess when Login is pressed in login mode", async () => {
    const onLoginSuccess = jest.fn();
    const { getByText } = await render(
      <AuthScreen onLoginSuccess={onLoginSuccess} />
    );

    await fireEvent.press(getByText("Login"));

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });
});
