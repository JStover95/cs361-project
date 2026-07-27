import { fireEvent, render } from "@testing-library/react-native";
import { act } from "react";
import { AuthScreen, LOGIN_DELAY_MS } from "./AuthScreen";

describe("AuthScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

  it("calls onLoginSuccess after delay when Login is pressed in login mode", async () => {
    const onLoginSuccess = jest.fn();
    const { getByText } = await render(
      <AuthScreen onLoginSuccess={onLoginSuccess} />
    );

    await fireEvent.press(getByText("Login"));

    expect(onLoginSuccess).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(LOGIN_DELAY_MS);
    });

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows loading state on Login button during the delay", async () => {
    const onLoginSuccess = jest.fn();
    const { getByText, getByLabelText, queryByText } = await render(
      <AuthScreen onLoginSuccess={onLoginSuccess} />
    );

    await fireEvent.press(getByText("Login"));

    expect(queryByText("Login")).toBeNull();
    expect(getByLabelText("Loading")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(LOGIN_DELAY_MS);
    });

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
  });
});
