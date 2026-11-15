import { defineMessageContract } from "@hub/shared/messaging";
import type { FontKey, FontSwitcherPatch, FontSwitcherSiteState } from "./types";

export const fontSwitcherMessages = defineMessageContract({
  FONT_SWITCHER_GET_SITE_STATE: {
    payload: undefined,
    response: {} as FontSwitcherSiteState,
  },
  FONT_SWITCHER_SET_FONT: {
    payload: {} as FontSwitcherPatch,
    response: {} as FontSwitcherSiteState,
  },
  FONT_SWITCHER_SET_DEFAULT: {
    payload: {} as { fontKey: FontKey },
    response: {} as FontSwitcherSiteState,
  },
});
