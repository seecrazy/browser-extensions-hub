import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import {
  collectDuplicateUrls,
  createGroup,
  filterStashableTabs,
  findGroup,
  normalizeImportedGroups,
  removeGroup,
  removeTab,
  replaceGroup,
  searchGroups,
  tabStashDefaults,
} from "../lib/groups";
import { tabStashMessages } from "../lib/messages";
import type { StashGroup } from "../lib/types";

const groupsStorage = createNamespacedStorage<{ schemaVersion: 1; groups: StashGroup[] }>(
  "tab-stash.groups",
  {
    schemaVersion: 1,
    groups: [],
  },
);

const settingsStorage = createNamespacedStorage("tab-stash.settings", tabStashDefaults);

async function stashCurrentWindow(
  label?: string,
): Promise<{ count: number; duplicates: string[] }> {
  const [settings, groupState] = await Promise.all([settingsStorage.get(), groupsStorage.get()]);
  const tabs = await chrome.tabs.query({
    currentWindow: true,
  });
  const stashableTabs = filterStashableTabs(tabs, settings);

  if (stashableTabs.length === 0) {
    return {
      count: 0,
      duplicates: [],
    };
  }

  const group = createGroup({
    ...(label ? { label } : {}),
    tabs: stashableTabs.map(({ id: _id, ...tab }) => tab),
    createdAt: Date.now(),
  });
  const duplicates = collectDuplicateUrls(
    groupState.groups,
    stashableTabs.map((tab) => tab.url),
  );

  await groupsStorage.patch({
    groups: [group, ...groupState.groups],
  });

  const tabIds = stashableTabs.map((tab) => tab.id);
  await chrome.tabs.remove(tabIds);

  return {
    count: group.tabs.length,
    duplicates,
  };
}

export default defineBackground(() => {
  onContractMessage(tabStashMessages, {
    TAB_STASH_STASH_WINDOW: async (payload) => stashCurrentWindow(payload?.label),
    TAB_STASH_LIST_GROUPS: async (payload) =>
      searchGroups((await groupsStorage.get()).groups, payload?.query ?? ""),
    TAB_STASH_RESTORE_TAB: async (payload) => {
      const groupState = await groupsStorage.get();
      const group = findGroup(groupState.groups, payload.groupId);
      const tab = group?.tabs.find((candidate) => candidate.id === payload.tabId);

      if (!group || !tab) {
        throw new Error("Stashed tab not found.");
      }

      await chrome.tabs.create({
        url: tab.url,
        active: false,
        pinned: tab.pinned,
      });
      await groupsStorage.patch({
        groups: removeTab(groupState.groups, payload.groupId, payload.tabId),
      });

      return {
        restored: true,
      };
    },
    TAB_STASH_RESTORE_GROUP: async (payload) => {
      const groupState = await groupsStorage.get();
      const group = findGroup(groupState.groups, payload.groupId);

      if (!group) {
        throw new Error("Stash group not found.");
      }

      for (const tab of group.tabs) {
        await chrome.tabs.create({
          url: tab.url,
          active: false,
          pinned: tab.pinned,
        });
      }

      await groupsStorage.patch({
        groups: removeGroup(groupState.groups, payload.groupId),
      });

      return {
        restored: group.tabs.length,
      };
    },
    TAB_STASH_RENAME_GROUP: async (payload) => {
      const groupState = await groupsStorage.get();
      const group = findGroup(groupState.groups, payload.groupId);

      if (!group) {
        throw new Error("Stash group not found.");
      }

      const nextGroups = replaceGroup(groupState.groups, {
        ...group,
        label: payload.label.trim() || group.label,
      });
      await groupsStorage.patch({
        groups: nextGroups,
      });

      return nextGroups;
    },
    TAB_STASH_DELETE_GROUP: async (payload) => {
      const groupState = await groupsStorage.get();
      await groupsStorage.patch({
        groups: removeGroup(groupState.groups, payload.groupId),
      });

      return {
        deleted: true,
      };
    },
    TAB_STASH_IMPORT_GROUPS: async (payload) => {
      const groups = normalizeImportedGroups(payload.groups);
      const groupState = await groupsStorage.get();
      const existingIds = new Set(groupState.groups.map((group) => group.id));
      const importedGroups = groups.map((group) =>
        existingIds.has(group.id)
          ? {
              ...group,
              id: `${group.id}-${Date.now()}`,
            }
          : group,
      );

      await groupsStorage.patch({
        groups: [...importedGroups, ...groupState.groups],
      });

      return {
        imported: importedGroups.length,
      };
    },
  });
});
