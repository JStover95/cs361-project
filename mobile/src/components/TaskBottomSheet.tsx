import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useTasks } from "../context/TasksContext";
import { Importance, Task, Urgency } from "../types/task";
import { Button } from "./Button";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";

type SheetMode = "list" | "creating" | "updating" | "deleting";

export function TaskBottomSheet() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const sheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<SheetMode>("list");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [returnMode, setReturnMode] = useState<SheetMode>("list");

  const snapPoints = useMemo(() => ["12%", "55%", "90%"], []);

  useEffect(() => {
    sheetRef.current?.snapToIndex(1);
  }, [mode]);

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
      addTask(values);
      goToList();
    },
    [addTask, goToList]
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
      updateTask(selectedTaskId, values);
      goToList();
    },
    [selectedTaskId, updateTask, goToList]
  );

  const handleRequestDelete = useCallback(() => {
    setReturnMode("updating");
    setMode("deleting");
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedTaskId) {
      deleteTask(selectedTaskId);
    }
    goToList();
  }, [selectedTaskId, deleteTask, goToList]);

  const handleCancelDelete = useCallback(() => {
    setMode(returnMode);
  }, [returnMode]);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard
        title={item.title}
        timeRequired={item.timeRequired}
        importance={item.importance}
        urgency={item.urgency}
        onPress={() => handleSelectTask(item)}
      />
    ),
    [handleSelectTask]
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

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      enablePanDownToClose={false}
      enableDynamicSizing={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      footerComponent={renderFooter}
    >
      {mode === "list" && (
        <BottomSheetFlatList
          data={tasks}
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
  );
}

const styles = StyleSheet.create({
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
