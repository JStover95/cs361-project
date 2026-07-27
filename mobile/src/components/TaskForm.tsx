import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Importance, TaskInput, Urgency } from "../types/task";
import { getEisenhowerColor } from "../utils/eisenhower";
import { validateTask } from "../utils/validateTask";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { Input } from "./Input";

type TaskFormProps = {
  mode: "create" | "update";
  initialValues: TaskInput;
  onSave: (values: {
    title: string;
    timeRequired: string;
    importance: Importance;
    urgency: Urgency;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

const COLOR_MAP = {
  green: "#22C55E",
  blue: "#3B82F6",
  red: "#EF4444",
  delete: "#FFFFFF",
} as const;

export function TaskForm({
  mode,
  initialValues,
  onSave,
  onCancel,
  onDelete,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [timeRequired, setTimeRequired] = useState(initialValues.timeRequired);
  const [importance, setImportance] = useState<Importance | "">(
    initialValues.importance
  );
  const [urgency, setUrgency] = useState<Urgency | "">(initialValues.urgency);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const values: TaskInput = { title, timeRequired, importance, urgency };
    const validationError = validateTask(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onSave({
      title: title.trim(),
      timeRequired: timeRequired.trim(),
      importance: importance as Importance,
      urgency: urgency as Urgency,
    });
  };

  const showColor = mode === "update" && importance !== "" && urgency !== "";
  const color = showColor
    ? getEisenhowerColor(importance as Importance, urgency as Urgency)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {mode === "create" ? "New Task" : "Update Task"}
        </Text>
        {color && (
          <View
            testID="eisenhower-dot"
            style={[
              styles.dot,
              {
                backgroundColor: COLOR_MAP[color],
                borderColor: color === "delete" ? "#999999" : COLOR_MAP[color],
                borderWidth: color === "delete" ? 2 : 0,
              },
            ]}
          />
        )}
      </View>

      <Input label="Title" value={title} onChangeText={setTitle} />
      <Input
        label="Time required"
        value={timeRequired}
        onChangeText={setTimeRequired}
        placeholder="e.g. 1h 30m"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Dropdown
            label="Importance"
            value={importance}
            options={["High", "Low"]}
            onValueChange={(value) => setImportance(value as Importance | "")}
          />
        </View>
        <View style={styles.half}>
          <Dropdown
            label="Urgency"
            value={urgency}
            options={["High", "Low"]}
            onValueChange={(value) => setUrgency(value as Urgency | "")}
          />
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttons}>
        <Button label="Save" onPress={handleSave} />
        <Button label="Cancel" onPress={onCancel} />
      </View>

      {mode === "update" && onDelete && (
        <View style={styles.deleteContainer}>
          <Button label="Delete" onPress={onDelete} color="red" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
  error: {
    color: "#EF4444",
    marginBottom: 12,
    fontSize: 14,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  deleteContainer: {
    alignItems: "center",
    marginTop: 16,
  },
});
