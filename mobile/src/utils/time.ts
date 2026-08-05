export function getDurationMinutes(timeRequired: string): number {
  const hoursMatch = timeRequired.match(/(\d+)\s*h/i);
  const minutesMatch = timeRequired.match(/(\d+)\s*m/i);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours * 60 + minutes;
}
