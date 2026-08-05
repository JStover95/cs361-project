import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { LogoutConfirmation } from "../components/LogoutConfirmation";
import { TaskBottomSheet } from "../components/TaskBottomSheet";
import { Title } from "../components/Title";
import { Tooltip } from "../components/Tooltip";
import { UndoToast } from "../components/UndoToast";
import { WelcomeModal } from "../components/WelcomeModal";
import { useAuthContext } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";

const HOURS = [
  "9:00am",
  "10:00am",
  "11:00am",
  "12:00pm",
  "1:00pm",
  "2:00pm",
  "3:00pm",
  "4:00pm",
  "5:00pm",
  "6:00pm",
  "7:00pm",
  "8:00pm",
  "9:00pm",
];

type TodayScreenProps = {
  onLogout?: () => void;
};

export function TodayScreen({ onLogout }: TodayScreenProps) {
  const { logout } = useAuthContext();
  const {
    lastDeletedTaskId,
    undoDelete,
    simulateFailure,
    setSimulateFailure,
  } = useTasks();
  const [showIntro, setShowIntro] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleIntroFinish = () => {
    setShowIntro(false);
    setShowTooltip(true);
  };

  const handleLogoutPress = () => {
    setShowLogoutConfirmation(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirmation(false);
    onLogout?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Button label="Logout" onPress={handleLogoutPress} />
        <Title text="Channtto" />
        <Switch
          accessibilityLabel="Simulate network failure"
          value={simulateFailure}
          onValueChange={setSimulateFailure}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.todayNav}>
          <Pressable accessibilityRole="button" onPress={() => {}}>
            <Text style={styles.chevron}>‹</Text>
          </Pressable>
          <Title text="Today" />
          <Pressable accessibilityRole="button" onPress={() => {}}>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Button label="View Matrix" onPress={() => {}} />
          <Button label="Block Time" onPress={() => setShowTooltip(false)} />
        </View>

        {showTooltip && (
          <View style={styles.tooltipContainer}>
            <Tooltip message="Start with blocking some time" />
          </View>
        )}

        <ScrollView
          style={styles.schedule}
          contentContainerStyle={styles.scheduleContent}
        >
          {HOURS.map((hour) => (
            <View key={hour} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{hour}</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
        </ScrollView>
      </View>

      <TaskBottomSheet />

      <UndoToast taskId={lastDeletedTaskId} onUndo={undoDelete} />

      {showIntro && <WelcomeModal onFinish={handleIntroFinish} />}

      {showLogoutConfirmation && (
        <LogoutConfirmation
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  todayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  chevron: {
    fontSize: 28,
    color: "#000",
    lineHeight: 32,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
  },
  tooltipContainer: {
    alignItems: "flex-end",
    marginTop: 8,
    paddingRight: 24,
  },
  schedule: {
    flex: 1,
    marginTop: 24,
  },
  scheduleContent: {
    paddingBottom: 120,
  },
  hourRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
  },
  hourLabel: {
    width: 64,
    fontSize: 12,
    color: "#888",
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#D9D9D9",
  },
});
