import {
  STORAGE_SERVICE_API_KEY,
  STORAGE_SERVICE_ENDPOINT,
} from "./constants";

export async function createStorageRecord(
  data: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const response = await fetch(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": STORAGE_SERVICE_API_KEY,
    },
    body: JSON.stringify({ data, metadata }),
  });
  const body = await response.json();
  if (!response.ok || typeof body.id !== "string") {
    throw new Error("Storage create request failed.");
  }
  return body.id;
}

export async function getStorageRecord<T>(id: string): Promise<T | null> {
  const response = await fetch(
    `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/${id}`,
    {
      method: "GET",
      headers: {
        "X-API-Key": STORAGE_SERVICE_API_KEY,
      },
    }
  );
  if (response.status === 404) {
    return null;
  }
  const body = await response.json();
  if (!response.ok) {
    throw new Error("Storage get request failed.");
  }
  return body.data as T;
}

export async function deleteStorageRecord(id: string): Promise<void> {
  const response = await fetch(
    `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/${id}`,
    {
      method: "DELETE",
      headers: {
        "X-API-Key": STORAGE_SERVICE_API_KEY,
      },
    }
  );
  if (response.status === 404) {
    return;
  }
  if (!response.ok) {
    throw new Error("Storage delete request failed.");
  }
}
