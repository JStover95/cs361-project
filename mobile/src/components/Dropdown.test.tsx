import { fireEvent, render } from "@testing-library/react-native";
import { Dropdown } from "./Dropdown";

describe("Dropdown", () => {
  it("renders label and options", async () => {
    const { getByText } = await render(
      <Dropdown
        label="Importance"
        value=""
        options={["High", "Low"]}
        onValueChange={() => {}}
      />
    );

    expect(getByText("Importance")).toBeTruthy();
    expect(getByText("Select...")).toBeTruthy();
    expect(getByText("High")).toBeTruthy();
    expect(getByText("Low")).toBeTruthy();
  });

  it("calls onValueChange when an option is selected", async () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = await render(
      <Dropdown
        label="Importance"
        value=""
        options={["High", "Low"]}
        onValueChange={onValueChange}
      />
    );

    await fireEvent.press(getByLabelText("Select Importance High"));

    expect(onValueChange).toHaveBeenCalledWith("High");
  });
});
