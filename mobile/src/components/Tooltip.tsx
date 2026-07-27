import { StyleSheet, Text, View } from "react-native";

type TooltipProps = {
  message: string;
};

export function Tooltip({ message }: TooltipProps) {
  return (
    <View style={styles.container}>
      <View style={styles.caret} />
      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#000",
  },
  bubble: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  message: {
    color: "#fff",
    fontSize: 14,
  },
});
