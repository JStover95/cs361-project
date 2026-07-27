export type Importance = "High" | "Low";
export type Urgency = "High" | "Low";

export type Task = {
  id: string;
  title: string;
  timeRequired: string;
  importance: Importance;
  urgency: Urgency;
};

export type TaskInput = {
  title: string;
  timeRequired: string;
  importance: Importance | "";
  urgency: Urgency | "";
};
