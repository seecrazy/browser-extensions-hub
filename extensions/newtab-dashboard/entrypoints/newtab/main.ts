import { createNamespacedStorage } from "@hub/shared/storage";
import "@hub/shared/ui/styles.css";
import {
  addShortcut,
  addTodo,
  clearCompleted,
  removeShortcut,
  removeTodo,
  toggleTodo,
} from "../../lib/settings";
import { dashboardDefaults, validateDashboardSettings } from "../../lib/types";
import type { DashboardSettings } from "../../lib/types";

const storage = createNamespacedStorage("newtab-dashboard.settings", dashboardDefaults, "local", {
  validate: validateDashboardSettings,
});

const dateLabel = document.querySelector<HTMLParagraphElement>("#date");
const timeLabel = document.querySelector<HTMLHeadingElement>("#time");
const todoList = document.querySelector<HTMLUListElement>("#todos");
const shortcutList = document.querySelector<HTMLUListElement>("#shortcuts");

function renderClock(): void {
  const now = new Date();

  if (dateLabel) {
    dateLabel.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  if (timeLabel) {
    timeLabel.textContent = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function renderTodos(settings: DashboardSettings): void {
  if (!todoList) {
    return;
  }

  todoList.replaceChildren();

  for (const todo of settings.todos) {
    const item = document.createElement("li");
    item.className = "dashboard-list-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", async () => {
      await storage.patch(toggleTodo(await storage.get(), todo.id));
    });
    const label = document.createElement("span");
    label.textContent = todo.text;
    if (todo.done) {
      label.style.textDecoration = "line-through";
      label.style.opacity = "0.6";
    }
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "hub-button hub-button-danger";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${todo.text}`);
    removeButton.addEventListener("click", async () => {
      await storage.patch(removeTodo(await storage.get(), todo.id));
    });
    item.append(checkbox, label, removeButton);
    todoList.append(item);
  }
}

function renderShortcuts(settings: DashboardSettings): void {
  if (!shortcutList) {
    return;
  }

  shortcutList.replaceChildren();

  for (const shortcut of settings.shortcuts) {
    const item = document.createElement("li");
    item.className = "dashboard-shortcut";
    const link = document.createElement("a");
    link.href = shortcut.url;
    link.textContent = shortcut.label;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "hub-button hub-button-danger";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${shortcut.label}`);
    removeButton.addEventListener("click", async () => {
      await storage.patch(removeShortcut(await storage.get(), shortcut.id));
    });
    item.append(link, removeButton);
    shortcutList.append(item);
  }
}

async function render(): Promise<void> {
  const settings = await storage.get();
  renderTodos(settings);
  renderShortcuts(settings);
}

document.querySelector<HTMLFormElement>("#todo-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>("#todo-text");
  const text = input?.value.trim() ?? "";

  if (!text) {
    return;
  }

  await storage.patch(addTodo(await storage.get(), text));

  if (input) {
    input.value = "";
  }
});

document
  .querySelector<HTMLButtonElement>("#clear-completed")
  ?.addEventListener("click", async () => {
    await storage.patch(clearCompleted(await storage.get()));
  });

document
  .querySelector<HTMLFormElement>("#shortcut-form")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const labelInput = document.querySelector<HTMLInputElement>("#shortcut-label");
    const urlInput = document.querySelector<HTMLInputElement>("#shortcut-url");

    if (!urlInput?.value.trim()) {
      return;
    }

    if (!urlInput) {
      return;
    }

    try {
      await storage.patch(
        addShortcut(await storage.get(), labelInput?.value ?? "", urlInput.value),
      );

      if (labelInput) {
        labelInput.value = "";
      }

      urlInput.value = "";
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Invalid shortcut URL.");
    }
  });

renderClock();
window.setInterval(renderClock, 10_000);
storage.subscribe(render);
void render();
