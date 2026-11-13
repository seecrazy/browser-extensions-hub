import { createNamespacedStorage } from "@hub/shared/storage";
import { onRuntimeMessage } from "@hub/shared/messaging";

type StashedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  pinned: boolean;
};

type StashGroup = {
  schemaVersion: number;
  id: string;
  createdAt: number;
  tabs: StashedTab[];
};

type TabStashSettings = {
  schemaVersion: number;
  includePinned: boolean;
};

const groupsStorage = createNamespacedStorage<{ schemaVersion: number; groups: StashGroup[] }>(
  "tab-stash.groups",
  {
    schemaVersion: 1,
    groups: [],
  },
);

const settingsStorage = createNamespacedStorage<TabStashSettings>("tab-stash.settings", {
  schemaVersion: 1,
  includePinned: false,
});

function isStashableUrl(url: string): boolean {
  return !/^(chrome|edge|brave|about|moz-extension|chrome-extension|extension):/i.test(url);
}

async function stashCurrentWindow(): Promise<number> {
  const settings = await settingsStorage.get();
  const tabs = await chrome.tabs.query({
    currentWindow: true,
  });

  const stashableTabs = tabs.filter((tab) => {
    if (!tab.url || !isStashableUrl(tab.url)) {
      return false;
    }

    return settings.includePinned || !tab.pinned;
  });

  if (stashableTabs.length === 0) {
    return 0;
  }

  const groupId = crypto.randomUUID();
  const group: StashGroup = {
    schemaVersion: 1,
    id: groupId,
    createdAt: Date.now(),
    tabs: stashableTabs.map((tab, index) => ({
      id: `${groupId}-${index}`,
      title: tab.title ?? tab.url ?? "Untitled",
      url: tab.url ?? "",
      ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
      pinned: tab.pinned,
    })),
  };

  const state = await groupsStorage.get();
  await groupsStorage.patch({
    groups: [group, ...state.groups],
  });

  const tabIds = stashableTabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);
  await chrome.tabs.remove(tabIds);
  return group.tabs.length;
}

export default defineBackground(() => {
  onRuntimeMessage({
    TAB_STASH_STASH_WINDOW: async () => {
      const count = await stashCurrentWindow();
      return {
        count,
      };
    },
    TAB_STASH_LIST_GROUPS: async () => {
      const state = await groupsStorage.get();
      return state.groups;
    },
    TAB_STASH_RESTORE_TAB: async (payload: { groupId: string; tabId: string }) => {
      const state = await groupsStorage.get();
      const group = state.groups.find((candidate) => candidate.id === payload.groupId);
      const tab = group?.tabs.find((candidate) => candidate.id === payload.tabId);

      if (!group || !tab) {
        throw new Error("Stashed tab not found.");
      }

      await chrome.tabs.create({
        url: tab.url,
        active: false,
        pinned: tab.pinned,
      });
      const nextTabs = group.tabs.filter((candidate) => candidate.id !== tab.id);
      const nextGroups =
        nextTabs.length > 0
          ? state.groups.map((candidate) =>
              candidate.id === group.id
                ? {
                    ...candidate,
                    tabs: nextTabs,
                  }
                : candidate,
            )
          : state.groups.filter((candidate) => candidate.id !== group.id);
      await groupsStorage.patch({
        groups: nextGroups,
      });
      return {
        restored: true,
      };
    },
    TAB_STASH_RESTORE_GROUP: async (payload: { groupId: string }) => {
      const state = await groupsStorage.get();
      const group = state.groups.find((candidate) => candidate.id === payload.groupId);

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
        groups: state.groups.filter((candidate) => candidate.id !== group.id),
      });
      return {
        restored: group.tabs.length,
      };
    },
    TAB_STASH_DELETE_GROUP: async (payload: { groupId: string }) => {
      const state = await groupsStorage.get();
      await groupsStorage.patch({
        groups: state.groups.filter((candidate) => candidate.id !== payload.groupId),
      });
      return {
        deleted: true,
      };
    },
  });
});
