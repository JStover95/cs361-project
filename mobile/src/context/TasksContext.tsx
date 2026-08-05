import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Importance, Task, Urgency } from "../types/task";
import { getDurationMinutes } from "../utils/time";
import { useAuthContext } from "./AuthContext";

export const NETWORK_ERROR_MESSAGE =
  "Network request failed. Please try again.";

export const SCHEDULE_OVERLAP_MESSAGE =
  "This task overlaps with another scheduled task.";

type TaskFields = {
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
};

type TasksContextValue = {
  tasks: Task[];
  lastDeletedTaskId: string | null;
  simulateFailure: boolean;
  setSimulateFailure: (value: boolean) => void;
  listTasks: () => Task[];
  addTask: (input: TaskFields) => Task;
  updateTask: (id: string, input: TaskFields) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  scheduleTask: (id: string, startMinutes: number) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

let nextId = 1;

function createId(): string {
  const id = `task-${nextId}`;
  nextId += 1;
  return id;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuthContext();
  const [taskMap, setTaskMap] = useState<Map<string, Task>>(() => new Map());
  const [lastDeletedTaskId, setLastDeletedTaskId] = useState<string | null>(
    null
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const taskMapRef = useRef(taskMap);
  taskMapRef.current = taskMap;
  const simulateFailureRef = useRef(simulateFailure);
  simulateFailureRef.current = simulateFailure;
  const currentUserId = userId ?? "";

  const throwIfSimulatingFailure = useCallback(() => {
    if (simulateFailureRef.current) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
  }, []);

  const tasks = useMemo(
    () =>
      Array.from(taskMap.values())
        .filter((task) => !task.deleted && task.userId === currentUserId)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [taskMap, currentUserId]
  );

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const listTasks = useCallback(() => {
    throwIfSimulatingFailure();
    return tasksRef.current.filter(
      (task) => task.scheduledStartMinutes == null
    );
  }, [throwIfSimulatingFailure]);

  const addTask = useCallback(
    (input: TaskFields) => {
      throwIfSimulatingFailure();
      const task: Task = {
        id: createId(),
        userId: currentUserId,
        ...input,
      };
      setTaskMap((prev) => {
        const next = new Map(prev);
        next.set(task.id, task);
        return next;
      });
      return task;
    },
    [throwIfSimulatingFailure, currentUserId]
  );

  const updateTask = useCallback(
    (id: string, input: TaskFields) => {
      throwIfSimulatingFailure();
      setTaskMap((prev) => {
        const existing = prev.get(id);
        if (!existing || existing.deleted) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, { ...existing, ...input });
        return next;
      });
    },
    [throwIfSimulatingFailure]
  );

  const deleteTask = useCallback(
    (id: string) => {
      throwIfSimulatingFailure();
      const existing = taskMapRef.current.get(id);
      if (!existing || existing.deleted) {
        return;
      }
      setTaskMap((prev) => {
        const current = prev.get(id);
        if (!current || current.deleted) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, { ...current, deleted: true });
        return next;
      });
      setLastDeletedTaskId(id);
    },
    [throwIfSimulatingFailure]
  );

  const undoDelete = useCallback(() => {
    setLastDeletedTaskId((prevId) => {
      if (!prevId) {
        return null;
      }
      setTaskMap((prev) => {
        const existing = prev.get(prevId);
        if (!existing || !existing.deleted) {
          return prev;
        }
        const next = new Map(prev);
        next.set(prevId, { ...existing, deleted: false });
        return next;
      });
      return null;
    });
  }, []);

  const scheduleTask = useCallback(
    (id: string, startMinutes: number) => {
      throwIfSimulatingFailure();
      const existing = taskMapRef.current.get(id);
      if (!existing || existing.deleted) {
        return;
      }

      const duration = getDurationMinutes(existing.timeRequired);
      const endMinutes = startMinutes + duration;

      const overlaps = Array.from(taskMapRef.current.values()).some((other) => {
        if (other.id === id || other.deleted || other.userId !== currentUserId) {
          return false;
        }
        if (other.scheduledStartMinutes == null) {
          return false;
        }
        const otherStart = other.scheduledStartMinutes;
        const otherEnd =
          otherStart + getDurationMinutes(other.timeRequired);
        return startMinutes < otherEnd && otherStart < endMinutes;
      });

      if (overlaps) {
        throw new Error(SCHEDULE_OVERLAP_MESSAGE);
      }

      setTaskMap((prev) => {
        const current = prev.get(id);
        if (!current || current.deleted) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, { ...current, scheduledStartMinutes: startMinutes });
        return next;
      });
    },
    [throwIfSimulatingFailure, currentUserId]
  );

  const value = useMemo(
    () => ({
      tasks,
      lastDeletedTaskId,
      simulateFailure,
      setSimulateFailure,
      listTasks,
      addTask,
      updateTask,
      deleteTask,
      undoDelete,
      scheduleTask,
    }),
    [
      tasks,
      lastDeletedTaskId,
      simulateFailure,
      listTasks,
      addTask,
      updateTask,
      deleteTask,
      undoDelete,
      scheduleTask,
    ]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
