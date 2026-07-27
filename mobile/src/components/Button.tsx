import { Pressable, StyleSheet, Text } from "react-native";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  shape?: "pill" | "circle";
  color?: "grey" | "red";
};

export function Button({
  label,
  onPress,
  disabled = false,
  shape = "pill",
  color = "grey",
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        shape === "circle" && styles.circle,
        color === "red" && styles.red,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[styles.label, shape === "circle" && styles.circleLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#D9D9D9",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  circle: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    width: 56,
    height: 56,
    minWidth: 56,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  red: {
    backgroundColor: "#EF4444",
  },
  label: {
    fontSize: 16,
    color: "#000",
  },
  circleLabel: {
    fontSize: 28,
    lineHeight: 32,
  },
});
