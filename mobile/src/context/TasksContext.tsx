import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Importance, Task, Urgency } from "../types/task";
import {
  createStorageRecord,
  deleteStorageRecord,
  getStorageRecord,
} from "../utils/storageService";
import { getTaskIdIndex, setTaskIdIndex } from "../utils/taskIndexStorage";
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

type StoredTaskData = {
  userId: string;
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
};

type TasksContextValue = {
  tasks: Task[];
  tasksLoading: boolean;
  lastDeletedTaskId: string | null;
  listTasks: () => Task[];
  addTask: (input: TaskFields) => Promise<Task>;
  updateTask: (id: string, input: TaskFields) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
  scheduleTask: (id: string, startMinutes: number) => void;
  unscheduleTask: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [lastDeletedTaskId, setLastDeletedTaskId] = useState<string | null>(
    null
  );
  const taskIdIndexRef = useRef<string[]>([]);
  const lastDeletedTaskRef = useRef<Task | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    let cancelled = false;

    async function loadTasksForUser(currentUserId: string) {
      setTasksLoading(true);
      setTasks([]);
      setLastDeletedTaskId(null);
      lastDeletedTaskRef.current = null;

      try {
        let ids = await getTaskIdIndex(currentUserId);
        if (ids == null) {
          ids = [];
          await setTaskIdIndex(currentUserId, ids);
        }
        if (cancelled) {
          return;
        }
        taskIdIndexRef.current = ids;

        const loaded: Task[] = [];
        for (const id of ids) {
          const data = await getStorageRecord<StoredTaskData>(id);
          if (cancelled) {
            return;
          }
          if (data == null) {
            console.warn(`Task id ${id} not found in storage service`);
            continue;
          }
          loaded.push({
            id,
            userId: data.userId,
            title: data.title,
            timeRequired: data.timeRequired,
            importance: data.importance,
            urgency: data.urgency,
          });
        }

        if (!cancelled) {
          setTasks(sortTasks(loaded));
        }
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
        }
      }
    }

    if (userId == null) {
      setTasks([]);
      setTasksLoading(false);
      taskIdIndexRef.current = [];
      setLastDeletedTaskId(null);
      lastDeletedTaskRef.current = null;
      return;
    }

    loadTasksForUser(userId);

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const listTasks = useCallback(() => {
    return tasksRef.current.filter(
      (task) => task.scheduledStartMinutes == null
    );
  }, []);

  const addTask = useCallback(
    async (input: TaskFields): Promise<Task> => {
      if (userId == null) {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      try {
        const id = await createStorageRecord({
          userId,
          ...input,
        });
        const task: Task = {
          id,
          userId,
          ...input,
        };
        setTasks((prev) => sortTasks([...prev, task]));
        const nextIds = [...taskIdIndexRef.current, id];
        taskIdIndexRef.current = nextIds;
        await setTaskIdIndex(userId, nextIds);
        return task;
      } catch {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
    },
    [userId]
  );

  const updateTask = useCallback(
    async (id: string, input: TaskFields): Promise<void> => {
      if (userId == null) {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      const existing = tasksRef.current.find((task) => task.id === id);
      if (!existing) {
        return;
      }

      let newId: string;
      try {
        newId = await createStorageRecord({
          userId,
          ...input,
        });
      } catch {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }

      const newTask: Task = {
        id: newId,
        userId,
        ...input,
        scheduledStartMinutes: existing.scheduledStartMinutes,
      };

      setTasks((prev) =>
        sortTasks([...prev.filter((task) => task.id !== id), newTask])
      );

      const nextIds = [
        ...taskIdIndexRef.current.filter((taskId) => taskId !== id),
        newId,
      ];
      taskIdIndexRef.current = nextIds;
      await setTaskIdIndex(userId, nextIds);

      try {
        await deleteStorageRecord(id);
      } catch {
        console.warn(`Failed to delete old task record ${id} after update`);
      }
    },
    [userId]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      if (userId == null) {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      const existing = tasksRef.current.find((task) => task.id === id);
      if (!existing) {
        return;
      }

      const nextIds = taskIdIndexRef.current.filter((taskId) => taskId !== id);
      try {
        await setTaskIdIndex(userId, nextIds);
      } catch {
        throw new Error(NETWORK_ERROR_MESSAGE);
      }
      taskIdIndexRef.current = nextIds;

      setTasks((prev) => prev.filter((task) => task.id !== id));
      lastDeletedTaskRef.current = existing;
      setLastDeletedTaskId(id);

      try {
        await deleteStorageRecord(id);
      } catch {
        console.warn(`Failed to delete task record ${id} from storage`);
      }
    },
    [userId]
  );

  const undoDelete = useCallback(async () => {
    const deleted = lastDeletedTaskRef.current;
    if (!deleted) {
      return;
    }
    lastDeletedTaskRef.current = null;
    setLastDeletedTaskId(null);
    await addTask({
      title: deleted.title,
      timeRequired: deleted.timeRequired,
      importance: deleted.importance,
      urgency: deleted.urgency,
    });
  }, [addTask]);

  const scheduleTask = useCallback((id: string, startMinutes: number) => {
    const existing = tasksRef.current.find((task) => task.id === id);
    if (!existing) {
      return;
    }

    const duration = getDurationMinutes(existing.timeRequired);
    const endMinutes = startMinutes + duration;

    const overlaps = tasksRef.current.some((other) => {
      if (other.id === id) {
        return false;
      }
      if (other.scheduledStartMinutes == null) {
        return false;
      }
      const otherStart = other.scheduledStartMinutes;
      const otherEnd = otherStart + getDurationMinutes(other.timeRequired);
      return startMinutes < otherEnd && otherStart < endMinutes;
    });

    if (overlaps) {
      throw new Error(SCHEDULE_OVERLAP_MESSAGE);
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, scheduledStartMinutes: startMinutes } : task
      )
    );
  }, []);

  const unscheduleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id && task.scheduledStartMinutes != null
          ? { ...task, scheduledStartMinutes: null }
          : task
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      tasksLoading,
      lastDeletedTaskId,
      listTasks,
      addTask,
      updateTask,
      deleteTask,
      undoDelete,
      scheduleTask,
      unscheduleTask,
    }),
    [
      tasks,
      tasksLoading,
      lastDeletedTaskId,
      listTasks,
      addTask,
      updateTask,
      deleteTask,
      undoDelete,
      scheduleTask,
      unscheduleTask,
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
