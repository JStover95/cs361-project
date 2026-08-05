import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { ErrorModal } from "../components/ErrorModal";
import { Title } from "../components/Title";
import { useTasks } from "../context/TasksContext";
import { Task } from "../types/task";
import { Quadrant } from "../utils/eisenhower";
import {
  groupTasksByQuadrant,
  QuadrantGroups,
} from "../utils/groupingService";

const EMPTY_GROUPS: QuadrantGroups = {
  do: [],
  decide: [],
  delegate: [],
  delete: [],
};

const QUADRANT_META: Record<
  Quadrant,
  {
    label: string;
    align: "top" | "bottom";
    labelPosition: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  }
> = {
  do: {
    label: "Do",
    align: "bottom",
    labelPosition: "bottom-left",
  },
  decide: {
    label: "Decide",
    align: "bottom",
    labelPosition: "bottom-right",
  },
  delegate: {
    label: "Delegate",
    align: "top",
    labelPosition: "top-left",
  },
  delete: {
    label: "Delete",
    align: "top",
    labelPosition: "top-right",
  },
};

type MatrixScreenProps = {
  onClose?: () => void;
};

function MatrixTaskCard({ title }: { title: string }) {
  return (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle} numberOfLines={2}>
        {title}
      </Text>
    </View>
  );
}

function QuadrantCell({
  quadrant,
  tasks,
}: {
  quadrant: Quadrant;
  tasks: Task[];
}) {
  const meta = QUADRANT_META[quadrant];
  const bottomAligned = meta.align === "bottom";

  return (
    <View
      testID={`quadrant-${quadrant}`}
      style={[
        styles.quadrant,
        quadrant === "do" && styles.quadrantDo,
        quadrant === "decide" && styles.quadrantDecide,
        quadrant === "delegate" && styles.quadrantDelegate,
        quadrant === "delete" && styles.quadrantDelete,
      ]}
    >
      <Text
        style={[
          styles.quadrantLabel,
          meta.labelPosition === "bottom-left" && styles.labelBottomLeft,
          meta.labelPosition === "bottom-right" && styles.labelBottomRight,
          meta.labelPosition === "top-left" && styles.labelTopLeft,
          meta.labelPosition === "top-right" && styles.labelTopRight,
        ]}
      >
        {meta.label}
      </Text>
      <ScrollView
        testID={`quadrant-scroll-${quadrant}`}
        style={styles.quadrantScroll}
        contentContainerStyle={[
          styles.quadrantScrollContent,
          bottomAligned && styles.quadrantScrollBottom,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tasks.map((task) => (
          <Pressable key={task.id} onPress={() => {}}>
            <MatrixTaskCard title={task.title} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function MatrixScreen({ onClose }: MatrixScreenProps) {
  const { tasks } = useTasks();
  const [groups, setGroups] = useState<QuadrantGroups>(EMPTY_GROUPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const loadGroups = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRetryAction(null);

    groupTasksByQuadrant(tasks)
      .then((result) => {
        if (!cancelled) {
          setGroups(result);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoading(false);
          setError(
            e instanceof Error ? e.message : "Something went wrong."
          );
          setRetryAction(() => () => {
            loadGroups();
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tasks]);

  useEffect(() => {
    return loadGroups();
  }, [loadGroups]);

  const handleGoBack = useCallback(() => {
    setError(null);
    setRetryAction(null);
  }, []);

  const handleTryAgain = useCallback(() => {
    if (!retryAction) {
      return;
    }
    const retry = retryAction;
    setError(null);
    setRetryAction(null);
    retry();
  }, [retryAction]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Title text="Channtto" />
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
          <Button
            label="View Matrix"
            active
            onPress={() => onClose?.()}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#000"
              accessibilityLabel="Loading"
            />
          </View>
        ) : (
          <View style={styles.matrix} testID="matrix-grid">
            <View style={styles.matrixRow}>
              <QuadrantCell quadrant="do" tasks={groups.do} />
              <QuadrantCell quadrant="decide" tasks={groups.decide} />
            </View>
            <View style={styles.matrixRow}>
              <QuadrantCell quadrant="delegate" tasks={groups.delegate} />
              <QuadrantCell quadrant="delete" tasks={groups.delete} />
            </View>
          </View>
        )}
      </View>

      {error && (
        <ErrorModal
          message={error}
          onGoBack={handleGoBack}
          onTryAgain={retryAction ? handleTryAgain : undefined}
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
    backgroundColor: "#E8E8E8",
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 16,
  },
  todayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
  },
  chevron: {
    fontSize: 28,
    color: "#000",
    lineHeight: 32,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 24,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  matrix: {
    flex: 1,
    marginTop: 24,
  },
  matrixRow: {
    flex: 1,
    flexDirection: "row",
  },
  quadrant: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  // Outside margins only; axes are drawn as the shared inner edges.
  quadrantDo: {
    backgroundColor: "#D4EDDA",
    marginTop: 98,
    marginLeft: 64,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#999",
  },
  quadrantDecide: {
    backgroundColor: "#D6EAF8",
    marginTop: 98,
    marginRight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#999",
  },
  quadrantDelegate: {
    backgroundColor: "#F8D7DA",
    marginBottom: 98,
    marginLeft: 64,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "#999",
  },
  quadrantDelete: {
    backgroundColor: "#FFFFFF",
    marginBottom: 98,
    marginRight: 64,
  },
  quadrantLabel: {
    position: "absolute",
    zIndex: 1,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  labelBottomLeft: {
    left: 8,
    bottom: 8,
  },
  labelBottomRight: {
    right: 8,
    bottom: 8,
  },
  labelTopLeft: {
    left: 8,
    top: 8,
  },
  labelTopRight: {
    right: 8,
    top: 8,
  },
  quadrantScroll: {
    flex: 1,
  },
  quadrantScrollContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 28,
    gap: 8,
  },
  quadrantScrollBottom: {
    justifyContent: "flex-end",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  taskTitle: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
});
