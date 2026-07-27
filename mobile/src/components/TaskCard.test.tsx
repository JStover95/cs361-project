import { fireEvent, render } from "@testing-library/react-native";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("renders title, duration, and eisenhower color indicator", async () => {
    const { getByText, getByTestId } = await render(
      <TaskCard
        title="Make lunch"
        timeRequired="15 min"
        importance="High"
        urgency="High"
        onPress={() => {}}
      />
    );

    expect(getByText("Make lunch")).toBeTruthy();
    expect(getByText("15 min")).toBeTruthy();
    expect(getByTestId("eisenhower-dot").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#22C55E" }),
      ])
    );
  });

  it("calls onPress when tapped", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <TaskCard
        title="Make lunch"
        timeRequired="15 min"
        importance="High"
        urgency="Low"
        onPress={onPress}
      />
    );

    await fireEvent.press(getByText("Make lunch"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders delete quadrant with white fill and grey outline", async () => {
    const { getByTestId } = await render(
      <TaskCard
        title="Archive inbox"
        timeRequired="10m"
        importance="Low"
        urgency="Low"
        onPress={() => {}}
      />
    );

    expect(getByTestId("eisenhower-dot").props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: "#FFFFFF",
          borderColor: "#999999",
          borderWidth: 2,
        }),
      ])
    );
  });
});
