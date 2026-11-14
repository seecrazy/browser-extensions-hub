import { onContractMessage } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { volumeMessages } from "../lib/messages";
import { getSiteLevel, patchSiteLevel } from "../lib/settings";
import { validateVolumeSettings, volumeDefaults } from "../lib/types";
import type { VolumeMediaState } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "volume-booster.settings",
  volumeDefaults,
  "local",
  {
    validate: validateVolumeSettings,
  },
);

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

async function applyVolume(level: number): Promise<VolumeMediaState> {
  const normalizedLevel = Math.min(300, Math.max(0, Math.round(level)));
  const mediaElements = Array.from(document.querySelectorAll<HTMLMediaElement>("video, audio"));
  let unsupportedCount = 0;

  for (const element of mediaElements) {
    if (isCorsEligible(element)) {
      await resumeAudioContext();
      getGainNode(element).gain.value = normalizedLevel / 100;
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
    audioContextState: audioContext?.state ?? "none",
  };
}

function initialize(): void {
  const origin = document.location.origin;
  let currentLevel = getSiteLevel(volumeDefaults, origin);
  let currentState: VolumeMediaState = {
    level: currentLevel,
    mediaCount: 0,
    unsupportedCount: 0,
    audioContextState: "none",
  };

  onContractMessage(volumeMessages, {
    VOLUME_GET: () => currentState,
    VOLUME_SET: async (payload) => {
      currentLevel = payload.level;
      currentState = await applyVolume(payload.level);
      const nextSettings = patchSiteLevel(await settingsStorage.get(), origin, payload.level);
      await settingsStorage.patch(nextSettings);
      return currentState;
    },
  });

  void settingsStorage.get().then((nextSettings) => {
    currentLevel = getSiteLevel(nextSettings, origin);
    void applyVolume(currentLevel).then((state) => {
      currentState = state;
    });
  });

  settingsStorage.subscribe((nextSettings) => {
    currentLevel = getSiteLevel(nextSettings, origin);
    void applyVolume(currentLevel).then((state) => {
      currentState = state;
    });
  });

  const observer = new MutationObserver(() => {
    void applyVolume(currentLevel).then((state) => {
      currentState = state;
    });
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener(
    "pointerdown",
    () => {
      void resumeAudioContext();
    },
    {
      passive: true,
    },
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
