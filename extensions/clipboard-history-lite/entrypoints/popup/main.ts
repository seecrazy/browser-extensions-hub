import { injectRuntimeContentScript } from "@hub/shared/injection";
import { createNamespacedStorage } from "@hub/shared/storage";
import { createAdvancedSettings, createLabel, createStatusView } from "@hub/shared/ui";
import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";
import {
  clearClipboardHistory,
  clipboardDefaults,
  isOriginDisabled,
  normalizeOrigin,
  removeClipboardItem,
  removeExpiredItems,
  searchClipboardHistory,
  toggleOrigin,
  validateClipboardSettings,
} from "../../lib/types";
import type { ClipboardItem } from "../../lib/types";

const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const activateButton = document.querySelector<HTMLButtonElement>("#activate");
const originToggleButton = document.querySelector<HTMLButtonElement>("#toggle-origin");
const searchInput = document.querySelector<HTMLInputElement>("#search");
const expiryInput = document.querySelector<HTMLInputElement>("#expiry");
const historyList = document.querySelector<HTMLUListElement>("#history");
const clearButton = document.querySelector<HTMLButtonElement>("#clear");
const expiryLabel = createLabel("Keep items for days", "expiry");
const expiryAdvanced = createAdvancedSettings([expiryLabel, expiryInput as HTMLInputElement], {
  label: "Advanced retention",
});
document.querySelector("#advanced")?.append(expiryAdvanced.root);
const storage = createNamespacedStorage("clipboard-history.settings", clipboardDefaults, "local", {
  validate: validateClipboardSettings,
});
let currentOrigin = "";

async function copyText(item: ClipboardItem): Promise<void> {
  try {
    await navigator.clipboard.writeText(item.text);
    statusView.set("Copied.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Copy failed.", true);
  }
}

async function render(): Promise<void> {
  const settings = removeExpiredItems(await storage.get());
  await storage.patch(settings);
  const items = searchClipboardHistory(settings, searchInput?.value ?? "");

  if (originLabel) {
    originLabel.textContent = currentOrigin || "Unknown origin";
  }

  if (originToggleButton) {
    originToggleButton.textContent = isOriginDisabled(settings, currentOrigin)
      ? "Enable on this site"
      : "Disable on this site";
    originToggleButton.disabled = !currentOrigin;
  }

  if (expiryInput) {
    expiryInput.value = String(settings.expiresAtDays);
  }

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

async function loadOrigin(): Promise<void> {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  currentOrigin = tab?.url ? normalizeOrigin(tab.url) : "";
}

activateButton?.addEventListener("click", async () => {
  try {
    const result = await injectRuntimeContentScript({
      file: "/content-scripts/clipboard-history.js",
    });
    currentOrigin = result.origin ?? currentOrigin;
    statusView.set("Enabled. Copy text on this tab to save it locally.");
    await render();
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "This tab cannot be enabled.", true);
  }
});

originToggleButton?.addEventListener("click", async () => {
  if (!currentOrigin) {
    return;
  }

  await storage.patch(toggleOrigin(await storage.get(), currentOrigin));
  statusView.set("Saved site preference.");
  await render();
});

expiryInput?.addEventListener("change", async () => {
  await storage.patch({
    expiresAtDays: Number(expiryInput.value),
  });
  statusView.set("Saved expiry.");
  await render();
});

searchInput?.addEventListener("input", () => {
  void render();
});

clearButton?.addEventListener("click", async () => {
  await storage.patch(clearClipboardHistory(await storage.get()));
  statusView.set("History cleared.");
  await render();
});

void loadOrigin().then(render);
