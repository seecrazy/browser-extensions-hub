import { defineMessageContract } from "@hub/shared/messaging";
import type { PrivacyCleanupResult, PrivacySettings } from "./types";

export const privacyMessages = defineMessageContract({
  PRIVACY_CLEAN_CURRENT_TAB: {
    payload: undefined,
    response: {} as PrivacyCleanupResult,
  },
  PRIVACY_GET_SETTINGS: {
    payload: undefined,
    response: {} as PrivacySettings,
  },
  PRIVACY_SET_SETTINGS: {
    payload: {} as PrivacySettings["cleanup"],
    response: {} as PrivacySettings,
  },
});
