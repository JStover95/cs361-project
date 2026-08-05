import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
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
    unscheduleTask,
  } = useTasks();
  const [showIntro, setShowIntro] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [movingTask, setMovingTask] = useState<Task | null>(null);
  const [highlightOffset, setHighlightOffset] = useState<number | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const [dragY, setDragY] = useState<number | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);

  const scheduleRef = useRef<View>(null);
  const rootRef = useRef<View>(null);
  const scheduleTopRef = useRef(0);
  const rootOffsetRef = useRef({ x: 0, y: 0 });
  const movingTaskRef = useRef<Task | null>(null);
  const highlightStartRef = useRef<number | null>(null);
  const deleteButtonBoundsRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const overDeleteRef = useRef(false);

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

  const measureSchedule = useCallback(() => {
    scheduleRef.current?.measureInWindow((_x, y) => {
      scheduleTopRef.current = y;
    });
  }, []);

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      rootOffsetRef.current = { x, y };
    });
  }, []);

  // Remeasure when chrome hides/shows so scheduleTop stays in sync with the card.
  useEffect(() => {
    measureSchedule();
    measureRoot();
  }, [isMoving, measureSchedule, measureRoot]);

  const handleDragStart = useCallback((task: Task) => {
    movingTaskRef.current = task;
    highlightStartRef.current = null;
    overDeleteRef.current = false;
    setMovingTask(task);
    setHighlightOffset(null);
    setDragX(null);
    setDragY(null);
    setIsOverDeleteZone(false);
    // Chrome collapses on the next paint; remeasure after layout settles.
    requestAnimationFrame(() => {
      measureSchedule();
      measureRoot();
    });
  }, [measureSchedule, measureRoot]);

  const handleDragMove = useCallback((absoluteX: number, absoluteY: number) => {
    // Convert window coords → root-local so the ghost top matches window Y
    // (same space the schedule highlight is measured in).
    const localX = absoluteX - rootOffsetRef.current.x;
    const localY = absoluteY - rootOffsetRef.current.y;
    setDragX(localX);
    setDragY(localY);

    const bounds = deleteButtonBoundsRef.current;
    const overDelete =
      bounds != null &&
      localX >= bounds.x &&
      localX <= bounds.x + bounds.width &&
      localY >= bounds.y &&
      localY <= bounds.y + bounds.height;

    overDeleteRef.current = overDelete;
    setIsOverDeleteZone(overDelete);

    if (overDelete) {
      highlightStartRef.current = null;
      setHighlightOffset(null);
      return;
    }

    const relativeY = Math.max(0, absoluteY - scheduleTopRef.current);
    const slotIndex = Math.floor(relativeY / SLOT_HEIGHT);
    const start = SCHEDULE_START_MINUTES + slotIndex * SLOT_MINUTES;
    // Snap the blue shadow to the 30-minute grid slot under the card top —
    // the same start time assigned on drop.
    const snappedOffset = slotIndex * SLOT_HEIGHT;
    highlightStartRef.current = start;
    setHighlightOffset(snappedOffset);
  }, []);

  const handleDragEnd = useCallback(() => {
    const task = movingTaskRef.current;
    const start = highlightStartRef.current;
    const overDelete = overDeleteRef.current;
    movingTaskRef.current = null;
    highlightStartRef.current = null;
    overDeleteRef.current = false;
    setMovingTask(null);
    setHighlightOffset(null);
    setDragX(null);
    setDragY(null);
    setIsOverDeleteZone(false);

    if (!task) {
      return;
    }

    if (overDelete) {
      try {
        unscheduleTask(task.id);
      } catch (e) {
        setScheduleError(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
      return;
    }

    if (start == null) {
      return;
    }

    try {
      scheduleTask(task.id, start);
    } catch (e) {
      setScheduleError(
        e instanceof Error ? e.message : "Something went wrong."
      );
    }
  }, [scheduleTask, unscheduleTask]);

  const handleScheduledDragStateChange = useCallback(
    (task: Task) => (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.ACTIVE) {
        handleDragStart(task);
        return;
      }
      if (event.nativeEvent.oldState === State.ACTIVE) {
        handleDragEnd();
      }
    },
    [handleDragStart, handleDragEnd]
  );

  const handleScheduledDragGesture = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      handleDragMove(
        event.nativeEvent.absoluteX,
        event.nativeEvent.absoluteY
      );
    },
    [handleDragMove]
  );

  const handleDeleteButtonLayout = useCallback((event: LayoutChangeEvent) => {
    deleteButtonBoundsRef.current = event.nativeEvent.layout;
  }, []);

  return (
    <View
      ref={rootRef}
      style={styles.root}
      onLayout={measureRoot}
      testID="today-screen-root"
    >
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
            onLayout={measureSchedule}
          >
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{hour}</Text>
                <View style={styles.hourLine} />
              </View>
            ))}

            {isMoving && highlightOffset != null && (
              <View
                testID="drop-highlight"
                pointerEvents="none"
                style={[
                  styles.dropHighlight,
                  {
                    top: highlightOffset,
                    height: SLOT_HEIGHT,
                  },
                ]}
              />
            )}

            {scheduledTasks.map((task) => {
              const start = task.scheduledStartMinutes!;
              const duration = getDurationMinutes(task.timeRequired);
              const color = getEisenhowerColor(task.importance, task.urgency);
              const isBeingMoved = movingTask?.id === task.id;
              return (
                <View
                  key={task.id}
                  testID={`scheduled-task-${task.id}`}
                  style={[
                    styles.scheduledTask,
                    {
                      top: minutesToOffset(start),
                      height: (duration / 60) * HOUR_HEIGHT,
                      // Keep mounted so the pan gesture is not torn down mid-drag.
                      opacity: isBeingMoved ? 0 : 1,
                    },
                  ]}
                >
                  <PanGestureHandler
                    testID={`task-drag-${task.id}`}
                    onGestureEvent={handleScheduledDragGesture}
                    onHandlerStateChange={handleScheduledDragStateChange(task)}
                    activeOffsetY={[-10, 10]}
                  >
                    <View style={styles.scheduledTaskInner}>
                      <Text
                        style={styles.scheduledTaskTitle}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                      <View
                        style={[
                          styles.scheduledDot,
                          {
                            backgroundColor: COLOR_MAP[color],
                            borderColor:
                              color === "delete"
                                ? "#999999"
                                : COLOR_MAP[color],
                            borderWidth: color === "delete" ? 2 : 0,
                          },
                        ]}
                      />
                    </View>
                  </PanGestureHandler>
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
          onLayout={handleDeleteButtonLayout}
          style={[
            styles.stopMovingButton,
            isOverDeleteZone && styles.stopMovingButtonActive,
          ]}
        >
          <Text style={styles.stopMovingLabel}>×</Text>
        </Pressable>
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

      {isMoving && movingTask && (
        <View
          testID="drag-ghost"
          pointerEvents="none"
          style={[
            styles.dragGhost,
            {
              left: dragX ?? 0,
              top: dragY ?? 0,
            },
          ]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduledTaskInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  stopMovingButtonActive: {
    backgroundColor: COLOR_MAP.red,
  },
  stopMovingLabel: {
    color: "#fff",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "300",
  },
  dragGhost: {
    position: "absolute",
    width: 220,
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
