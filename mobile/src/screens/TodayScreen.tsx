import { useCallback, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ErrorModal } from "../components/ErrorModal";
import { LogoutConfirmation } from "../components/LogoutConfirmation";
import { TaskBottomSheet } from "../components/TaskBottomSheet";
import { Title } from "../components/Title";
import { Tooltip } from "../components/Tooltip";
import { UndoToast } from "../components/UndoToast";
import { WelcomeModal } from "../components/WelcomeModal";
import { useAuthContext } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { Task } from "../types/task";
import { getEisenhowerColor } from "../utils/eisenhower";
import { getDurationMinutes } from "../utils/time";

const HOURS = [
  "9:00am",
  "10:00am",
  "11:00am",
  "12:00pm",
  "1:00pm",
  "2:00pm",
  "3:00pm",
  "4:00pm",
  "5:00pm",
  "6:00pm",
  "7:00pm",
  "8:00pm",
  "9:00pm",
];

export const HOUR_HEIGHT = 48;
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = HOUR_HEIGHT / 2;
export const SCHEDULE_START_MINUTES = 9 * 60;

const COLOR_MAP = {
  green: "#22C55E",
  blue: "#3B82F6",
  red: "#EF4444",
  delete: "#FFFFFF",
} as const;

function minutesToOffset(minutes: number): number {
  return ((minutes - SCHEDULE_START_MINUTES) / 60) * HOUR_HEIGHT;
}

type TodayScreenProps = {
  onLogout?: () => void;
};

