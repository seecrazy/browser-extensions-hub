export type StorageAreaName = "local" | "sync";

export type Versioned = {
  schemaVersion: number;
};

export type StorageListener<T> = (value: T) => void;

export type NamespacedStorage<T extends Versioned> = {
  get: () => Promise<T>;
  patch: (patch: Partial<Omit<T, "schemaVersion">>) => Promise<T>;
  reset: () => Promise<T>;
  subscribe: (listener: StorageListener<T>) => () => void;
};

type MigrationFn<T extends Versioned> = (value: Record<string, unknown>) => T;

export function createNamespacedStorage<T extends Versioned>(
  namespace: string,
  defaults: T,
  area: StorageAreaName = "local",
  migrate?: MigrationFn<T>,
): NamespacedStorage<T> {
  const storageArea = chrome.storage[area];

  const normalize = (value: unknown): T => {
    if (typeof value !== "object" || value === null) {
      return { ...defaults };
    }

    const stored = value as Record<string, unknown>;

    if (
      typeof stored.schemaVersion === "number" &&
      stored.schemaVersion !== defaults.schemaVersion &&
      migrate
    ) {
      return migrate(stored);
    }

    return {
      ...defaults,
      ...stored,
    } as T;
  };

  const read = async (): Promise<T> => {
    const result = await storageArea.get(namespace);
    return normalize(result[namespace]);
  };

  return {
    get: read,
    async patch(patch) {
      const current = await read();
      const next: T = {
        ...current,
        ...patch,
        schemaVersion: defaults.schemaVersion,
      };
      await storageArea.set({
        [namespace]: next,
      });
      return next;
    },
    async reset() {
      await storageArea.set({
        [namespace]: defaults,
      });
      return defaults;
    },
    subscribe(listener) {
      const callback: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
        changes,
        changedArea,
      ) => {
        if (changedArea !== area || !(namespace in changes)) {
          return;
        }

        listener(normalize(changes[namespace]?.newValue));
      };

      chrome.storage.onChanged.addListener(callback);
      return () => {
        chrome.storage.onChanged.removeListener(callback);
      };
    },
  };
}
