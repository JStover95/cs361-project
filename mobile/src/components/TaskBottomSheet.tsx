import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { useTasks } from "../context/TasksContext";
import { Importance, Task, Urgency } from "../types/task";
import { Button } from "./Button";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { ErrorModal } from "./ErrorModal";
import { SwipeToDelete } from "./SwipeToDelete";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

type SheetMode = "list" | "creating" | "updating" | "deleting";

type TaskBottomSheetProps = {
  hidden?: boolean;
  onDragStart?: (task: Task) => void;
  onDragMove?: (absoluteX: number, absoluteY: number) => void;
  onDragEnd?: () => void;
};

export function TaskBottomSheet({
  hidden = false,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TaskBottomSheetProps) {
  const { tasks, listTasks, addTask, updateTask, deleteTask } = useTasks();
  const sheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<SheetMode>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [returnMode, setReturnMode] = useState<SheetMode>("list");
  const [listItems, setListItems] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  // Keep the sheet mounted for the duration of an in-flight drag so the
  // PanGestureHandler is not torn down when the parent sets hidden=true.
  const [isDragging, setIsDragging] = useState(false);

  const snapPoints = useMemo(() => ["12%", "55%", "90%"], []);
  const wasHiddenRef = useRef(hidden);

  useEffect(() => {
    sheetRef.current?.snapToIndex(1);
  }, [mode]);

  // While hidden (moving mode), collapse to the closed snap so the sheet is
  // already closed when we transition back to normal. Also snap closed when
  // becoming visible again in case the sheet stayed mounted mid-drag.
  useEffect(() => {
    if (hidden) {
      sheetRef.current?.snapToIndex(0);
    } else if (wasHiddenRef.current) {
      sheetRef.current?.snapToIndex(0);
    }
    wasHiddenRef.current = hidden;
  }, [hidden]);

  const runAction = useCallback((action: () => void) => {
    try {
      action();
      setError(null);
      setRetryAction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setRetryAction(() => () => runAction(action));
    }
  }, []);

  useEffect(() => {
    if (mode !== "list") {
      return;
    }
    runAction(() => setListItems(listTasks()));
  }, [mode, tasks, listTasks, runAction]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const goToList = useCallback(() => {
    setSelectedTaskId(null);
    setMode("list");
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedTaskId(null);
    setMode("creating");
  }, []);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    setMode("updating");
  }, []);

  const handleCreate = useCallback(
    (values: {
      title: string;
      timeRequired: string;
      importance: Importance;
      urgency: Urgency;
    }) => {
      runAction(() => {
        addTask(values);
        goToList();
      });
    },
    [addTask, goToList, runAction]
  );

  const handleUpdate = useCallback(
    (values: {
      title: string;
      timeRequired: string;
      importance: Importance;
      urgency: Urgency;
    }) => {
      if (!selectedTaskId) {
        return;
      }
      runAction(() => {
        updateTask(selectedTaskId, values);
        goToList();
      });
    },
    [selectedTaskId, updateTask, goToList, runAction]
  );

  const handleRequestDelete = useCallback(() => {
    setReturnMode("updating");
    setMode("deleting");
  }, []);

  const handleSwipeDelete = useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    setReturnMode("list");
    setMode("deleting");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!selectedTaskId) {
      return;
    }
    runAction(() => {
      deleteTask(selectedTaskId);
      goToList();
    });
  }, [selectedTaskId, deleteTask, goToList, runAction]);

  const handleCancelDelete = useCallback(() => {
    setMode(returnMode);
  }, [returnMode]);

  const handleGoBack = useCallback(() => {
    setError(null);
    setRetryAction(null);
  }, []);

  const handleTryAgain = useCallback(() => {
    if (!retryAction) {
      return;
    }
    const retry = retryAction;
    setError(null);
    setRetryAction(null);
    retry();
  }, [retryAction]);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => {
      const handleDragStateChange = (
        event: PanGestureHandlerStateChangeEvent
      ) => {
        if (event.nativeEvent.state === State.ACTIVE) {
          setIsDragging(true);
          onDragStart?.(item);
          return;
        }
        if (event.nativeEvent.oldState === State.ACTIVE) {
          setIsDragging(false);
          onDragEnd?.();
        }
      };

      const handleDragGesture = (event: PanGestureHandlerGestureEvent) => {
        onDragMove?.(
          event.nativeEvent.absoluteX,
          event.nativeEvent.absoluteY
        );
      };

      return (
        <PanGestureHandler
          testID={`task-drag-${item.id}`}
          onGestureEvent={handleDragGesture}
          onHandlerStateChange={handleDragStateChange}
          activeOffsetY={[-10, 10]}
        >
          <View>
            <SwipeToDelete onDelete={() => handleSwipeDelete(item)}>
              <TaskCard
                title={item.title}
                timeRequired={item.timeRequired}
                importance={item.importance}
                urgency={item.urgency}
                onPress={() => handleSelectTask(item)}
              />
            </SwipeToDelete>
          </View>
        </PanGestureHandler>
      );
    },
    [handleSelectTask, handleSwipeDelete, onDragStart, onDragMove, onDragEnd]
  );

  const renderListHeader = useCallback(
    () => <Text style={styles.title}>Tasks</Text>,
    []
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (mode !== "list") {
        return null;
      }

      return (
        <BottomSheetFooter {...props} bottomInset={24}>
          <View style={styles.addButtonContainer}>
            <Button label="+" onPress={handleAdd} shape="circle" />
          </View>
        </BottomSheetFooter>
      );
    },
    [mode, handleAdd]
  );

  // Unmount only when hidden AND no drag is in flight. Unmounting mid-drag
  // destroys the PanGestureHandler and freezes moving mode.
  if (hidden && !isDragging) {
    return null;
  }

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        containerStyle={hidden ? styles.hiddenSheet : undefined}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        footerComponent={renderFooter}
      >
        {mode === "list" && (
          <BottomSheetFlatList
            data={listItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={styles.listContent}
          />
        )}

        {mode === "creating" && (
          <BottomSheetView style={styles.formContainer}>
            <Text style={styles.title}>Tasks</Text>
            <TaskForm
              mode="create"
              initialValues={{
                title: "",
                timeRequired: "",
                importance: "",
                urgency: "",
              }}
              onSave={handleCreate}
              onCancel={goToList}
            />
          </BottomSheetView>
        )}

        {mode === "updating" && selectedTask && (
          <BottomSheetView style={styles.formContainer}>
            <Text style={styles.title}>Tasks</Text>
            <TaskForm
              mode="update"
              initialValues={{
                title: selectedTask.title,
                timeRequired: selectedTask.timeRequired,
                importance: selectedTask.importance,
                urgency: selectedTask.urgency,
              }}
              onSave={handleUpdate}
              onCancel={goToList}
              onDelete={handleRequestDelete}
            />
          </BottomSheetView>
        )}

        {mode === "deleting" && (
          <BottomSheetView style={styles.formContainer}>
            <Text style={styles.title}>Tasks</Text>
            <DeleteConfirmation
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          </BottomSheetView>
        )}
      </BottomSheet>

      {error && (
        <ErrorModal
          message={error}
          onGoBack={handleGoBack}
          onTryAgain={retryAction ? handleTryAgain : undefined}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hiddenSheet: {
    opacity: 0,
  },
  sheetBackground: {
    backgroundColor: "#D9D9D9",
  },
  handleIndicator: {
    backgroundColor: "#999",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  addButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
