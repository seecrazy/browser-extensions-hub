export type StashedTab = {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  pinned: boolean;
};

export type StashGroup = {
  schemaVersion: 1;
  id: string;
  label: string;
  createdAt: number;
  tabs: StashedTab[];
};

export type TabStashSettings = {
  schemaVersion: 1;
  includePinned: boolean;
};

export const tabStashDefaults: TabStashSettings = {
  schemaVersion: 1,
  includePinned: false,
};

export function isStashableUrl(url: string): boolean {
  return !/^(chrome|edge|brave|about|moz-extension|chrome-extension|extension):/i.test(url);
}

export function createGroupId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `group-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createGroup(input: {
  label?: string | undefined;
  createdAt?: number;
  tabs: Array<Omit<StashedTab, "id">>;
}): StashGroup {
  const id = createGroupId();
  const createdAt = input.createdAt ?? Date.now();

  return {
    schemaVersion: 1,
    id,
    label: input.label?.trim() || new Date(createdAt).toLocaleString(),
    createdAt,
    tabs: input.tabs.map((tab, index) => ({
      ...tab,
      id: `${id}-${index}`,
    })),
  };
}

export function filterStashableTabs(
  tabs: Array<{
    id?: number | undefined;
    title?: string | undefined;
    url?: string | undefined;
    favIconUrl?: string | undefined;
    pinned: boolean;
  }>,
  settings: TabStashSettings,
): Array<{ id: number; title: string; url: string; favIconUrl?: string; pinned: boolean }> {
  const stashable: Array<{
    id: number;
    title: string;
    url: string;
    favIconUrl?: string;
    pinned: boolean;
  }> = [];

  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url || !isStashableUrl(tab.url)) {
      continue;
    }

    if (!settings.includePinned && tab.pinned) {
      continue;
    }

    stashable.push({
      id: tab.id,
      title: tab.title ?? tab.url ?? "Untitled",
      url: tab.url,
      ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
      pinned: tab.pinned,
    });
  }

  return stashable;
}

export function findGroup(groups: StashGroup[], groupId: string): StashGroup | undefined {
  return groups.find((group) => group.id === groupId);
}

export function replaceGroup(groups: StashGroup[], nextGroup: StashGroup): StashGroup[] {
  return groups.map((group) => (group.id === nextGroup.id ? nextGroup : group));
}

export function removeGroup(groups: StashGroup[], groupId: string): StashGroup[] {
  return groups.filter((group) => group.id !== groupId);
}

export function removeTab(groups: StashGroup[], groupId: string, tabId: string): StashGroup[] {
  return groups.flatMap((group) => {
    if (group.id !== groupId) {
      return [group];
    }

    const nextTabs = group.tabs.filter((tab) => tab.id !== tabId);
    return nextTabs.length > 0 ? [{ ...group, tabs: nextTabs }] : [];
  });
}

export function searchGroups(groups: StashGroup[], query: string): StashGroup[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return groups;
  }

  return groups
    .map((group) => {
      const labelMatches = group.label.toLowerCase().includes(normalizedQuery);
      const tabs = group.tabs.filter(
        (tab) =>
          tab.title.toLowerCase().includes(normalizedQuery) ||
          tab.url.toLowerCase().includes(normalizedQuery),
      );

      if (!labelMatches && tabs.length === 0) {
        return null;
      }

      return labelMatches ? group : { ...group, tabs };
    })
    .filter((group): group is StashGroup => group !== null);
}

export function collectDuplicateUrls(groups: StashGroup[], urls: string[]): string[] {
  const existing = new Set(groups.flatMap((group) => group.tabs.map((tab) => tab.url)));
  return [...new Set(urls.filter((url) => existing.has(url)))];
}

export function normalizeImportedGroups(value: unknown): StashGroup[] {
  if (!Array.isArray(value)) {
    throw new Error("Import file must contain an array of groups.");
  }

  return value.map((entry, groupIndex) => {
    const record =
      typeof entry === "object" && entry !== null ? (entry as Record<string, unknown>) : {};
    const tabsRecord = Array.isArray(record.tabs) ? record.tabs : [];
    const groupId =
      typeof record.id === "string" && record.id ? record.id : `import-${Date.now()}-${groupIndex}`;

    return {
      schemaVersion: 1,
      id: groupId,
      label:
        typeof record.label === "string" && record.label
          ? record.label
          : `Imported ${groupIndex + 1}`,
      createdAt: typeof record.createdAt === "number" ? record.createdAt : Date.now(),
      tabs: tabsRecord
        .map((tab, tabIndex) => {
          const tabRecord =
            typeof tab === "object" && tab !== null ? (tab as Record<string, unknown>) : {};
          const url = typeof tabRecord.url === "string" ? tabRecord.url : "";

          if (!url || !isStashableUrl(url)) {
            return null;
          }

          return {
            id:
              typeof tabRecord.id === "string" && tabRecord.id
                ? tabRecord.id
                : `${groupId}-${tabIndex}`,
            title: typeof tabRecord.title === "string" ? tabRecord.title : url,
            url,
            ...(typeof tabRecord.favIconUrl === "string"
              ? { favIconUrl: tabRecord.favIconUrl }
              : {}),
            pinned: tabRecord.pinned === true,
          } satisfies StashedTab;
        })
        .filter((tab): tab is StashedTab => tab !== null),
    };
  });
}
