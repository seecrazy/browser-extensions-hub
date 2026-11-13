import { defineMessageContract } from "@hub/shared/messaging";
import type { ReadingProgressSiteState } from "./types";

export type ReadingProgressPatch = Partial<{
  enabled: boolean;
  color: string;
  height: number;
  position: "top" | "bottom";
  offsetTop: number;
  offsetBottom: number;
}>;

export const readingProgressMessages = defineMessageContract({
  READING_PROGRESS_GET_SITE_STATE: {
    payload: undefined,
    response: {} as ReadingProgressSiteState,
  },
  READING_PROGRESS_SET_SITE_STATE: {
    payload: {} as ReadingProgressPatch,
    response: {} as ReadingProgressSiteState,
  },
});
