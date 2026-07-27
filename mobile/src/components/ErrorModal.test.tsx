import { fireEvent, render } from "@testing-library/react-native";
import { ErrorModal } from "./ErrorModal";

describe("ErrorModal", () => {
  it("renders the error message and Go back button", async () => {
    const onGoBack = jest.fn();
    const { getByText } = await render(
      <ErrorModal message="All fields are required." onGoBack={onGoBack} />
    );

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText("All fields are required.")).toBeTruthy();
    expect(getByText("Go back")).toBeTruthy();
  });

  it("calls onGoBack when Go back is pressed", async () => {
    const onGoBack = jest.fn();
    const { getByText } = await render(
      <ErrorModal message="All fields are required." onGoBack={onGoBack} />
    );

    await fireEvent.press(getByText("Go back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it("hides Try Again when onTryAgain is omitted", async () => {
    const { queryByText } = await render(
      <ErrorModal
        message="All fields are required."
        onGoBack={() => {}}
      />
    );

    expect(queryByText("Try Again")).toBeNull();
  });

  it("shows Try Again and calls onTryAgain when provided", async () => {
    const onTryAgain = jest.fn();
    const { getByText } = await render(
      <ErrorModal
        message="Network error."
        onGoBack={() => {}}
        onTryAgain={onTryAgain}
      />
    );

    expect(getByText("Try Again")).toBeTruthy();
    await fireEvent.press(getByText("Try Again"));
    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });
});
