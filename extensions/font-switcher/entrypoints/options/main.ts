import { createNamespacedStorage } from "@hub/shared/storage";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import "./style.css";
import { fontOptions } from "../../lib/fonts";
import { patchDefaultFont } from "../../lib/settings";
import { fontSwitcherDefaults, validateFontSwitcherSettings } from "../../lib/types";

const storage = createNamespacedStorage("font-switcher.settings", fontSwitcherDefaults, "local", {
  validate: validateFontSwitcherSettings,
});
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

function renderAvailability(): void {
  const list = document.querySelector<HTMLUListElement>("#availability");

  if (!list) {
    return;
  }

  list.replaceChildren();

  for (const option of fontOptions) {
    const item = document.createElement("li");
    item.className = "hub-list-item availability-item";
    const label = document.createElement("span");
    label.textContent = option.label;
    const sample = document.createElement("span");
    sample.style.fontFamily = option.family;
    sample.textContent = "永字八法";
    const state = document.createElement("span");
    const available = document.fonts.check(option.check);
    state.textContent = available ? "Available" : "Fallback";
    state.className = available ? "available" : "fallback";
    item.append(label, sample, state);
    list.append(item);
  }
}

async function load(): Promise<void> {
  const settings = await storage.get();
  const select = document.querySelector<HTMLSelectElement>("#default-font");

  if (select) {
    select.value = settings.defaultFont;
  }
}

document.querySelector<HTMLSelectElement>("#default-font")?.addEventListener("change", (event) => {
  void (async () => {
    const value = (event.target as HTMLSelectElement).value as (typeof fontOptions)[number]["key"];
    await storage.patch(patchDefaultFont(await storage.get(), value));
    statusView.set("Saved default font.");
  })();
});

document.querySelector<HTMLButtonElement>("#clear")?.addEventListener("click", () => {
  void (async () => {
    await storage.reset();
    await load();
    statusView.set("Local preferences cleared.");
  })();
});

renderAvailability();
void load();
