import { sendMessage } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";

type FocusLockState = {
  domains: string[];
  hasPassword: boolean;
  failedAttempts: number;
  lockedUntil?: number;
  unlockUntil?: number;
};

const status = document.querySelector<HTMLParagraphElement>("#status");
const passwordStatus = document.querySelector<HTMLParagraphElement>("#password-status");
const domainInput = document.querySelector<HTMLInputElement>("#domain");
const domainsList = document.querySelector<HTMLUListElement>("#domains");
const currentPasswordInput = document.querySelector<HTMLInputElement>("#current-password");
const newPasswordInput = document.querySelector<HTMLInputElement>("#new-password");

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

function setPasswordStatus(message: string, isError = false): void {
  if (!passwordStatus) {
    return;
  }

  passwordStatus.textContent = message;
  passwordStatus.classList.toggle("hub-status-error", isError);
}

async function renderDomains(): Promise<void> {
  const response = await sendMessage<"FOCUS_LOCK_GET_STATE", FocusLockState>({
    type: "FOCUS_LOCK_GET_STATE",
  });

  if (!response.ok || !domainsList) {
    setStatus(response.ok ? "Unable to load settings." : response.error.message, true);
    return;
  }

  domainsList.replaceChildren();

  if (response.data.domains.length === 0) {
    domainsList.textContent = "No blocked domains yet.";
    return;
  }

  for (const domain of response.data.domains) {
    const item = document.createElement("li");
    item.className = "hub-list-item";
    const label = document.createElement("span");
    label.textContent = domain;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "hub-button hub-button-danger";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", async () => {
      const removeResponse = await sendMessage<
        "FOCUS_LOCK_REMOVE_DOMAIN",
        Pick<FocusLockState, "domains">
      >({
        type: "FOCUS_LOCK_REMOVE_DOMAIN",
        payload: {
          domain,
        },
      });

      if (!removeResponse.ok) {
        setStatus(removeResponse.error.message, true);
        return;
      }

      await renderDomains();
    });
    item.append(label, removeButton);
    domainsList.append(item);
  }

  if (passwordStatus) {
    passwordStatus.textContent = response.data.hasPassword
      ? "A local password is set."
      : "No password is set.";
  }
}

document
  .querySelector<HTMLFormElement>("#domain-form")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!domainInput) {
      return;
    }

    const response = await sendMessage<"FOCUS_LOCK_ADD_DOMAIN", Pick<FocusLockState, "domains">>({
      type: "FOCUS_LOCK_ADD_DOMAIN",
      payload: {
        domain: domainInput.value,
      },
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    domainInput.value = "";
    setStatus("Domain saved.");
    await renderDomains();
  });

document
  .querySelector<HTMLFormElement>("#password-form")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!newPasswordInput) {
      return;
    }

    const response = await sendMessage<
      "FOCUS_LOCK_SET_PASSWORD",
      Pick<FocusLockState, "hasPassword">
    >({
      type: "FOCUS_LOCK_SET_PASSWORD",
      payload: {
        currentPassword: currentPasswordInput?.value ?? "",
        newPassword: newPasswordInput.value,
      },
    });

    if (!response.ok) {
      setPasswordStatus(response.error.message, true);
      return;
    }

    newPasswordInput.value = "";
    if (currentPasswordInput) {
      currentPasswordInput.value = "";
    }
    setPasswordStatus("Password saved locally.");
    await renderDomains();
  });

void renderDomains();
