import { createMessageSender } from "@hub/shared/messaging";
import { clearElement } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { tabStashMessages } from "../../lib/messages";
import type { StashGroup } from "../../lib/types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const groupNameInput = document.querySelector<HTMLInputElement>("#group-name");
const searchInput = document.querySelector<HTMLInputElement>("#search");
const groupsContainer = document.querySelector<HTMLDivElement>("#groups");
const sendMessage = createMessageSender(tabStashMessages);

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function stashTabs(): Promise<void> {
  setStatus("Stashing tabs...");
  const response = await sendMessage({
    type: "TAB_STASH_STASH_WINDOW",
    payload: {
      label: groupNameInput?.value ?? "",
    },
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  const duplicateText =
    response.data.duplicates.length > 0
      ? ` ${response.data.duplicates.length} duplicate URL(s) were also stashed.`
      : "";
  setStatus(
    response.data.count > 0
      ? `Stashed ${response.data.count} tabs.${duplicateText}`
      : "No stashable tabs.",
  );

  if (groupNameInput) {
    groupNameInput.value = "";
  }

  await renderGroups();
}

async function renderGroups(): Promise<void> {
  const response = await sendMessage({
    type: "TAB_STASH_LIST_GROUPS",
    payload: {
      query: searchInput?.value ?? "",
    },
  });

  if (!response.ok || !groupsContainer) {
    setStatus(response.ok ? "Unable to render groups." : response.error.message, true);
    return;
  }

  clearElement(groupsContainer);

  if (response.data.length === 0) {
    groupsContainer.textContent = "No matching stashed tabs.";
    return;
  }

  for (const group of response.data) {
    groupsContainer.append(renderGroup(group));
  }
}

function renderGroup(group: StashGroup): HTMLElement {
  const card = document.createElement("div");
  card.className = "hub-card";
  const header = document.createElement("div");
  header.className = "hub-row";
  const title = document.createElement("strong");
  title.textContent = group.label;
  const count = document.createElement("span");
  count.className = "hub-label";
  count.textContent = `${group.tabs.length} tabs`;
  header.append(title, count);

  const list = document.createElement("ul");
  list.className = "hub-list";

  for (const tab of group.tabs) {
    const item = document.createElement("li");
    item.className = "hub-list-item";
    const restoreButton = document.createElement("button");
    restoreButton.type = "button";
    restoreButton.className = "hub-button hub-button-secondary";
    restoreButton.textContent = tab.title || tab.url;
    restoreButton.addEventListener("click", async () => {
      await sendMessage({
        type: "TAB_STASH_RESTORE_TAB",
        payload: {
          groupId: group.id,
          tabId: tab.id,
        },
      });
      await renderGroups();
    });
    item.append(restoreButton);
    list.append(item);
  }

  const actions = document.createElement("div");
  actions.className = "hub-row";

  const restoreAllButton = document.createElement("button");
  restoreAllButton.type = "button";
  restoreAllButton.className = "hub-button";
  restoreAllButton.textContent = "Restore all";
  restoreAllButton.addEventListener("click", async () => {
    if (!window.confirm(`Restore ${group.tabs.length} tabs?`)) {
      return;
    }

    await sendMessage({
      type: "TAB_STASH_RESTORE_GROUP",
      payload: {
        groupId: group.id,
      },
    });
    await renderGroups();
  });

  const renameButton = document.createElement("button");
  renameButton.type = "button";
  renameButton.className = "hub-button hub-button-secondary";
  renameButton.textContent = "Rename";
  renameButton.addEventListener("click", async () => {
    const label = window.prompt("Group name", group.label);

    if (label === null) {
      return;
    }

    await sendMessage({
      type: "TAB_STASH_RENAME_GROUP",
      payload: {
        groupId: group.id,
        label,
      },
    });
    await renderGroups();
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "hub-button hub-button-danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    await sendMessage({
      type: "TAB_STASH_DELETE_GROUP",
      payload: {
        groupId: group.id,
      },
    });
    await renderGroups();
  });

  actions.append(restoreAllButton, renameButton, deleteButton);
  card.append(header, list, actions);
  return card;
}

document.querySelector<HTMLButtonElement>("#stash")?.addEventListener("click", () => {
  void stashTabs();
});

searchInput?.addEventListener("input", () => {
  void renderGroups();
});

void renderGroups();
