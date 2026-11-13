import { createMessageSender } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import { focusLockMessages } from "../../lib/messages";
import type { FocusLockState } from "../../lib/types";

const domainLabel = document.querySelector<HTMLParagraphElement>("#domain");
const passwordArea = document.querySelector<HTMLDivElement>("#password-area");
const cooldownArea = document.querySelector<HTMLDivElement>("#cooldown-area");
const passwordInput = document.querySelector<HTMLInputElement>("#password");
const unlockButton = document.querySelector<HTMLButtonElement>("#unlock");
const cooldownButton = document.querySelector<HTMLButtonElement>("#cooldown");
const status = document.querySelector<HTMLParagraphElement>("#status");
const sendMessage = createMessageSender(focusLockMessages);
const blockedDomain = new URLSearchParams(document.location.search).get("domain") ?? "";

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function loadState(): Promise<void> {
  const response = await sendMessage({
    type: "FOCUS_LOCK_GET_STATE",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  const state = response.data as FocusLockState;

  if (domainLabel) {
    domainLabel.textContent = blockedDomain || "This site";
  }

  if (blockedDomain && state.unlockedDomains.includes(blockedDomain)) {
    if (passwordArea) passwordArea.hidden = true;
    if (cooldownArea) cooldownArea.hidden = true;
    setStatus("Unlocked temporarily. Reloading this site should work now.");
    return;
  }

  if (state.hasPassword) {
    if (cooldownArea) cooldownArea.hidden = true;
    return;
  }

  if (passwordArea) passwordArea.hidden = true;
}

unlockButton?.addEventListener("click", async () => {
  if (!passwordInput) {
    return;
  }

  const response = await sendMessage({
    type: "FOCUS_LOCK_UNLOCK",
    payload: {
      ...(blockedDomain ? { domain: blockedDomain } : {}),
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
  const response = await sendMessage({
    type: "FOCUS_LOCK_START_COOLDOWN",
    payload: {
      ...(blockedDomain ? { domain: blockedDomain } : {}),
    },
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
