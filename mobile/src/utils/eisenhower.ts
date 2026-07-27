import { Importance, Urgency } from "../types/task";

export type EisenhowerColor = "green" | "blue" | "red" | "delete";

export function getEisenhowerColor(
  importance: Importance,
  urgency: Urgency
): EisenhowerColor {
  if (importance === "High" && urgency === "High") {
    return "green";
  }
  if (importance === "High" && urgency === "Low") {
    return "blue";
  }
  if (importance === "Low" && urgency === "High") {
    return "red";
  }
  return "delete";
}
