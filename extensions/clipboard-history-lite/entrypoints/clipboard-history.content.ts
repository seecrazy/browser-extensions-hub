import { createNamespacedStorage } from "@hub/shared/storage";
import { addClipboardItem, clipboardDefaults, validateClipboardSettings } from "../lib/types";

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
  const installedMarker = "__hubClipboardHistoryInstalled";
  const windowWithMarker = window as typeof window & Record<string, boolean | undefined>;

  if (windowWithMarker[installedMarker]) {
    return;
  }

  windowWithMarker[installedMarker] = true;

  document.addEventListener(
    "copy",
    (event) => {
      void settingsStorage
        .get()
        .then((settings) => settingsStorage.patch(addClipboardItem(settings, copiedText(event))));
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
