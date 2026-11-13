import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNamespacedStorage } from "../storage";

type TestSettings = {
  schemaVersion: 1;
  name: string;
  count: number;
};

const store = new Map<string, unknown>();
const listeners: Array<(changes: Record<string, { newValue?: unknown }>, area: string) => void> =
  [];

beforeEach(() => {
  store.clear();
  listeners.length = 0;
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store.get(key) })),
        set: vi.fn(async (value: Record<string, unknown>) => {
          for (const [key, nextValue] of Object.entries(value)) {
            store.set(key, nextValue);
          }
        }),
      },
      onChanged: {
        addListener: vi.fn((listener: (typeof listeners)[number]) => {
          listeners.push(listener);
        }),
        removeListener: vi.fn((listener: (typeof listeners)[number]) => {
          const index = listeners.indexOf(listener);

          if (index >= 0) {
            listeners.splice(index, 1);
          }
        }),
      },
    },
  });
});

describe("createNamespacedStorage", () => {
  it("returns defaults and patches namespaced values", async () => {
    const storage = createNamespacedStorage<TestSettings>("test.settings", {
      schemaVersion: 1,
      name: "default",
      count: 0,
    });

    await expect(storage.get()).resolves.toEqual({
      schemaVersion: 1,
      name: "default",
      count: 0,
    });

    await storage.patch({ count: 2 });

    await expect(storage.get()).resolves.toEqual({
      schemaVersion: 1,
      name: "default",
      count: 2,
    });
  });

  it("persists migrated values", async () => {
    store.set("test.settings", {
      schemaVersion: 0,
      label: "old",
    });
    const storage = createNamespacedStorage<TestSettings>(
      "test.settings",
      {
        schemaVersion: 1,
        name: "default",
        count: 0,
      },
      "local",
      {
        migrate: (value) => ({
          schemaVersion: 1,
          name: String(value.label ?? ""),
          count: 1,
        }),
      },
    );

    await expect(storage.get()).resolves.toEqual({
      schemaVersion: 1,
      name: "old",
      count: 1,
    });
    await expect(storage.get()).resolves.toEqual({
      schemaVersion: 1,
      name: "old",
      count: 1,
    });
    expect(store.get("test.settings")).toEqual({
      schemaVersion: 1,
      name: "old",
      count: 1,
    });
  });

  it("notifies subscribers for matching namespaces only", async () => {
    const storage = createNamespacedStorage<TestSettings>("test.settings", {
      schemaVersion: 1,
      name: "default",
      count: 0,
    });
    const listener = vi.fn();
    storage.subscribe(listener);

    listeners[0]?.(
      {
        "other.settings": {
          newValue: {},
        },
      },
      "local",
    );
    listeners[0]?.(
      {
        "test.settings": {
          newValue: {
            schemaVersion: 1,
            name: "next",
            count: 3,
          },
        },
      },
      "local",
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      schemaVersion: 1,
      name: "next",
      count: 3,
    });
  });
});
