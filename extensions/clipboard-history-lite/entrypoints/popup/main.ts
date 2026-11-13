import { createNamespacedStorage } from "@hub/shared/storage";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import {
  clearClipboardHistory,
  clipboardDefaults,
  removeClipboardItem,
  searchClipboardHistory,
  validateClipboardSettings,
} from "../../lib/types";
import type { ClipboardItem } from "../../lib/types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const activateButton = document.querySelector<HTMLButtonElement>("#activate");
const searchInput = document.querySelector<HTMLInputElement>("#search");
const historyList = document.querySelector<HTMLUListElement>("#history");
const clearButton = document.querySelector<HTMLButtonElement>("#clear");
const storage = createNamespacedStorage("clipboard-history.settings", clipboardDefaults, "local", {
  validate: validateClipboardSettings,
});

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function copyText(item: ClipboardItem): Promise<void> {
  try {
    await navigator.clipboard.writeText(item.text);
    setStatus("Copied.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Copy failed.", true);
  }
}

async function render(): Promise<void> {
  const settings = await storage.get();
  const items = searchClipboardHistory(settings, searchInput?.value ?? "");

  if (!historyList) {
    return;
  }

  historyList.replaceChildren();

  if (items.length === 0) {
    historyList.textContent = "No matching copied text yet.";
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "hub-list-item";
    const text = document.createElement("span");
    text.textContent = item.text.length > 140 ? `${item.text.slice(0, 140)}...` : item.text;
    const actions = document.createElement("div");
    actions.className = "hub-row";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "hub-button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => {
      void copyText(item);
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "hub-button hub-button-danger";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", "Remove copied item");
    deleteButton.addEventListener("click", async () => {
      await storage.patch(removeClipboardItem(await storage.get(), item.id));
    });
    actions.append(copyButton, deleteButton);
    li.append(text, actions);
    historyList.append(li);
  }
}

activateButton?.addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id || !activateButton) {
    setStatus("No active tab available.", true);
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: {
        tabId: tab.id,
      },
      files: ["/content-scripts/clipboard-history.js"],
    });
    setStatus("Enabled. Copy text on this tab to save it locally.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "This tab cannot be enabled.", true);
  }
});

searchInput?.addEventListener("input", () => {
  void render();
});

clearButton?.addEventListener("click", async () => {
  await storage.patch(clearClipboardHistory(await storage.get()));
  setStatus("History cleared.");
});

void render();
