import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { act, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { State } from "react-native-gesture-handler";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
  SCHEDULE_OVERLAP_MESSAGE,
  TasksProvider,
  useTasks,
} from "../context/TasksContext";
import { TodayScreen } from "./TodayScreen";

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

type QueriedElement = { props: Record<string, unknown> };

function SeedTasks({
  tasks,
}: {
  tasks: Array<{
    title: string;
    timeRequired: string;
    importance: "High" | "Low";
    urgency: "High" | "Low";
  }>;
}) {
  const { addTask } = useTasks();

  useEffect(() => {
    tasks.forEach((task) => addTask(task));
  }, []);

  return <View />;
}

function LoginProbe() {
  const { userId, login } = useAuthContext();

  return (
    <View>
      <Text testID="auth-user-id">{userId ?? "null"}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => login("user@example.com", "secret")}
      >
        <Text>Login Probe</Text>
      </Pressable>
    </View>
  );
}

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function renderToday(
  seed: Array<{
    title: string;
    timeRequired: string;
    importance: "High" | "Low";
    urgency: "High" | "Low";
  }> = [],
  onLogout?: () => void
) {
  return render(
    <AuthProvider>
      <TasksProvider>
        <LoginProbe />
        <SeedTasks tasks={seed} />
        <TodayScreen onLogout={onLogout} />
      </TasksProvider>
    </AuthProvider>
  );
}

async function completeIntro(
  getByText: (text: string | RegExp) => ReturnType<
    Awaited<ReturnType<typeof renderToday>>["getByText"]
  >
) {
  await fireEvent.press(getByText("Next"));
  await fireEvent.press(getByText("Next"));
  await fireEvent.press(getByText("Done"));
}

function getDragGesture(
  getAllByTestId: (id: string | RegExp) => QueriedElement[],
  index = 0
): QueriedElement {
  const gestures = getAllByTestId(/^task-drag-/) as unknown as QueriedElement[];
  return gestures[index];
}

function startDrag(gesture: QueriedElement) {
  act(() => {
    (
      gesture.props.onHandlerStateChange as
        | ((event: unknown) => void)
        | undefined
    )?.({
      nativeEvent: { state: State.ACTIVE, oldState: State.BEGAN },
    });
  });
}

function moveDrag(gesture: QueriedElement, absoluteY: number) {
  act(() => {
    (gesture.props.onGestureEvent as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { absoluteY },
    });
  });
}

function endDrag(gesture: QueriedElement) {
  act(() => {
    (
      gesture.props.onHandlerStateChange as
        | ((event: unknown) => void)
        | undefined
    )?.({
      nativeEvent: { state: State.END, oldState: State.ACTIVE },
    });
  });
}

function getStyleProp(
  element: QueriedElement,
  key: string
): number | undefined {
  const style = element.props.style;
  const styles = Array.isArray(style) ? style : [style];
  for (const entry of styles) {
    if (entry && typeof entry === "object" && key in entry) {
      return (entry as Record<string, number>)[key];
    }
  }
  return undefined;
}

