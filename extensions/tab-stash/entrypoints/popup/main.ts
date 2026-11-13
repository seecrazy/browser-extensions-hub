import { sendMessage } from "@hub/shared/messaging";
import { clearElement } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";

type StashGroup = {
  id: string;
  createdAt: number;
  tabs: Array<{
    id: string;
    title: string;
    url: string;
  }>;
};

const status = document.querySelector<HTMLParagraphElement>("#status");
const groupsContainer = document.querySelector<HTMLDivElement>("#groups");

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function stashTabs(): Promise<void> {
  setStatus("Stashing tabs...");
  const response = await sendMessage<"TAB_STASH_STASH_WINDOW", { count: number }>({
    type: "TAB_STASH_STASH_WINDOW",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  setStatus(
    response.data.count > 0 ? `Stashed ${response.data.count} tabs.` : "No stashable tabs.",
  );
  await renderGroups();
}

async function renderGroups(): Promise<void> {
  const response = await sendMessage<"TAB_STASH_LIST_GROUPS", StashGroup[]>({
    type: "TAB_STASH_LIST_GROUPS",
  });

  if (!response.ok || !groupsContainer) {
    setStatus(response.ok ? "Unable to render groups." : response.error.message, true);
    return;
  }

  clearElement(groupsContainer);

  if (response.data.length === 0) {
    groupsContainer.textContent = "No stashed tabs yet.";
    return;
  }

  for (const group of response.data) {
    const card = document.createElement("div");
    card.className = "hub-card";
    const title = document.createElement("div");
    title.textContent = `${new Date(group.createdAt).toLocaleString()} · ${group.tabs.length} tabs`;
    card.append(title);
    const list = document.createElement("ul");
    list.className = "hub-list";

    for (const tab of group.tabs) {
      const item = document.createElement("li");
      item.className = "hub-list-item";
      const link = document.createElement("button");
      link.type = "button";
      link.className = "hub-button-secondary hub-button";
      link.textContent = tab.title || tab.url;
      link.addEventListener("click", async () => {
        await sendMessage<"TAB_STASH_RESTORE_TAB", { restored: boolean }>({
          type: "TAB_STASH_RESTORE_TAB",
          payload: {
            groupId: group.id,
            tabId: tab.id,
          },
        });
        await renderGroups();
      });
      item.append(link);
      list.append(item);
    }

    const actions = document.createElement("div");
    actions.className = "hub-row";
    const restoreAll = document.createElement("button");
    restoreAll.type = "button";
    restoreAll.className = "hub-button";
    restoreAll.textContent = "Restore all";
    restoreAll.addEventListener("click", async () => {
      await sendMessage<"TAB_STASH_RESTORE_GROUP", { restored: number }>({
        type: "TAB_STASH_RESTORE_GROUP",
        payload: {
          groupId: group.id,
        },
      });
      await renderGroups();
    });
    const deleteGroup = document.createElement("button");
    deleteGroup.type = "button";
    deleteGroup.className = "hub-button hub-button-danger";
    deleteGroup.textContent = "Delete";
    deleteGroup.addEventListener("click", async () => {
      await sendMessage<"TAB_STASH_DELETE_GROUP", { deleted: boolean }>({
        type: "TAB_STASH_DELETE_GROUP",
        payload: {
          groupId: group.id,
        },
      });
      await renderGroups();
    });
    actions.append(restoreAll, deleteGroup);
    card.append(list, actions);
    groupsContainer.append(card);
  }
}

document.querySelector<HTMLButtonElement>("#stash")?.addEventListener("click", () => {
  void stashTabs();
});

void renderGroups();
