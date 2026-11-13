import { createMessageSender } from "@hub/shared/messaging";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { privacyMessages } from "../../lib/messages";
import type { PrivacySettings } from "../../lib/types";

const cookies = document.querySelector<HTMLInputElement>("#cookies");
const localStorageInput = document.querySelector<HTMLInputElement>("#local-storage");
const indexedDb = document.querySelector<HTMLInputElement>("#indexed-db");
const cache = document.querySelector<HTMLInputElement>("#cache");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createMessageSender(privacyMessages);

async function load(): Promise<void> {
  const response = await sendMessage({
    type: "PRIVACY_GET_SETTINGS",
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    return;
  }

  const settings = response.data as PrivacySettings;
  if (cookies) cookies.checked = settings.cleanup.cookies;
  if (localStorageInput) localStorageInput.checked = settings.cleanup.localStorage;
  if (indexedDb) indexedDb.checked = settings.cleanup.indexedDb;
  if (cache) cache.checked = settings.cleanup.cache;
}

async function save(): Promise<void> {
  const response = await sendMessage({
    type: "PRIVACY_SET_SETTINGS",
    payload: {
      cookies: cookies?.checked ?? false,
      localStorage: localStorageInput?.checked ?? false,
      indexedDb: indexedDb?.checked ?? false,
      cache: cache?.checked ?? false,
    },
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    return;
  }

  statusView.set("Saved.");
}

[cookies, localStorageInput, indexedDb, cache].forEach((input) => {
  input?.addEventListener("change", () => {
    void save();
  });
});

void load();
