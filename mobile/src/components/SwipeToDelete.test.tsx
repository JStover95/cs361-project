import { fireEvent, render } from "@testing-library/react-native";
import { act } from "react";
import { Text, View } from "react-native";
import { State } from "react-native-gesture-handler";
import { DELETE_THRESHOLD, REVEAL_WIDTH, SwipeToDelete } from "./SwipeToDelete";

type QueriedElement = { props: Record<string, unknown> };

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");
  const actual = jest.requireActual("react-native-gesture-handler");

  return {
    ...actual,
    PanGestureHandler: ({
      children,
      testID,
      onGestureEvent,
      onHandlerStateChange,
    }: {
      children: React.ReactNode;
      testID?: string;
      onGestureEvent?: (event: unknown) => void;
      onHandlerStateChange?: (event: unknown) => void;
    }) =>
      React.createElement(
        View,
        {
          testID,
          onGestureEvent,
          onHandlerStateChange,
        },
        children
      ),
  };
});

function getTranslateX(element: QueriedElement): number {
  const style = element.props.style;
  const styles = Array.isArray(style) ? style : [style];
  for (const entry of styles) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const transform = (entry as { transform?: Array<{ translateX?: unknown }> })
      .transform;
    if (!transform) {
      continue;
    }
    for (const item of transform) {
      const value = item.translateX;
      if (typeof value === "number") {
        return value;
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "__getValue" in value &&
        typeof (value as { __getValue: () => number }).__getValue === "function"
      ) {
        return (value as { __getValue: () => number }).__getValue();
      }
    }
  }
  throw new Error("translateX not found on style");
}

function endSwipe(gesture: QueriedElement, translationX: number) {
  act(() => {
    (gesture.props.onGestureEvent as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { translationX },
    });
    (
      gesture.props.onHandlerStateChange as
        ((event: unknown) => void) | undefined
    )?.({
      nativeEvent: { oldState: State.ACTIVE, translationX },
    });
  });
}

describe("SwipeToDelete", () => {
  it("renders wrapped children", async () => {
    const { getByText } = await render(
      <SwipeToDelete onDelete={() => {}}>
        <Text>Task content</Text>
      </SwipeToDelete>
    );

    expect(getByText("Task content")).toBeTruthy();
  });

  it("renders a Delete label and trash icon behind the content", async () => {
    const { getByText, getByTestId } = await render(
      <SwipeToDelete onDelete={() => {}}>
        <Text>Task content</Text>
      </SwipeToDelete>
    );

    expect(getByText("Delete")).toBeTruthy();
    expect(getByTestId("swipe-delete-icon")).toBeTruthy();
  });

  it("snaps back and does not delete on a small swipe", async () => {
    const onDelete = jest.fn();
    const { getByTestId } = await render(
      <SwipeToDelete onDelete={onDelete}>
        <View testID="child" />
      </SwipeToDelete>
    );

    const gesture = getByTestId("swipe-to-delete-gesture");
    const smallSwipe = -REVEAL_WIDTH / 2 + 10;

    endSwipe(gesture, smallSwipe);

    expect(onDelete).not.toHaveBeenCalled();
    expect(getTranslateX(getByTestId("swipe-to-delete-content"))).toBe(0);
  });

  it("reveals Delete action when swipe passes reveal threshold", async () => {
    const onDelete = jest.fn();
    const { getByTestId } = await render(
      <SwipeToDelete onDelete={onDelete}>
        <View testID="child" />
      </SwipeToDelete>
    );

    const gesture = getByTestId("swipe-to-delete-gesture");
    const revealSwipe = -REVEAL_WIDTH - 10;

    endSwipe(gesture, revealSwipe);

    expect(onDelete).not.toHaveBeenCalled();
    expect(getTranslateX(getByTestId("swipe-to-delete-content"))).toBe(
      -REVEAL_WIDTH
    );
  });

  it("calls onDelete when swipe passes delete threshold", async () => {
    const onDelete = jest.fn();
    const { getByTestId } = await render(
      <SwipeToDelete onDelete={onDelete}>
        <View testID="child" />
      </SwipeToDelete>
    );

    const gesture = getByTestId("swipe-to-delete-gesture");

    endSwipe(gesture, DELETE_THRESHOLD);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete is pressed", async () => {
    const onDelete = jest.fn();
    const { getByText } = await render(
      <SwipeToDelete onDelete={onDelete}>
        <View testID="child" />
      </SwipeToDelete>
    );

    await fireEvent.press(getByText("Delete"));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("clamps rightward drag so content stays at 0", async () => {
    const onDelete = jest.fn();
    const { getByTestId } = await render(
      <SwipeToDelete onDelete={onDelete}>
        <View testID="child" />
      </SwipeToDelete>
    );

    const gesture = getByTestId("swipe-to-delete-gesture");

    endSwipe(gesture, 40);

    expect(onDelete).not.toHaveBeenCalled();
    expect(getTranslateX(getByTestId("swipe-to-delete-content"))).toBe(0);
  });
});
