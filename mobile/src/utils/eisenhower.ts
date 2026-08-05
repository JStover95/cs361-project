import { Importance, Urgency } from "../types/task";

export type EisenhowerColor = "green" | "blue" | "red" | "delete";
export type Quadrant = "do" | "decide" | "delegate" | "delete";

const QUADRANT_TO_COLOR: Record<Quadrant, EisenhowerColor> = {
  do: "green",
  decide: "blue",
  delegate: "red",
  delete: "delete",
};

export function getQuadrant(
  importance: Importance,
  urgency: Urgency
): Quadrant {
  if (importance === "High" && urgency === "High") {
    return "do";
  }
  if (importance === "High" && urgency === "Low") {
    return "decide";
  }
  if (importance === "Low" && urgency === "High") {
    return "delegate";
  }
  return "delete";
}

export function getEisenhowerColor(
  importance: Importance,
  urgency: Urgency
): EisenhowerColor {
  return QUADRANT_TO_COLOR[getQuadrant(importance, urgency)];
}
