import { defineMessageContract } from "@hub/shared/messaging";
import type { DarkModeSiteState } from "./types";

export type SetDarkModePayload = Partial<{
  enabled: boolean;
  strength: number;
}>;

export const darkModeMessages = defineMessageContract({
  DARK_MODE_GET_SITE_STATE: {
    payload: undefined,
    response: {} as DarkModeSiteState,
  },
  DARK_MODE_SET_SITE_STATE: {
    payload: {} as SetDarkModePayload,
    response: {} as DarkModeSiteState,
  },
});
