export type Importance = "High" | "Low";
export type Urgency = "High" | "Low";

export type Task = {
  id: string;
  userId: string;
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
  deleted?: boolean;
  /** Minutes since midnight; null/undefined = unscheduled */
  scheduledStartMinutes?: number | null;
};

export type TaskInput = {
  title: string;
  timeRequired: string;
  importance: Importance | "";
  urgency: Urgency | "";
};
