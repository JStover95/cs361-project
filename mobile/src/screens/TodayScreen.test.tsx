import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { act, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { State } from "react-native-gesture-handler";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import {
  NETWORK_ERROR_MESSAGE,
  SCHEDULE_OVERLAP_MESSAGE,
  TasksProvider,
  useTasks,
} from "../context/TasksContext";
import { TIMEDELTA_SERVICE_ENDPOINT } from "../utils/constants";
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
  onLogout?: () => void,
  onViewMatrix?: () => void
) {
  return render(
    <AuthProvider>
      <TasksProvider>
        <LoginProbe />
        <SeedTasks tasks={seed} />
        <TodayScreen onLogout={onLogout} onViewMatrix={onViewMatrix} />
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

function moveDrag(
  gesture: QueriedElement,
  absoluteY: number,
  absoluteX = 0
) {
  act(() => {
    (gesture.props.onGestureEvent as ((event: unknown) => void) | undefined)?.({
      nativeEvent: { absoluteX, absoluteY },
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

function layoutDeleteButton(
  getByTestId: (id: string | RegExp) => QueriedElement,
  layout = { x: 100, y: 400, width: 64, height: 64 }
) {
  const stopButton = getByTestId("stop-moving-button");
  act(() => {
    (
      stopButton.props.onLayout as ((event: unknown) => void) | undefined
    )?.({
      nativeEvent: { layout },
    });
  });
  return stopButton;
}

function getStyleProp(
  element: QueriedElement,
  key: string
): number | string | undefined {
  const style = element.props.style;
  const styles = Array.isArray(style) ? style : [style];
  let value: number | string | undefined;
  for (const entry of styles) {
    if (entry && typeof entry === "object" && key in entry) {
      value = (entry as Record<string, number | string>)[key];
    }
  }
  return value;
}

describe("TodayScreen", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (typeof url === "string" && url.includes("/timedelta")) {
        return jsonResponse(200, {
          ResultingTimestamp: "2000-01-01T12:30:00.000Z",
        });
      }
      return jsonResponse(500, { error: "Unexpected fetch in test" });
    });
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

  it("calls onViewMatrix when the View Matrix button is pressed", async () => {
    const onViewMatrix = jest.fn();
    const { getByText } = await renderToday([], undefined, onViewMatrix);

    await completeIntro(getByText);
    await fireEvent.press(getByText("View Matrix"));

    expect(onViewMatrix).toHaveBeenCalledTimes(1);
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
    // offset = 5 * 24 = 120
    moveDrag(gesture, 120);

    const highlight = getByTestId("drop-highlight");
    expect(getStyleProp(highlight as never, "top")).toBe(120);
    expect(getStyleProp(highlight as never, "height")).toBe(24);

    // Mid-slot finger position still snaps to the same 30-minute grid line
    moveDrag(gesture, 130);
    expect(getStyleProp(getByTestId("drop-highlight") as never, "top")).toBe(
      120
    );
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
    // Scheduled cards are also draggable; the unscheduled sheet list is empty.
    expect(getByTestId(/^scheduled-task-/)).toBeTruthy();
    expect(getAllByTestId(/^task-drag-/)).toHaveLength(1);

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

    // Scheduled card is also draggable; the remaining sheet item is last.
    const gestures = getAllByTestId(/^task-drag-/) as unknown as QueriedElement[];
    const secondGesture = gestures[gestures.length - 1];
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
    expect(getAllByTestId(/^task-drag-/).length).toBeGreaterThanOrEqual(1);

    await fireEvent.press(getByText("Go back"));
    expect(queryByText("An error occured!")).toBeNull();
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("Read a book")).toBeTruthy();
  });

  async function scheduleTaskViaDrag(
    getByText: (text: string | RegExp) => ReturnType<
      Awaited<ReturnType<typeof renderToday>>["getByText"]
    >,
    getAllByTestId: (id: string | RegExp) => QueriedElement[],
    absoluteY = 120
  ) {
    await completeIntro(getByText);
    await fireEvent.press(getByText("Block Time"));
    const gesture = getDragGesture(getAllByTestId as never);
    startDrag(gesture);
    moveDrag(gesture, absoluteY);
    endDrag(gesture);
  }

  it("dragging a scheduled task enters moving mode", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByText } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await scheduleTaskViaDrag(getByText, getAllByTestId as never);

    expect(getByTestId(/^scheduled-task-/)).toBeTruthy();
    const scheduledGesture = getDragGesture(getAllByTestId as never);
    startDrag(scheduledGesture);

    expect(queryByText("Today")).toBeNull();
    expect(getByTestId("stop-moving-button")).toBeTruthy();
    expect(getByTestId("drag-ghost")).toBeTruthy();
    // Original schedule card stays mounted (gesture) but is hidden — no duplicate.
    expect(getStyleProp(getByTestId(/^scheduled-task-/) as never, "opacity")).toBe(
      0
    );
  });

  it("dragging a scheduled task over the schedule still highlights and reschedules on drop", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await scheduleTaskViaDrag(getByText, getAllByTestId as never, 120);

    const scheduledGesture = getDragGesture(getAllByTestId as never);
    startDrag(scheduledGesture);
    // absoluteY 168 with scheduleTop=0 -> slotIndex 7 -> 12:30pm; offset = 168
    moveDrag(scheduledGesture, 168);

    const highlight = getByTestId("drop-highlight");
    expect(getStyleProp(highlight as never, "top")).toBe(168);
    expect(getStyleProp(highlight as never, "height")).toBe(24);

    endDrag(scheduledGesture);

    expect(getByText("Today")).toBeTruthy();
    expect(queryByTestId("stop-moving-button")).toBeNull();
    const scheduled = getByTestId(/^scheduled-task-/);
    expect(getStyleProp(scheduled as never, "top")).toBe(168);
    expect(getStyleProp(scheduled as never, "height")).toBe(48);
  });

  it("dragging over the stop-moving button highlights it red and hides the blue highlight", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await scheduleTaskViaDrag(getByText, getAllByTestId as never);

    const scheduledGesture = getDragGesture(getAllByTestId as never);
    startDrag(scheduledGesture);
    layoutDeleteButton(getByTestId as never);
    // Root-relative coords inside the delete button bounds
    moveDrag(scheduledGesture, 420, 120);

    expect(
      getStyleProp(getByTestId("stop-moving-button") as never, "backgroundColor")
    ).toBe("#EF4444");
    expect(queryByTestId("drop-highlight")).toBeNull();
  });

  it("dropping while hovering over the stop-moving button removes the task from the schedule and returns it to the bottom sheet", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByTestId } =
      await renderToday([
        {
          title: "Go to the gym",
          timeRequired: "1h",
          importance: "High",
          urgency: "Low",
        },
      ]);

    await scheduleTaskViaDrag(getByText, getAllByTestId as never);

    const scheduledGesture = getDragGesture(getAllByTestId as never);
    startDrag(scheduledGesture);
    layoutDeleteButton(getByTestId as never);
    moveDrag(scheduledGesture, 420, 120);
    endDrag(scheduledGesture);

    expect(queryByTestId(/^scheduled-task-/)).toBeNull();
    expect(getByText("Today")).toBeTruthy();
    expect(queryByTestId("stop-moving-button")).toBeNull();
    expect(getByText("Go to the gym")).toBeTruthy();
    expect(getByTestId(/^task-drag-/)).toBeTruthy();
  });

  it("dropping a bottom-sheet task over the stop-moving button while it was never scheduled is a no-op", async () => {
    const { getByText, getByTestId, getAllByTestId, queryByTestId, queryByText } =
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
    layoutDeleteButton(getByTestId as never);
    moveDrag(gesture, 420, 120);
    endDrag(gesture);

    expect(queryByTestId(/^scheduled-task-/)).toBeNull();
    expect(getByText("Today")).toBeTruthy();
    expect(queryByTestId("stop-moving-button")).toBeNull();
    expect(getByText("Go to the gym")).toBeTruthy();
    expect(getByTestId(/^task-drag-/)).toBeTruthy();
    expect(queryByText("An error occured!")).toBeNull();
  });

  it("calls the Timedelta Service when dropping an unscheduled task", async () => {
    const { getByText, getAllByTestId } = await renderToday([
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
    // absoluteY 120 -> slotIndex 5 -> 11:30am (690 minutes)
    moveDrag(gesture, 120);
    endDrag(gesture);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const timedeltaCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) =>
        typeof url === "string" && url.includes("/timedelta")
    );
    expect(timedeltaCalls).toHaveLength(1);
    const url = timedeltaCalls[0][0] as string;
    expect(url.startsWith(`${TIMEDELTA_SERVICE_ENDPOINT}/timedelta?`)).toBe(
      true
    );
    expect(url).toContain("operation=add");
    expect(url).toContain("value=60");
    expect(url).toContain("unit=minutes");
    expect(url).toContain(
      `timestamp=${encodeURIComponent("2000-01-01T11:30:00.000Z")}`
    );
  });

  it("calls the Timedelta Service again when moving a scheduled task", async () => {
    const { getByText, getAllByTestId } = await renderToday([
      {
        title: "Go to the gym",
        timeRequired: "1h",
        importance: "High",
        urgency: "Low",
      },
    ]);

    await scheduleTaskViaDrag(getByText, getAllByTestId as never, 120);

    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.filter(([url]: [string]) =>
          typeof url === "string" && url.includes("/timedelta")
        )
      ).toHaveLength(1);
    });

    const scheduledGesture = getDragGesture(getAllByTestId as never);
    startDrag(scheduledGesture);
    // absoluteY 168 -> slotIndex 7 -> 12:30pm (750 minutes)
    moveDrag(scheduledGesture, 168);
    endDrag(scheduledGesture);

    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.filter(([url]: [string]) =>
          typeof url === "string" && url.includes("/timedelta")
        )
      ).toHaveLength(2);
    });

    const timedeltaCalls = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) =>
        typeof url === "string" && url.includes("/timedelta")
    );
    const moveUrl = timedeltaCalls[1][0] as string;
    expect(moveUrl).toContain(
      `timestamp=${encodeURIComponent("2000-01-01T12:30:00.000Z")}`
    );
    expect(moveUrl).toContain("value=60");
  });

  it("rolls back the scheduled task and shows an error when Timedelta fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/timedelta")) {
        return Promise.reject(new Error("Network error"));
      }
      return jsonResponse(500, { error: "Unexpected fetch in test" });
    });

    const { getByText, getAllByTestId, queryByTestId, queryByText } =
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

    await waitFor(() => {
      expect(getByText("An error occured!")).toBeTruthy();
      expect(getByText(NETWORK_ERROR_MESSAGE)).toBeTruthy();
    });

    expect(queryByTestId(/^scheduled-task-/)).toBeNull();
    expect(getByText("Go to the gym")).toBeTruthy();
    expect(queryByText("Try Again")).toBeNull();
  });

  it("keeps the task scheduled when the Timedelta Service succeeds", async () => {
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
    moveDrag(gesture, 120);
    endDrag(gesture);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(getByTestId(/^scheduled-task-/)).toBeTruthy();
    expect(queryByText("An error occured!")).toBeNull();
    expect(queryByTestId("stop-moving-button")).toBeNull();
  });
});
