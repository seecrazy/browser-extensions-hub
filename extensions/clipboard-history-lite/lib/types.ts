export type ClipboardItem = {
  id: string;
  text: string;
  createdAt: number;
};

export type ClipboardSettings = {
  schemaVersion: 1;
  history: ClipboardItem[];
  disabledOrigins: string[];
  expiresAtDays: number;
};

export const clipboardDefaults: ClipboardSettings = {
  schemaVersion: 1,
  history: [],
  disabledOrigins: [],
  expiresAtDays: 7,
};

export const MAX_HISTORY_ITEMS = 50;

export function normalizeClipboardText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\u0000/g, "").slice(0, 10_000);
}

export function createClipboardItem(text: string): ClipboardItem {
  const normalized = normalizeClipboardText(text);

  return {
    id: `clipboard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: normalized,
    createdAt: Date.now(),
  };
}

export function addClipboardItem(settings: ClipboardSettings, text: string): ClipboardSettings {
  const item = createClipboardItem(text);

  if (!item.text) {
    return settings;
  }

  const existingIndex = settings.history.findIndex((entry) => entry.text === item.text);
  const withoutDuplicate =
    existingIndex >= 0
      ? settings.history.filter((_, index) => index !== existingIndex)
      : settings.history;

  return {
    schemaVersion: 1,
    disabledOrigins: settings.disabledOrigins,
    expiresAtDays: settings.expiresAtDays,
    history: [item, ...withoutDuplicate].slice(0, MAX_HISTORY_ITEMS),
  };
}

export function removeClipboardItem(settings: ClipboardSettings, id: string): ClipboardSettings {
  return {
    schemaVersion: 1,
    disabledOrigins: settings.disabledOrigins,
    expiresAtDays: settings.expiresAtDays,
    history: settings.history.filter((item) => item.id !== id),
  };
}

export function clearClipboardHistory(_settings: ClipboardSettings): ClipboardSettings {
  return {
    schemaVersion: 1,
    disabledOrigins: [],
    expiresAtDays: 7,
    history: [],
  };
}

export function searchClipboardHistory(
  settings: ClipboardSettings,
  query: string,
): ClipboardItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return settings.history;
  }

  return settings.history.filter(
    (item) =>
      item.text.toLowerCase().includes(normalizedQuery) ||
      new Date(item.createdAt).toLocaleString().toLowerCase().includes(normalizedQuery),
  );
}

export function normalizeOrigin(input: string): string {
  try {
    const url = new URL(input);
    return `${url.protocol}//${url.host}`;
  } catch {
    return input;
  }
}

export function isOriginDisabled(settings: ClipboardSettings, origin: string): boolean {
  return settings.disabledOrigins.includes(normalizeOrigin(origin));
}

export function toggleOrigin(settings: ClipboardSettings, origin: string): ClipboardSettings {
  const normalized = normalizeOrigin(origin);
  const disabled = settings.disabledOrigins.includes(normalized);

  return {
    ...settings,
    disabledOrigins: disabled
      ? settings.disabledOrigins.filter((candidate) => candidate !== normalized)
      : [...settings.disabledOrigins, normalized],
  };
}

export function removeExpiredItems(
  settings: ClipboardSettings,
  now = Date.now(),
): ClipboardSettings {
  const expiresAtDays = Math.min(365, Math.max(1, Math.round(settings.expiresAtDays)));
  const cutoff = now - expiresAtDays * 24 * 60 * 60 * 1000;

  return {
    ...settings,
    history: settings.history.filter((item) => item.createdAt >= cutoff),
  };
}

export function validateClipboardSettings(value: unknown): ClipboardSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const historyValue = Array.isArray(record.history) ? record.history : [];
  const disabledValue = Array.isArray(record.disabledOrigins) ? record.disabledOrigins : [];
  const history = historyValue
    .map((item) => {
      const entry =
        typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};

      return {
        id: typeof entry.id === "string" && entry.id ? entry.id : `clipboard-${Math.random()}`,
        text: normalizeClipboardText(entry.text),
        createdAt: typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
      } satisfies ClipboardItem;
    })
    .filter((item) => item.text.length > 0)
    .slice(0, MAX_HISTORY_ITEMS);

  return {
    schemaVersion: 1,
    history,
    disabledOrigins: [
      ...new Set(disabledValue.filter((origin): origin is string => typeof origin === "string")),
    ],
    expiresAtDays:
      typeof record.expiresAtDays === "number" &&
      record.expiresAtDays >= 1 &&
      record.expiresAtDays <= 365
        ? Math.round(record.expiresAtDays)
        : 7,
  };
}
