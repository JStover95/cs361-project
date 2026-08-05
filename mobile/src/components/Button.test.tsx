import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the label", async () => {
    const { getByText } = await render(
      <Button label="Login" onPress={() => {}} />
    );

    expect(getByText("Login")).toBeTruthy();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button label="Login" onPress={onPress} />
    );

    await fireEvent.press(getByText("Login"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button label="Login" onPress={onPress} disabled />
    );

    await fireEvent.press(getByText("Login"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders circle shape label and fires onPress", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Button label="+" onPress={onPress} shape="circle" />
    );

    expect(getByText("+")).toBeTruthy();
    await fireEvent.press(getByText("+"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator and does not call onPress when loading", async () => {
    const onPress = jest.fn();
    const { getByLabelText, queryByText, getByRole } = await render(
      <Button label="Login" onPress={onPress} loading />
    );

    expect(queryByText("Login")).toBeNull();
    expect(getByLabelText("Loading")).toBeTruthy();

    await fireEvent.press(getByRole("button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders with an active/black style when active is passed", async () => {
    const { getByRole, getByText } = await render(
      <Button label="View Matrix" onPress={() => {}} active />
    );

    const button = getByRole("button");
    const flatStyle = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style.filter(Boolean))
      : button.props.style;

    expect(flatStyle.backgroundColor).toBe("#000");
    expect(getByText("View Matrix").props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#fff" })])
    );
  });
});
