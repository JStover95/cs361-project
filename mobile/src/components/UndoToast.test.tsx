import { fireEvent, render } from "@testing-library/react-native";
import { act } from "react";
import { State } from "react-native-gesture-handler";
import {
  SWIPE_DISMISS_THRESHOLD,
  UNDO_TOAST_DURATION_MS,
  UNDO_TOAST_FADE_MS,
  UndoToast,
} from "./UndoToast";

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
      onHandlerStateChange,
    }: {
      children: React.ReactNode;
      testID?: string;
      onHandlerStateChange?: (event: unknown) => void;
    }) =>
      React.createElement(
        View,
        {
          testID,
          onHandlerStateChange,
        },
        children
      ),
  };
});

function endSwipe(
  gesture: QueriedElement,
  translationX: number,
  translationY: number
) {
  act(() => {
    (
      gesture.props.onHandlerStateChange as
        | ((event: unknown) => void)
        | undefined
    )?.({
      nativeEvent: {
        oldState: State.ACTIVE,
        translationX,
        translationY,
      },
    });
  });
}

describe("UndoToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when taskId is null", async () => {
    const { queryByText } = await render(
      <UndoToast taskId={null} onUndo={() => {}} />
    );

    expect(queryByText("Task deleted")).toBeNull();
    expect(queryByText("Undo")).toBeNull();
  });

  it("shows Task deleted and Undo when taskId becomes non-null", async () => {
    const { getByText, rerender } = await render(
      <UndoToast taskId={null} onUndo={() => {}} />
    );

    await act(async () => {
      rerender(<UndoToast taskId="task-1" onUndo={() => {}} />);
    });

    expect(getByText("Task deleted")).toBeTruthy();
    expect(getByText("Undo")).toBeTruthy();
  });

  it("calls onUndo and hides when Undo is pressed", async () => {
    const onUndo = jest.fn();
    const { getByText, queryByText } = await render(
      <UndoToast taskId="task-1" onUndo={onUndo} />
    );

    await fireEvent.press(getByText("Undo"));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(queryByText("Task deleted")).toBeNull();
  });

  it("auto-hides after 5 seconds", async () => {
    const { getByText, queryByText } = await render(
      <UndoToast taskId="task-1" onUndo={() => {}} />
    );

    expect(getByText("Task deleted")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_TOAST_DURATION_MS + UNDO_TOAST_FADE_MS);
    });

    expect(queryByText("Task deleted")).toBeNull();
  });

  it("hides immediately on swipe without calling onUndo", async () => {
    const onUndo = jest.fn();
    const { getByTestId, queryByText } = await render(
      <UndoToast taskId="task-1" onUndo={onUndo} />
    );

    endSwipe(getByTestId("undo-toast-gesture"), SWIPE_DISMISS_THRESHOLD, 0);

    expect(onUndo).not.toHaveBeenCalled();
    expect(queryByText("Task deleted")).toBeNull();
  });

  it("hides immediately on vertical swipe", async () => {
    const onUndo = jest.fn();
    const { getByTestId, queryByText } = await render(
      <UndoToast taskId="task-1" onUndo={onUndo} />
    );

    endSwipe(getByTestId("undo-toast-gesture"), 0, -SWIPE_DISMISS_THRESHOLD);

    expect(onUndo).not.toHaveBeenCalled();
    expect(queryByText("Task deleted")).toBeNull();
  });

  it("restarts the 5 second window when taskId changes while visible", async () => {
    const { getByText, queryByText, rerender } = await render(
      <UndoToast taskId="task-1" onUndo={() => {}} />
    );

    expect(getByText("Task deleted")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_TOAST_DURATION_MS - 1000);
    });

    await act(async () => {
      rerender(<UndoToast taskId="task-2" onUndo={() => {}} />);
    });

    expect(getByText("Task deleted")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_TOAST_DURATION_MS - 500);
    });

    expect(getByText("Task deleted")).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(UNDO_TOAST_DURATION_MS + UNDO_TOAST_FADE_MS);
    });

    expect(queryByText("Task deleted")).toBeNull();
  });
});
