import {
  STORAGE_SERVICE_API_KEY,
  STORAGE_SERVICE_ENDPOINT,
} from "./constants";
import {
  createStorageRecord,
  deleteStorageRecord,
  getStorageRecord,
} from "./storageService";

function jsonResponse(status: number, body: object) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("storageService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("createStorageRecord", () => {
    it("posts data and metadata and returns the new id", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(201, { id: "rec-123" })
      );

      const id = await createStorageRecord(
        { title: "Call mom" },
        { source: "mobile" }
      );

      expect(id).toBe("rec-123");
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${STORAGE_SERVICE_ENDPOINT}/api/v1/storage`);
      expect(options.method).toBe("POST");
      expect(options.headers).toEqual({
        "Content-Type": "application/json",
        "X-API-Key": STORAGE_SERVICE_API_KEY,
      });
      expect(JSON.parse(options.body)).toEqual({
        data: { title: "Call mom" },
        metadata: { source: "mobile" },
      });
    });

    it("defaults metadata to an empty object", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(201, { id: "rec-456" })
      );

      await createStorageRecord({ title: "Task" });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(options.body).metadata).toEqual({});
    });

    it("throws when the response is non-2xx", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(400, { detail: "Bad request" })
      );

      await expect(createStorageRecord({ title: "Task" })).rejects.toThrow(
        "Storage create request failed."
      );
    });

    it("throws when the response is missing an id", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(201, { notId: "x" })
      );

      await expect(createStorageRecord({ title: "Task" })).rejects.toThrow(
        "Storage create request failed."
      );
    });
  });

  describe("getStorageRecord", () => {
    it("gets a record by id and returns its data", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(200, {
          id: "rec-123",
          client_id: "MobileAppClient",
          data: { title: "Call mom", importance: "High" },
          metadata: {},
        })
      );

      const data = await getStorageRecord<{ title: string; importance: string }>(
        "rec-123"
      );

      expect(data).toEqual({ title: "Call mom", importance: "High" });
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(
        `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/rec-123`
      );
      expect(options.method).toBe("GET");
      expect(options.headers).toEqual({
        "X-API-Key": STORAGE_SERVICE_API_KEY,
      });
    });

    it("returns null on 404", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(404, { detail: "Record not found or access denied." })
      );

      const data = await getStorageRecord("missing-id");

      expect(data).toBeNull();
    });

    it("throws on other non-2xx responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(500, { detail: "Server error" })
      );

      await expect(getStorageRecord("rec-123")).rejects.toThrow(
        "Storage get request failed."
      );
    });
  });

  describe("deleteStorageRecord", () => {
    it("deletes a record by id", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(200, {
          message: "Record rec-123 successfully deleted.",
        })
      );

      await deleteStorageRecord("rec-123");

      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(
        `${STORAGE_SERVICE_ENDPOINT}/api/v1/storage/rec-123`
      );
      expect(options.method).toBe("DELETE");
      expect(options.headers).toEqual({
        "X-API-Key": STORAGE_SERVICE_API_KEY,
      });
    });

    it("does not throw on 404", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(404, { detail: "Record not found or access denied." })
      );

      await expect(deleteStorageRecord("missing-id")).resolves.toBeUndefined();
    });

    it("throws on other non-2xx responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        await jsonResponse(500, { detail: "Server error" })
      );

      await expect(deleteStorageRecord("rec-123")).rejects.toThrow(
        "Storage delete request failed."
      );
    });
  });
});
