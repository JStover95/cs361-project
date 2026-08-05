import { Task } from "../types/task";
import { GROUPING_SERVICE_ENDPOINT } from "./constants";
import { getQuadrant, Quadrant } from "./eisenhower";

export type QuadrantGroups = Record<Quadrant, Task[]>;

export async function groupTasksByQuadrant(
  tasks: Task[]
): Promise<QuadrantGroups> {
  const data = tasks.map((task) => ({
    ...task,
    quadrant: getQuadrant(task.importance, task.urgency),
  }));

  const response = await fetch(`${GROUPING_SERVICE_ENDPOINT}/group`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, attribute: "quadrant" }),
  });
  const body = await response.json();
  if (!response.ok || !body.groups) {
    throw new Error("Grouping request failed.");
  }
  return {
    do: (body.groups.do ?? []) as Task[],
    decide: (body.groups.decide ?? []) as Task[],
    delegate: (body.groups.delegate ?? []) as Task[],
    delete: (body.groups.delete ?? []) as Task[],
  };
}
