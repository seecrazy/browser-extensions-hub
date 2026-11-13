import { defineMessageContract } from "@hub/shared/messaging";
import type { FocusLockState } from "./types";

export const focusLockMessages = defineMessageContract({
  FOCUS_LOCK_GET_STATE: {
    payload: undefined,
    response: {} as FocusLockState,
  },
  FOCUS_LOCK_ADD_DOMAIN: {
    payload: {} as {
      domain: string;
    },
    response: {} as {
      domains: string[];
    },
  },
  FOCUS_LOCK_REMOVE_DOMAIN: {
    payload: {} as {
      domain: string;
    },
    response: {} as {
      domains: string[];
    },
  },
  FOCUS_LOCK_IMPORT_DOMAINS: {
    payload: {} as {
      domains: unknown;
    },
    response: {} as {
      domains: string[];
    },
  },
  FOCUS_LOCK_EXPORT_DOMAINS: {
    payload: undefined,
    response: {} as {
      domains: string[];
    },
  },
  FOCUS_LOCK_SET_PASSWORD: {
    payload: {} as {
      currentPassword: string;
      newPassword: string;
    },
    response: {} as {
      hasPassword: boolean;
    },
  },
  FOCUS_LOCK_REMOVE_PASSWORD: {
    payload: {} as {
      currentPassword: string;
    },
    response: {} as {
      hasPassword: boolean;
    },
  },
  FOCUS_LOCK_UNLOCK: {
    payload: {} as {
      domain?: string;
      password: string;
    },
    response: {} as {
      unlockUntil: number;
      domain?: string;
    },
  },
  FOCUS_LOCK_START_COOLDOWN: {
    payload: {} as {
      domain?: string;
    },
    response: {} as {
      unlockUntil: number;
      domain?: string;
    },
  },
});
