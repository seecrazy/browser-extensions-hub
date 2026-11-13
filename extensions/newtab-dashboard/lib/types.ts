export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ShortcutItem = {
  id: string;
  label: string;
  url: string;
};

export type DashboardSettings = {
  schemaVersion: 1;
  todos: TodoItem[];
  shortcuts: ShortcutItem[];
};

export const dashboardDefaults: DashboardSettings = {
  schemaVersion: 1,
  todos: [],
  shortcuts: [
    {
      id: "github",
      label: "GitHub",
      url: "https://github.com",
    },
    {
      id: "calendar",
      label: "Calendar",
      url: "https://calendar.google.com",
    },
    {
      id: "mail",
      label: "Mail",
      url: "https://mail.google.com",
    },
  ],
};

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function safeUrl(input: string): string {
  const value = input.trim();

  if (!value) {
    throw new Error("URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  return url.toString();
}

export function validateDashboardSettings(value: unknown): DashboardSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const todos = Array.isArray(record.todos) ? record.todos : [];
  const shortcuts = Array.isArray(record.shortcuts) ? record.shortcuts : [];

  return {
    schemaVersion: 1,
    todos: todos
      .map((item) => {
        const record =
          typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};

        return {
          id: typeof record.id === "string" && record.id ? record.id : createId("todo"),
          text: typeof record.text === "string" ? record.text.slice(0, 200) : "",
          done: record.done === true,
        } satisfies TodoItem;
      })
      .filter((item) => item.text.length > 0)
      .slice(0, 100),
    shortcuts: shortcuts
      .map((item) => {
        const record =
          typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
        const url = typeof record.url === "string" ? record.url : "";

        try {
          return {
            id: typeof record.id === "string" && record.id ? record.id : createId("shortcut"),
            label: typeof record.label === "string" ? record.label.slice(0, 50) : url,
            url: safeUrl(url),
          } satisfies ShortcutItem;
        } catch {
          return null;
        }
      })
      .filter((item): item is ShortcutItem => item !== null)
      .slice(0, 30),
  };
}
