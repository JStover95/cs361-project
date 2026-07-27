import { StyleSheet, Text, View } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Button } from "./Button";

type TaskBottomSheetProps = {
  onAddTask: () => void;
};

export function TaskBottomSheet({ onAddTask }: TaskBottomSheetProps) {
  return (
    <BottomSheet
      snapPoints={["12%", "55%"]}
      index={0}
      enablePanDownToClose={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.addButtonContainer}>
          <Button label="+" onPress={onAddTask} shape="circle" />
        </View>
      </BottomSheetView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
  },
  addButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
