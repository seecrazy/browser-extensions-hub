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
type ValidationFn<T extends Versioned> = (value: unknown) => T;

export type StorageOptions<T extends Versioned> = {
  migrate?: MigrationFn<T>;
  validate?: ValidationFn<T>;
};

export function createNamespacedStorage<T extends Versioned>(
  namespace: string,
  defaults: T,
  area: StorageAreaName = "local",
  options: StorageOptions<T> = {},
): NamespacedStorage<T> {
  const storageArea = chrome.storage[area];

  const normalize = (value: unknown): T => {
    if (value === undefined || value === null) {
      return { ...defaults };
    }

    const stored = value as Record<string, unknown>;

    if (
      typeof stored.schemaVersion === "number" &&
      stored.schemaVersion !== defaults.schemaVersion &&
      options.migrate
    ) {
      return options.migrate(stored);
    }

    if (options.validate) {
      return options.validate(stored);
    }

    return {
      ...defaults,
      ...stored,
    } as T;
  };

  const persist = async (value: T): Promise<void> => {
    await storageArea.set({
      [namespace]: value,
    });
  };

  const read = async (): Promise<T> => {
    const result = await storageArea.get(namespace);
    const normalized = normalize(result[namespace]);

    if (
      options.migrate &&
      typeof result[namespace] === "object" &&
      result[namespace] !== null &&
      (result[namespace] as { schemaVersion?: unknown }).schemaVersion !== defaults.schemaVersion
    ) {
      await persist(normalized);
    }

    return normalized;
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

      if (options.validate) {
        return options.validate(next);
      }

      await persist(next);
      return next;
    },
    async reset() {
      await persist(defaults);
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
