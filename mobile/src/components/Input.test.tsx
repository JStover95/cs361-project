import { fireEvent, render } from "@testing-library/react-native";
import { Input } from "./Input";

describe("Input", () => {
  it("renders the label", async () => {
    const { getByText } = await render(
      <Input label="Email" value="" onChangeText={() => {}} />
    );

    expect(getByText("Email")).toBeTruthy();
  });

  it("calls onChangeText when the user types", async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await render(
      <Input label="Email" value="" onChangeText={onChangeText} />
    );

    await fireEvent.changeText(getByLabelText("Email"), "user@example.com");

    expect(onChangeText).toHaveBeenCalledWith("user@example.com");
  });

  it("passes secureTextEntry through for password fields", async () => {
    const { getByLabelText } = await render(
      <Input
        label="Password"
        value=""
        onChangeText={() => {}}
        secureTextEntry
      />
    );

    expect(getByLabelText("Password").props.secureTextEntry).toBe(true);
  });

  it("passes autoCapitalize through", async () => {
    const { getByLabelText } = await render(
      <Input
        label="Email"
        value=""
        onChangeText={() => {}}
        autoCapitalize="none"
      />
    );

    expect(getByLabelText("Email").props.autoCapitalize).toBe("none");
  });

  it("renders an optional placeholder", async () => {
    const { getByPlaceholderText } = await render(
      <Input
        label="Email"
        value=""
        onChangeText={() => {}}
        placeholder="you@example.com"
      />
    );

    expect(getByPlaceholderText("you@example.com")).toBeTruthy();
  });
});
