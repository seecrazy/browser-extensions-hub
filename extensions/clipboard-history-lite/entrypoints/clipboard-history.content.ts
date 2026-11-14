import { createNamespacedStorage } from "@hub/shared/storage";
import {
  addClipboardItem,
  clipboardDefaults,
  isOriginDisabled,
  validateClipboardSettings,
} from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "clipboard-history.settings",
  clipboardDefaults,
  "local",
  {
    validate: validateClipboardSettings,
  },
);

function copiedText(event: ClipboardEvent): string {
  const fromEvent = event.clipboardData?.getData("text/plain");

  if (fromEvent) {
    return fromEvent;
  }

  return document.getSelection()?.toString() ?? "";
}

async function initialize(): Promise<void> {
  const origin = document.location.origin;

  document.addEventListener(
    "copy",
    (event) => {
      void settingsStorage
        .get()
        .then(async (settings) => {
          if (isOriginDisabled(settings, origin)) {
            return settings;
          }

          const next = addClipboardItem(settings, copiedText(event));
          await settingsStorage.patch(next);
          return next;
        })
        .catch(() => undefined);
    },
    true,
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
