import { createMessageSender } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { tabStashMessages } from "../../lib/messages";
import { tabStashDefaults } from "../../lib/types";

const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const includePinned = document.querySelector<HTMLInputElement>("#include-pinned");
const sendMessage = createMessageSender(tabStashMessages);
const settingsStorage = createNamespacedStorage("tab-stash.settings", tabStashDefaults);

async function load(): Promise<void> {
  const settings = await settingsStorage.get();

  if (includePinned) {
    includePinned.checked = settings.includePinned;
  }
}

async function exportGroups(): Promise<void> {
  const response = await sendMessage({
    type: "TAB_STASH_LIST_GROUPS",
    payload: {
      query: "",
    },
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    return;
  }

  const blob = new Blob([JSON.stringify(response.data, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `tab-stash-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  statusView.set("Exported.");
}

async function importGroups(file: File): Promise<void> {
  try {
    const groups = JSON.parse(await file.text());
    const response = await sendMessage({
      type: "TAB_STASH_IMPORT_GROUPS",
      payload: {
        groups,
      },
    });

    if (!response.ok) {
      statusView.set(response.error.message, true);
      return;
    }

    statusView.set(`Imported ${response.data.imported} group(s).`);
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Unable to import file.", true);
  }
}

includePinned?.addEventListener("change", async () => {
  await settingsStorage.patch({
    includePinned: includePinned.checked,
  });
  statusView.set("Saved.");
});

document.querySelector<HTMLButtonElement>("#export")?.addEventListener("click", () => {
  void exportGroups();
});

document.querySelector<HTMLInputElement>("#import")?.addEventListener("change", (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (file) {
    void importGroups(file);
  }
});

void load();
