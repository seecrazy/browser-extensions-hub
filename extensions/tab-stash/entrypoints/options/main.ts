import { createNamespacedStorage } from "@hub/shared/storage";
import "@hub/shared/ui/styles.css";

type TabStashSettings = {
  schemaVersion: number;
  includePinned: boolean;
};

const settingsStorage = createNamespacedStorage<TabStashSettings>("tab-stash.settings", {
  schemaVersion: 1,
  includePinned: false,
});
const status = document.querySelector<HTMLParagraphElement>("#status");
const includePinned = document.querySelector<HTMLInputElement>("#include-pinned");

async function load(): Promise<void> {
  const settings = await settingsStorage.get();
  if (includePinned) {
    includePinned.checked = settings.includePinned;
  }
}

includePinned?.addEventListener("change", async () => {
  await settingsStorage.patch({
    includePinned: includePinned.checked,
  });
  if (status) {
    status.textContent = "Saved.";
    status.classList.add("hub-status-success");
  }
});

void load();
