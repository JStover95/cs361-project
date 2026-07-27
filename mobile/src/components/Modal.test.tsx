import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders header and children", async () => {
    const { getByText } = await render(
      <Modal
        header="Welcome!"
        rightButton={{ label: "Next", onPress: () => {} }}
      >
        <Text>Modal body content</Text>
      </Modal>
    );

    expect(getByText("Welcome!")).toBeTruthy();
    expect(getByText("Modal body content")).toBeTruthy();
  });

  it("always renders the right button and calls onPress", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Modal
        header="Welcome!"
        rightButton={{ label: "Next", onPress }}
      >
        <Text>Body</Text>
      </Modal>
    );

    expect(getByText("Next")).toBeTruthy();
    await fireEvent.press(getByText("Next"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not render left button when omitted", async () => {
    const { queryByText } = await render(
      <Modal
        header="Welcome!"
        rightButton={{ label: "Next", onPress: () => {} }}
      >
        <Text>Body</Text>
      </Modal>
    );

    expect(queryByText("Back")).toBeNull();
  });

  it("renders left button and calls onPress when provided", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <Modal
        header="Welcome!"
        leftButton={{ label: "Back", onPress }}
        rightButton={{ label: "Next", onPress: () => {} }}
      >
        <Text>Body</Text>
      </Modal>
    );

    expect(getByText("Back")).toBeTruthy();
    await fireEvent.press(getByText("Back"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
