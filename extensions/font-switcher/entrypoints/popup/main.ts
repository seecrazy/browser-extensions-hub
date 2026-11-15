import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createTabMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import "./style.css";
import { fontOptions } from "../../lib/fonts";
import { fontSwitcherMessages } from "../../lib/messages";
import type { FontKey, FontSwitcherSiteState } from "../../lib/types";

const fontList = document.querySelector<HTMLDivElement>("#font-list");
const previewLarge = document.querySelector<HTMLParagraphElement>("#preview-large");
const previewSmall = document.querySelector<HTMLParagraphElement>("#preview-small");
const siteLabel = document.querySelector<HTMLParagraphElement>("#site");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createTabMessageSender(fontSwitcherMessages);

let selectedKey: FontKey = "";

function createFontItem(option: (typeof fontOptions)[number]): HTMLButtonElement {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "font-item";
  item.dataset.fontKey = option.key;
  item.setAttribute("aria-label", option.label);

  const name = document.createElement("span");
  name.className = "font-name";
  name.textContent = option.label;

  const sample = document.createElement("span");
  sample.className = "font-sample";
  sample.style.fontFamily = option.family;
  sample.textContent = "永字八法 Quick";

  const meta = document.createElement("span");
  meta.className = "font-meta";
  meta.textContent = "Available";

  item.append(name, sample, meta);
  return item;
}

function createDefaultItem(): HTMLButtonElement {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "font-item";
  item.dataset.fontKey = "";
  item.setAttribute("aria-label", "Page default");

  const name = document.createElement("span");
  name.className = "font-name";
  name.textContent = "Page default";
  const sample = document.createElement("span");
  sample.className = "font-sample";
  sample.style.fontFamily = "system-ui, sans-serif";
  sample.textContent = "Aa 0123";

  item.append(name, sample);
  return item;
}

function setPreview(fontKey: FontKey): void {
  const option = fontOptions.find((candidate) => candidate.key === fontKey);
  const family = option?.family ?? "system-ui, sans-serif";

  if (previewLarge) previewLarge.style.fontFamily = family;
  if (previewSmall) previewSmall.style.fontFamily = family;
}

function renderSelection(state: FontSwitcherSiteState): void {
  selectedKey = state.settings.enabled ? state.settings.fontKey : "";
  setPreview(selectedKey);

  if (siteLabel) {
    siteLabel.textContent = state.origin || "Current site";
  }

  fontList?.querySelectorAll<HTMLButtonElement>(".font-item").forEach((item) => {
    const key = (item.dataset.fontKey ?? "") as FontKey;
    item.classList.toggle("selected", key === selectedKey);
  });
}

async function activateTab(): Promise<number | null> {
  const activeTab = await getActiveTab();

  if (!activeTab.tabId) {
    statusView.set("No active tab available.", true);
    return null;
  }

  return activeTab.tabId;
}

async function load(): Promise<void> {
  try {
    const tabId = await activateTab();

    if (!tabId) {
      return;
    }

    await injectRuntimeContentScript({
      file: "/content-scripts/font-switcher.js",
    });
    const response = await sendMessage(tabId, { type: "FONT_SWITCHER_GET_SITE_STATE" });

    if (!response.ok) {
      statusView.set(response.error.message, true);
      return;
    }

    renderSelection(response.data);
    statusView.set("Connected to current tab.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Font Switcher.",
      true,
    );
  }
}

async function applyFont(fontKey: FontKey): Promise<void> {
  const tabId = await activateTab();

  if (!tabId) {
    return;
  }

  const response = await sendMessage(tabId, {
    type: "FONT_SWITCHER_SET_FONT",
    payload: { fontKey },
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    return;
  }

  renderSelection(response.data);
}

fontList?.append(createDefaultItem(), ...fontOptions.map(createFontItem));

fontList?.addEventListener("click", async (event) => {
  const item = (event.target as HTMLElement).closest<HTMLButtonElement>(".font-item");

  if (!item?.dataset.fontKey) {
    return;
  }

  await applyFont(item.dataset.fontKey as FontKey);
});

fontList?.addEventListener("mouseover", (event) => {
  const item = (event.target as HTMLElement).closest<HTMLButtonElement>(".font-item");
  setPreview((item?.dataset.fontKey ?? "") as FontKey);
});

fontList?.addEventListener("mouseleave", () => {
  setPreview(selectedKey);
});

document.querySelector<HTMLButtonElement>("#reset")?.addEventListener("click", () => {
  void applyFont("");
});

document.querySelector<HTMLButtonElement>("#options")?.addEventListener("click", () => {
  void browser.runtime.openOptionsPage();
});

for (const [index, item] of Array.from(
  fontList?.querySelectorAll<HTMLButtonElement>(".font-item") ?? [],
).entries()) {
  const option = fontOptions[index - 1];

  if (index > 0 && option) {
    const available = document.fonts.check(option.check);
    item.classList.toggle("unavailable", !available);
    const meta = item.querySelector<HTMLElement>(".font-meta");

    if (meta && !available) {
      meta.textContent = "Fallback";
    }
  }
}

void load();
