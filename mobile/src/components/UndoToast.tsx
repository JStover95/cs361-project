import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { Button } from "./Button";

export const UNDO_TOAST_DURATION_MS = 5000;
export const UNDO_TOAST_FADE_MS = 300;
export const SWIPE_DISMISS_THRESHOLD = 20;

type UndoToastProps = {
  taskId: string | null;
  onUndo: () => void;
};

export function UndoToast({ taskId, onUndo }: UndoToastProps) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const stopFade = useCallback(() => {
    fadeAnimationRef.current?.stop();
    fadeAnimationRef.current = null;
  }, []);

  const dismissImmediate = useCallback(() => {
    clearHideTimer();
    stopFade();
    opacity.setValue(0);
    setVisible(false);
  }, [clearHideTimer, opacity, stopFade]);

  const startAutoHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      stopFade();
      const animation = Animated.timing(opacity, {
        toValue: 0,
        duration: UNDO_TOAST_FADE_MS,
        useNativeDriver: false,
      });
      fadeAnimationRef.current = animation;
      animation.start(({ finished }) => {
        fadeAnimationRef.current = null;
        if (finished) {
          setVisible(false);
        }
      });
      // Also schedule unmount via timer so tests with fake timers
      // (and environments where Animated callbacks are unreliable) hide cleanly.
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        setVisible(false);
      }, UNDO_TOAST_FADE_MS);
    }, UNDO_TOAST_DURATION_MS);
  }, [clearHideTimer, opacity, stopFade]);

  useEffect(() => {
    if (taskId == null) {
      dismissImmediate();
      return;
    }

    clearHideTimer();
    stopFade();
    opacity.setValue(1);
    setVisible(true);
    startAutoHide();

    return () => {
      clearHideTimer();
      stopFade();
    };
  }, [
    taskId,
    clearHideTimer,
    dismissImmediate,
    opacity,
    startAutoHide,
    stopFade,
  ]);

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.oldState !== State.ACTIVE) {
        return;
      }

      const { translationX, translationY } = event.nativeEvent;
      if (
        Math.abs(translationX) >= SWIPE_DISMISS_THRESHOLD ||
        Math.abs(translationY) >= SWIPE_DISMISS_THRESHOLD
      ) {
        dismissImmediate();
      }
    },
    [dismissImmediate]
  );

  const handleUndo = useCallback(() => {
    onUndo();
    dismissImmediate();
  }, [onUndo, dismissImmediate]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <PanGestureHandler
        testID="undo-toast-gesture"
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          testID="undo-toast"
          style={[styles.container, { opacity }]}
        >
          <Text style={styles.message}>Task deleted</Text>
          <Button label="Undo" onPress={handleUndo} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 120,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    flexShrink: 1,
  },
});
