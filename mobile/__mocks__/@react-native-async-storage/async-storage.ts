const store = new Map<string, string>();

const AsyncStorage = {
  getItem: jest.fn(async (key: string): Promise<string | null> => {
    return store.has(key) ? store.get(key)! : null;
  }),
  setItem: jest.fn(async (key: string, value: string): Promise<void> => {
    store.set(key, value);
  }),
  removeItem: jest.fn(async (key: string): Promise<void> => {
    store.delete(key);
  }),
  clear: jest.fn(async (): Promise<void> => {
    store.clear();
  }),
  __reset: () => {
    store.clear();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    AsyncStorage.removeItem.mockClear();
    AsyncStorage.clear.mockClear();
  },
};

export default AsyncStorage;
