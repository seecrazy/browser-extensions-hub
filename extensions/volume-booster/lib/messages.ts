import { defineMessageContract } from "@hub/shared/messaging";
import type { VolumeMediaState } from "./types";

export const volumeMessages = defineMessageContract({
  VOLUME_GET: {
    payload: undefined,
    response: {} as VolumeMediaState,
  },
  VOLUME_SET: {
    payload: {} as {
      level: number;
    },
    response: {} as VolumeMediaState,
  },
});
