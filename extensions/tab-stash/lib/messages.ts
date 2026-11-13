import { defineMessageContract } from "@hub/shared/messaging";
import type { StashGroup } from "./types";

export const tabStashMessages = defineMessageContract({
  TAB_STASH_STASH_WINDOW: {
    payload: {} as {
      label?: string;
    },
    response: {} as {
      count: number;
      duplicates: string[];
    },
  },
  TAB_STASH_LIST_GROUPS: {
    payload: {} as {
      query?: string;
    },
    response: {} as StashGroup[],
  },
  TAB_STASH_RESTORE_TAB: {
    payload: {} as {
      groupId: string;
      tabId: string;
    },
    response: {} as {
      restored: boolean;
    },
  },
  TAB_STASH_RESTORE_GROUP: {
    payload: {} as {
      groupId: string;
    },
    response: {} as {
      restored: number;
    },
  },
  TAB_STASH_RENAME_GROUP: {
    payload: {} as {
      groupId: string;
      label: string;
    },
    response: {} as StashGroup[],
  },
  TAB_STASH_DELETE_GROUP: {
    payload: {} as {
      groupId: string;
    },
    response: {} as {
      deleted: boolean;
    },
  },
  TAB_STASH_IMPORT_GROUPS: {
    payload: {} as {
      groups: unknown;
    },
    response: {} as {
      imported: number;
    },
  },
});