describe("TodayScreen", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders schedule chrome and welcome intro on mount", async () => {
    const { getByText, queryByText } = await renderToday();

    expect(getByText("Channtto")).toBeTruthy();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("View Matrix")).toBeTruthy();
    expect(getByText("Block Time")).toBeTruthy();
    expect(getByText("Logout")).toBeTruthy();
    expect(getByText("Welcome!")).toBeTruthy();
    expect(
      getByText(
        /With Channtto you can start prioritizing and scheduling to get more out of your day!/
      )
    ).toBeTruthy();
    expect(queryByText("Start with blocking some time")).toBeNull();
    expect(getByText("Tasks")).toBeTruthy();
    expect(getByText("+")).toBeTruthy();
  });

  it("shows tooltip after completing the intro", async () => {
    const { getByText, queryByText } = await renderToday();

    await completeIntro(getByText);

    expect(queryByText("Welcome!")).toBeNull();
    expect(getByText("Start with blocking some time")).toBeTruthy();
  });

  it("hides tooltip when Block Time is pressed after intro", async () => {
    const { getByText, queryByText } = await renderToday();

    await completeIntro(getByText);
    expect(getByText("Start with blocking some time")).toBeTruthy();

    await fireEvent.press(getByText("Block Time"));

    expect(queryByText("Start with blocking some time")).toBeNull();
  });

  it("shows undo toast after deleting a task and restores on Undo", async () => {
    const { getByText, getByLabelText, queryByText } = await renderToday([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    await fireEvent.press(getByLabelText("Delete"));
    await fireEvent.press(getByText("Yes"));

    expect(queryByText("Call mom")).toBeNull();
    expect(getByText("Task deleted")).toBeTruthy();
    expect(getByText("Undo")).toBeTruthy();

    await fireEvent.press(getByText("Undo"));

    expect(queryByText("Task deleted")).toBeNull();
    expect(getByText("Call mom")).toBeTruthy();
  });

  it("toggles simulated network failure via the header switch", async () => {
    const { getByText, getByLabelText, queryByText } = await renderToday([
      {
        title: "Call mom",
        timeRequired: "30m",
        importance: "High",
        urgency: "High",
      },
    ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const failureSwitch = getByLabelText("Simulate network failure");
    expect(failureSwitch).toBeTruthy();

    await fireEvent(failureSwitch, "valueChange", true);

    await fireEvent.press(getByLabelText("Delete"));
    await fireEvent.press(getByText("Yes"));

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText("Network request failed. Please try again.")).toBeTruthy();
    expect(queryByText("Task deleted")).toBeNull();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(
      getByText("Are you sure you want to delete this task?")
    ).toBeTruthy();
  });

  it("pressing Logout shows the confirmation modal", async () => {
    const { getByText } = await renderToday();

    await fireEvent.press(getByText("Logout"));

    expect(getByText("Log out?")).toBeTruthy();
    expect(getByText("Are you sure you want to log out?")).toBeTruthy();
  });

  it("pressing Cancel dismisses the confirmation without logging out", async () => {
    const onLogout = jest.fn();
    const { getByText, queryByText } = await renderToday([], onLogout);

    await fireEvent.press(getByText("Logout"));
    await fireEvent.press(getByText("Cancel"));

    expect(queryByText("Log out?")).toBeNull();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it("confirming logout clears the userId and navigates back", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      await jsonResponse(200, {
        message: "Login successful.",
        user_id: "u-3",
      })
    );
    const onLogout = jest.fn();
    const { getByText, getByTestId, queryByText } = await renderToday(
      [],
      onLogout
    );

    await fireEvent.press(getByText("Login Probe"));
    await waitFor(() => {
      expect(getByTestId("auth-user-id").props.children).toBe("u-3");
    });

    await fireEvent.press(getByText("Logout"));
    await fireEvent.press(getByText("Log out"));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(queryByText("Log out?")).toBeNull();
    expect(getByTestId("auth-user-id").props.children).toBe("null");
  });

  it("enters moving mode when a bottom-sheet task is dragged", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByText, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const gesture = getDragGesture(getAllByTestId as never);
    startDrag(gesture);

    expect(queryByText("Today")).toBeNull();
    expect(queryByText("View Matrix")).toBeNull();
    expect(queryByText("Block Time")).toBeNull();
    // Sheet stays mounted (opacity 0) while the drag gesture is active
    expect(getByTestId("bottom-sheet")).toBeTruthy();
    expect(getByTestId("stop-moving-button")).toBeTruthy();
    expect(getByTestId("drag-ghost")).toBeTruthy();
  });

  it("highlights the 30-minute slot under the dragged task top edge", async () => {
    const { getByText, getByTestId, getAllByTestId } = await renderToday([
      {
        title: "Go to the gym",
        timeRequired: "1h",
        importance: "High",
        urgency: "Low",
      },
    ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const gesture = getDragGesture(getAllByTestId as never);
    startDrag(gesture);
    // absoluteY 120 with scheduleTop=0 -> slotIndex 5 -> 11:30am (690)
    // offset = ((690 - 540) / 60) * 48 = 120
    moveDrag(gesture, 120);

    const highlight = getByTestId("drop-highlight");
    expect(getStyleProp(highlight as never, "top")).toBe(120);
    expect(getStyleProp(highlight as never, "height")).toBe(24);
  });

  it("schedules the task on drop and returns to normal mode", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const gesture = getDragGesture(getAllByTestId as never);
    startDrag(gesture);
    moveDrag(gesture, 120);
    endDrag(gesture);

    expect(getByText("Today")).toBeTruthy();
    expect(getByText("View Matrix")).toBeTruthy();
    expect(getByText("Block Time")).toBeTruthy();
    expect(queryByTestId("stop-moving-button")).toBeNull();
    expect(getByTestId("bottom-sheet")).toBeTruthy();
    expect(queryByTestId(/^task-drag-/)).toBeNull();

    const scheduled = getByTestId(/^scheduled-task-/);
    expect(getByText("Go to the gym")).toBeTruthy();
    // 1h at 11:30 -> top 120, height 48
    expect(getStyleProp(scheduled as never, "top")).toBe(120);
    expect(getStyleProp(scheduled as never, "height")).toBe(48);
  });

  it("does nothing when the stop-moving X button is pressed", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByText, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    const gesture = getDragGesture(getAllByTestId as never);
    startDrag(gesture);

    await fireEvent.press(getByTestId("stop-moving-button"));

    expect(queryByText("Today")).toBeNull();
    expect(getByTestId("stop-moving-button")).toBeTruthy();
    expect(queryByTestId(/^scheduled-task-/)).toBeNull();
    // Still mid-drag: sheet remains mounted so the gesture can continue
    expect(getByTestId("bottom-sheet")).toBeTruthy();
  });

  it("shows a non-retryable error when a dropped task overlaps another", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByText, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
        {
          title: "Read a book",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));

    // Alphabetical: "Go to the gym" is index 0
    const firstGesture = getDragGesture(getAllByTestId as never, 0);
    startDrag(firstGesture);
    moveDrag(firstGesture, 120);
    endDrag(firstGesture);

    expect(getByTestId(/^scheduled-task-/)).toBeTruthy();

    // Only "Read a book" remains in the sheet
    const secondGesture = getDragGesture(getAllByTestId as never, 0);
    startDrag(secondGesture);
    moveDrag(secondGesture, 96);
    endDrag(secondGesture);

    expect(getByText("An error occured!")).toBeTruthy();
    expect(getByText(SCHEDULE_OVERLAP_MESSAGE)).toBeTruthy();
    expect(queryByText("Try Again")).toBeNull();

    // Already back in normal mode after the failed drop
    expect(getByText("Today")).toBeTruthy();
    expect(queryByTestId("stop-moving-button")).toBeNull();
    expect(getByText("Read a book")).toBeTruthy();
    expect(getByTestId(/^task-drag-/)).toBeTruthy();

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("Read a book")).toBeTruthy();
  });
});
