import { sendMessage } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";

type FocusLockState = {
  hasPassword: boolean;
  unlockUntil?: number;
};

const passwordArea = document.querySelector<HTMLDivElement>("#password-area");
const cooldownArea = document.querySelector<HTMLDivElement>("#cooldown-area");
const passwordInput = document.querySelector<HTMLInputElement>("#password");
const unlockButton = document.querySelector<HTMLButtonElement>("#unlock");
const cooldownButton = document.querySelector<HTMLButtonElement>("#cooldown");
const status = document.querySelector<HTMLParagraphElement>("#status");

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function loadState(): Promise<void> {
  const response = await sendMessage<"FOCUS_LOCK_GET_STATE", FocusLockState>({
    type: "FOCUS_LOCK_GET_STATE",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  if (response.data.unlockUntil && response.data.unlockUntil > Date.now()) {
    if (passwordArea) passwordArea.hidden = true;
    if (cooldownArea) cooldownArea.hidden = true;
    setStatus("Unlocked temporarily. Reloading the blocked site should work now.");
    return;
  }

  if (response.data.hasPassword) {
    if (cooldownArea) cooldownArea.hidden = true;
    return;
  }

  if (passwordArea) passwordArea.hidden = true;
}

unlockButton?.addEventListener("click", async () => {
  if (!passwordInput) {
    return;
  }

  const response = await sendMessage<
    "FOCUS_LOCK_UNLOCK",
    {
      unlockUntil: number;
    }
  >({
    type: "FOCUS_LOCK_UNLOCK",
    payload: {
      password: passwordInput.value,
    },
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  setStatus("Unlocked. Try visiting the site again.");
});

cooldownButton?.addEventListener("click", async () => {
  const response = await sendMessage<
    "FOCUS_LOCK_START_COOLDOWN",
    {
      unlockUntil: number;
    }
  >({
    type: "FOCUS_LOCK_START_COOLDOWN",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  if (cooldownButton) {
    cooldownButton.disabled = true;
  }

  setStatus("Cooldown started. This page will relock in 60 seconds.");
});

void loadState();
