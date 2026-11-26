const memoryStore = new Map();

module.exports = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn(async (key) => memoryStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key, val) => memoryStore.set(key, val)),
  deleteItemAsync: jest.fn(async (key) => memoryStore.delete(key)),
  __reset: () => memoryStore.clear(),
};
