import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Importance, Task, Urgency } from "../types/task";

type TaskFields = {
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
};

type TasksContextValue = {
  tasks: Task[];
  addTask: (input: TaskFields) => Task;
  updateTask: (id: string, input: TaskFields) => void;
  deleteTask: (id: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

let nextId = 1;

function createId(): string {
  const id = `task-${nextId}`;
  nextId += 1;
  return id;
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [taskMap, setTaskMap] = useState<Map<string, Task>>(() => new Map());

  const tasks = useMemo(
    () =>
      Array.from(taskMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      ),
    [taskMap]
  );

  const addTask = useCallback((input: TaskFields) => {
    const task: Task = {
      id: createId(),
      ...input,
    };
    setTaskMap((prev) => {
      const next = new Map(prev);
      next.set(task.id, task);
      return next;
    });
    return task;
  }, []);

  const updateTask = useCallback((id: string, input: TaskFields) => {
    setTaskMap((prev) => {
      const existing = prev.get(id);
      if (!existing) {
        return prev;
      }
      const next = new Map(prev);
      next.set(id, { ...existing, ...input });
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTaskMap((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      tasks,
      addTask,
      updateTask,
      deleteTask,
    }),
    [tasks, addTask, updateTask, deleteTask]
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
