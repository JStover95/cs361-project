import { TaskInput } from "../types/task";

const TIME_REQUIRED_PATTERN = /^(\d+\s*h|\d+\s*m|\d+\s*h\w*\s*\d+\s*m)$/i;

export function validateTask(input: TaskInput): string | null {
  if (
    !input.title.trim() ||
    !input.timeRequired.trim() ||
    !input.importance ||
    !input.urgency
  ) {
    return "All fields are required.";
  }

  if (!TIME_REQUIRED_PATTERN.test(input.timeRequired.trim())) {
    return "Time required must be a valid format (e.g. 1h, 30m, or 1h 30m).";
  }

  return null;
}
