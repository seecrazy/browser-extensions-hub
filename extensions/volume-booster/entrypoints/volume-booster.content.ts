import { defineMessageHandler } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { browser } from "wxt/browser";

type VolumeSettings = {
  schemaVersion: number;
  level: number;
};

type VolumeState = {
  level: number;
  mediaCount: number;
  unsupportedCount: number;
};

const settingsStorage = createNamespacedStorage<VolumeSettings>("volume-booster.settings", {
  schemaVersion: 1,
  level: 100,
});

let audioContext: AudioContext | null = null;
const mediaNodes = new WeakMap<HTMLMediaElement, GainNode>();

function isCorsEligible(element: HTMLMediaElement): boolean {
  const source = element.currentSrc || element.src;

  if (!source) {
    return false;
  }

  try {
    const url = new URL(source, document.baseURI);
    return url.origin === document.location.origin || element.crossOrigin !== null;
  } catch {
    return false;
  }
}

function getGainNode(element: HTMLMediaElement): GainNode {
  const existingNode = mediaNodes.get(element);

  if (existingNode) {
    return existingNode;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const sourceNode = audioContext.createMediaElementSource(element);
  const gainNode = audioContext.createGain();
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);
  mediaNodes.set(element, gainNode);
  return gainNode;
}

async function resumeAudioContext(): Promise<void> {
  if (audioContext?.state === "suspended") {
    await audioContext.resume();
  }
}

async function applyVolume(level: number): Promise<VolumeState> {
  const normalizedLevel = Math.min(300, Math.max(0, Math.round(level)));
  const mediaElements = Array.from(document.querySelectorAll<HTMLMediaElement>("video, audio"));
  let unsupportedCount = 0;

  for (const element of mediaElements) {
    if (isCorsEligible(element)) {
      await resumeAudioContext();
      const gainNode = getGainNode(element);
      gainNode.gain.value = normalizedLevel / 100;
    } else {
      element.volume = Math.min(1, normalizedLevel / 100);

      if (normalizedLevel > 100) {
        unsupportedCount += 1;
      }
    }
  }

  return {
    level: normalizedLevel,
    mediaCount: mediaElements.length,
    unsupportedCount,
  };
}

async function initialize(): Promise<void> {
  const installedMarker = "__hubVolumeBoosterInstalled";
  const windowWithMarker = window as typeof window & Record<string, boolean | undefined>;

  if (windowWithMarker[installedMarker]) {
    return;
  }

  windowWithMarker[installedMarker] = true;
  const settings = await settingsStorage.get();
  await applyVolume(settings.level);

  document.addEventListener(
    "pointerdown",
    () => {
      void resumeAudioContext();
    },
    {
      passive: true,
    },
  );

  browser.runtime.onMessage.addListener(
    defineMessageHandler({
      VOLUME_GET: async () => {
        const currentSettings = await settingsStorage.get();
        const mediaElements = Array.from(
          document.querySelectorAll<HTMLMediaElement>("video, audio"),
        );
        return {
          level: currentSettings.level,
          mediaCount: mediaElements.length,
          unsupportedCount: mediaElements.filter((element) => !isCorsEligible(element)).length,
        } satisfies VolumeState;
      },
      VOLUME_SET: async (payload: { level: number }) => {
        const state = await applyVolume(payload.level);
        await settingsStorage.patch({
          level: state.level,
        });
        return state;
      },
    }),
  );
}

export default defineContentScript({
  matches: [],
  registration: "runtime",
  runAt: "document_idle",
  allFrames: false,
  main() {
    void initialize();
  },
});
