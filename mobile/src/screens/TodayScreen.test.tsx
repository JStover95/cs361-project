import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { AuthProvider, useAuthContext } from "../context/AuthContext";
import { TasksProvider, useTasks } from "../context/TasksContext";
import { TodayScreen } from "./TodayScreen";

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
});
