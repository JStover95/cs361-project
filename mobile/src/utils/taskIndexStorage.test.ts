import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTaskIdIndex, setTaskIdIndex } from "./taskIndexStorage";

type AsyncStorageMock = typeof AsyncStorage & {
  __reset: () => void;
};

const mockStorage = AsyncStorage as AsyncStorageMock;

describe("taskIndexStorage", () => {
  beforeEach(() => {
    mockStorage.__reset();
  });

  it("returns null when no index exists for the user", async () => {
    const result = await getTaskIdIndex("user-a");
    expect(result).toBeNull();
    expect(mockStorage.getItem).toHaveBeenCalledWith("task-ids:user-a");
  });

  it("returns the parsed array when an index exists", async () => {
    await mockStorage.setItem(
      "task-ids:user-a",
      JSON.stringify(["id-1", "id-2"])
    );
    mockStorage.getItem.mockClear();

    const result = await getTaskIdIndex("user-a");

    expect(result).toEqual(["id-1", "id-2"]);
    expect(mockStorage.getItem).toHaveBeenCalledWith("task-ids:user-a");
  });

  it("writes the id array under the user-scoped key", async () => {
    await setTaskIdIndex("user-b", ["a", "b", "c"]);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "task-ids:user-b",
      JSON.stringify(["a", "b", "c"])
    );
    expect(await getTaskIdIndex("user-b")).toEqual(["a", "b", "c"]);
  });

  it("scopes indexes by userId", async () => {
    await setTaskIdIndex("user-a", ["a1"]);
    await setTaskIdIndex("user-b", ["b1", "b2"]);

    expect(await getTaskIdIndex("user-a")).toEqual(["a1"]);
    expect(await getTaskIdIndex("user-b")).toEqual(["b1", "b2"]);
  });
});
