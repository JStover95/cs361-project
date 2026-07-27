import React from "react";
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
});
