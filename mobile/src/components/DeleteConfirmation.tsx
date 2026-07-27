import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

type DeleteConfirmationProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmation({
  onConfirm,
  onCancel,
}: DeleteConfirmationProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.message}>
        Are you sure you want to delete this task?
      </Text>
      <View style={styles.buttons}>
        <Button label="Yes" onPress={onConfirm} />
        <Button label="Cancel" onPress={onCancel} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
});
