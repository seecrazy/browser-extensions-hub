import { safeUrl } from "./types";
import type { DashboardSettings, ShortcutItem } from "./types";

export function addTodo(settings: DashboardSettings, text: string): DashboardSettings {
  const value = text.trim().slice(0, 200);

  if (!value) {
    return settings;
  }

  return {
    ...settings,
    todos: [
      {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: value,
        done: false,
      },
      ...settings.todos,
    ].slice(0, 100),
  };
}

export function toggleTodo(settings: DashboardSettings, id: string): DashboardSettings {
  return {
    ...settings,
    todos: settings.todos.map((todo) =>
      todo.id === id
        ? {
            ...todo,
            done: !todo.done,
          }
        : todo,
    ),
  };
}

export function removeTodo(settings: DashboardSettings, id: string): DashboardSettings {
  return {
    ...settings,
    todos: settings.todos.filter((todo) => todo.id !== id),
  };
}

export function clearCompleted(settings: DashboardSettings): DashboardSettings {
  return {
    ...settings,
    todos: settings.todos.filter((todo) => !todo.done),
  };
}

export function addShortcut(
  settings: DashboardSettings,
  label: string,
  url: string,
): DashboardSettings {
  const trimmedLabel = label.trim().slice(0, 50);
  const safe = safeUrl(url);

  return {
    ...settings,
    shortcuts: [
      ...settings.shortcuts,
      {
        id: `shortcut-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label: trimmedLabel || new URL(safe).hostname,
        url: safe,
      } satisfies ShortcutItem,
    ].slice(-30),
  };
}

export function removeShortcut(settings: DashboardSettings, id: string): DashboardSettings {
  return {
    ...settings,
    shortcuts: settings.shortcuts.filter((shortcut) => shortcut.id !== id),
  };
}
