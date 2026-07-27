import { useCallback, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

export const REVEAL_WIDTH = 96;
export const DELETE_THRESHOLD = -240;

type SwipeToDeleteProps = {
  children: React.ReactNode;
  onDelete: () => void;
};

export function SwipeToDelete({ children, onDelete }: SwipeToDeleteProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  // The delete action and the card content are both positioned absolutely
  // (so the card always paints on top, fully hiding the delete action at
  // rest). That means the container has no normal-flow child to size
  // itself from, so we measure the card once it lays out and apply that
  // height explicitly, keeping both layers pinned to the same box.
  const [rowHeight, setRowHeight] = useState<number | null>(null);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    setRowHeight(event.nativeEvent.layout.height);
  }, []);

  const onGestureEvent = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const next = Math.min(0, event.nativeEvent.translationX);
      translateX.setValue(next);
    },
    [translateX]
  );

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.oldState !== State.ACTIVE) {
        return;
      }

      const { translationX } = event.nativeEvent;

      if (translationX <= DELETE_THRESHOLD) {
        translateX.setValue(0);
        onDelete();
        return;
      }

      if (translationX <= -REVEAL_WIDTH) {
        translateX.setValue(-REVEAL_WIDTH);
        return;
      }

      translateX.setValue(0);
    },
    [onDelete, translateX]
  );

  return (
    <View
      style={[styles.container, rowHeight != null && { height: rowHeight }]}
    >
      <View style={styles.deleteAction}>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete"
          style={styles.deleteButton}
          hitSlop={8}
        >
          <Ionicons
            testID="swipe-delete-icon"
            name="trash-outline"
            size={20}
            color="#EF4444"
          />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </View>

      <PanGestureHandler
        testID="swipe-to-delete-gesture"
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          testID="swipe-to-delete-content"
          onLayout={handleContentLayout}
          style={[styles.content, { transform: [{ translateX }] }]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  deleteAction: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteLabel: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
