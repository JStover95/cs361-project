import { Pressable, StyleSheet, Text, View } from "react-native";
import { Importance, Urgency } from "../types/task";
import { getEisenhowerColor } from "../utils/eisenhower";

type TaskCardProps = {
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
  onPress: () => void;
};

const COLOR_MAP = {
  green: "#22C55E",
  blue: "#3B82F6",
  red: "#EF4444",
  delete: "#FFFFFF",
} as const;

export function TaskCard({
  title,
  timeRequired,
  importance,
  urgency,
  onPress,
}: TaskCardProps) {
  const color = getEisenhowerColor(importance, urgency);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      onLongPress={() => {}}
      accessibilityRole="button"
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.duration}>{timeRequired}</Text>
      </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  duration: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
