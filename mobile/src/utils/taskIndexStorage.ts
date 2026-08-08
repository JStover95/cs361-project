import AsyncStorage from "@react-native-async-storage/async-storage";

function keyFor(userId: string): string {
  return `task-ids:${userId}`;
}

export async function getTaskIdIndex(
  userId: string
): Promise<string[] | null> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (raw == null) {
    return null;
  }
  return JSON.parse(raw) as string[];
}

export async function setTaskIdIndex(
  userId: string,
  ids: string[]
): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(ids));
}