export function TodayScreen({ onLogout }: TodayScreenProps) {
  const { logout } = useAuthContext();
  const {
    tasks,
    lastDeletedTaskId,
    undoDelete,
    simulateFailure,
    setSimulateFailure,
    scheduleTask,
  } = useTasks();
  const [showIntro, setShowIntro] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [movingTask, setMovingTask] = useState<Task | null>(null);
  const [highlightStart, setHighlightStart] = useState<number | null>(null);
  const [dragY, setDragY] = useState<number | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const scheduleRef = useRef<View>(null);
  const scheduleTopRef = useRef(0);
  const movingTaskRef = useRef<Task | null>(null);
  const highlightStartRef = useRef<number | null>(null);

  const isMoving = movingTask != null;
  const scheduledTasks = tasks.filter(
    (task) => task.scheduledStartMinutes != null
  );

  const handleIntroFinish = () => {
    setShowIntro(false);
    setShowTooltip(true);
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirmation(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirmation(false);
    onLogout?.();
  };

  const handleScheduleLayout = useCallback(() => {
    scheduleRef.current?.measureInWindow((_x, y) => {
      scheduleTopRef.current = y;
    });
  }, []);

  const handleDragStart = useCallback((task: Task) => {
    movingTaskRef.current = task;
    highlightStartRef.current = null;
    setMovingTask(task);
    setHighlightStart(null);
    setDragY(null);
  }, []);

  const handleDragMove = useCallback((absoluteY: number) => {
    const relativeY = Math.max(0, absoluteY - scheduleTopRef.current);
    const slotIndex = Math.floor(relativeY / SLOT_HEIGHT);
    const start = SCHEDULE_START_MINUTES + slotIndex * SLOT_MINUTES;
    highlightStartRef.current = start;
    setHighlightStart(start);
    setDragY(absoluteY);
  }, []);

  const handleDragEnd = useCallback(() => {
    const task = movingTaskRef.current;
    const start = highlightStartRef.current;
    movingTaskRef.current = null;
    highlightStartRef.current = null;
    setMovingTask(null);
    setHighlightStart(null);
    setDragY(null);

    if (!task || start == null) {
      return;
    }

    try {
      scheduleTask(task.id, start);
    } catch (e) {
      setScheduleError(
        e instanceof Error ? e.message : "Something went wrong."
      );
    }
  }, [scheduleTask]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Button label="Logout" onPress={handleLogoutPress} />
        <Title text="Channtto" />
        <Switch
          accessibilityLabel="Simulate network failure"
          value={simulateFailure}
          onValueChange={setSimulateFailure}
        />
      </View>

      <View style={styles.body}>
        {!isMoving && (
          <>
            <View style={styles.todayNav}>
              <Pressable accessibilityRole="button" onPress={() => {}}>
                <Text style={styles.chevron}>‹</Text>
              </Pressable>
              <Title text="Today" />
              <Pressable accessibilityRole="button" onPress={() => {}}>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>

            <View style={styles.actions}>
              <Button label="View Matrix" onPress={() => {}} />
              <Button
                label="Block Time"
                onPress={() => setShowTooltip(false)}
              />
            </View>

            {showTooltip && (
              <View style={styles.tooltipContainer}>
                <Tooltip message="Start with blocking some time" />
              </View>
            )}
          </>
        )}

        <ScrollView
          style={styles.schedule}
          contentContainerStyle={styles.scheduleContent}
          scrollEnabled={!isMoving}
        >
          <View
            ref={scheduleRef}
            style={styles.scheduleGrid}
            onLayout={handleScheduleLayout}
          >
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{hour}</Text>
                <View style={styles.hourLine} />
              </View>
            ))}

            {isMoving && highlightStart != null && (
              <View
                testID="drop-highlight"
                pointerEvents="none"
                style={[
                  styles.dropHighlight,
                  {
                    top: minutesToOffset(highlightStart),
                    height: SLOT_HEIGHT,
                  },
                ]}
              />
            )}

            {scheduledTasks.map((task) => {
              const start = task.scheduledStartMinutes!;
              const duration = getDurationMinutes(task.timeRequired);
              const color = getEisenhowerColor(task.importance, task.urgency);
              return (
                <View
                  key={task.id}
                  testID={`scheduled-task-${task.id}`}
                  style={[
                    styles.scheduledTask,
                    {
                      top: minutesToOffset(start),
                      height: (duration / 60) * HOUR_HEIGHT,
                    },
                  ]}
                >
                  <Text style={styles.scheduledTaskTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                  <View
                    style={[
                      styles.scheduledDot,
                      {
                        backgroundColor: COLOR_MAP[color],
                        borderColor:
                          color === "delete" ? "#999999" : COLOR_MAP[color],
                        borderWidth: color === "delete" ? 2 : 0,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <TaskBottomSheet
        hidden={isMoving}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />

      {isMoving && (
        <Pressable
          testID="stop-moving-button"
          accessibilityRole="button"
          accessibilityLabel="Stop moving"
          onPress={() => {}}
          style={styles.stopMovingButton}
        >
          <Text style={styles.stopMovingLabel}>×</Text>
        </Pressable>
      )}

      {isMoving && movingTask && (
        <View
          testID="drag-ghost"
          pointerEvents="none"
          style={[styles.dragGhost, { top: dragY ?? 0 }]}
        >
          <Text style={styles.scheduledTaskTitle}>{movingTask.title}</Text>
          <View
            style={[
              styles.scheduledDot,
              {
                backgroundColor:
                  COLOR_MAP[
                    getEisenhowerColor(
                      movingTask.importance,
                      movingTask.urgency
                    )
                  ],
              },
            ]}
          />
        </View>
      )}

      <UndoToast taskId={lastDeletedTaskId} onUndo={undoDelete} />

      {showIntro && <WelcomeModal onFinish={handleIntroFinish} />}

      {showLogoutConfirmation && (
        <LogoutConfirmation
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}

      {scheduleError && (
        <ErrorModal
          message={scheduleError}
          onGoBack={() => setScheduleError(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  todayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  chevron: {
    fontSize: 28,
    color: "#000",
    lineHeight: 32,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  tooltipContainer: {
    alignItems: "flex-end",
    marginTop: 8,
    paddingRight: 24,
  },
  schedule: {
    flex: 1,
    marginTop: 24,
  },
  scheduleContent: {
    paddingBottom: 120,
  },
  scheduleGrid: {
    position: "relative",
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    height: HOUR_HEIGHT,
  },
  hourLabel: {
    width: 64,
    fontSize: 12,
    color: "#888",
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D9D9D9",
  },
  dropHighlight: {
    position: "absolute",
    left: 64,
    right: 0,
    backgroundColor: "#BFDBFE",
    borderRadius: 4,
  },
  scheduledTask: {
    position: "absolute",
    left: 64,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduledTaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginRight: 8,
  },
  scheduledDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stopMovingButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  stopMovingLabel: {
    color: "#fff",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "300",
  },
  dragGhost: {
    position: "absolute",
    left: 88,
    right: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 30,
  },
});
