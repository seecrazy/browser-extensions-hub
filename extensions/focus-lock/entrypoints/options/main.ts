import { createMessageSender } from "@hub/shared/messaging";
import "@hub/shared/ui/styles.css";
import { focusLockMessages } from "../../lib/messages";
import type { FocusLockState } from "../../lib/types";

const status = document.querySelector<HTMLParagraphElement>("#status");
const passwordStatus = document.querySelector<HTMLParagraphElement>("#password-status");
const domainInput = document.querySelector<HTMLInputElement>("#domain");
const domainsList = document.querySelector<HTMLUListElement>("#domains");
const currentPasswordInput = document.querySelector<HTMLInputElement>("#current-password");
const newPasswordInput = document.querySelector<HTMLInputElement>("#new-password");
const sendMessage = createMessageSender(focusLockMessages);

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

async function exportDomains(): Promise<void> {
  const response = await sendMessage({
    type: "FOCUS_LOCK_EXPORT_DOMAINS",
  });

  if (!response.ok) {
    setStatus(response.error.message, true);
    return;
  }

  const blob = new Blob([JSON.stringify(response.data.domains, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "focus-lock-domains.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("Exported.");
}

async function importDomains(file: File): Promise<void> {
  try {
    const domains = JSON.parse(await file.text());
    const response = await sendMessage({
      type: "FOCUS_LOCK_IMPORT_DOMAINS",
      payload: {
        domains,
      },
    });

    if (!response.ok) {
      setStatus(response.error.message, true);
      return;
    }

    setStatus(`Imported ${response.data.domains.length} domain(s).`);
    await renderDomains();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unable to import file.", true);
  }
}

async function renderDomains(): Promise<void> {
  const response = await sendMessage({
    type: "FOCUS_LOCK_GET_STATE",
  });

  if (!response.ok || !domainsList) {
    setStatus(response.ok ? "Unable to load settings." : response.error.message, true);
    return;
  }

  const state = response.data as FocusLockState;
  domainsList.replaceChildren();

  if (state.domains.length === 0) {
    domainsList.textContent = "No blocked domains yet.";
  } else {
    for (const domain of state.domains) {
      const item = document.createElement("li");
      item.className = "hub-list-item";
      const label = document.createElement("span");
      label.textContent = domain;
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "hub-button hub-button-danger";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", async () => {
        const removeResponse = await sendMessage({
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
  }

  if (passwordStatus) {
    passwordStatus.textContent = state.hasPassword
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

    const response = await sendMessage({
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

    const response = await sendMessage({
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

document
  .querySelector<HTMLButtonElement>("#remove-password")
  ?.addEventListener("click", async () => {
    const currentPassword = currentPasswordInput?.value ?? "";
    const response = await sendMessage({
      type: "FOCUS_LOCK_REMOVE_PASSWORD",
      payload: {
        currentPassword,
      },
    });

    if (!response.ok) {
      setPasswordStatus(response.error.message, true);
      return;
    }

    setPasswordStatus("Password removed.");
    await renderDomains();
  });

document.querySelector<HTMLButtonElement>("#export-domains")?.addEventListener("click", () => {
  void exportDomains();
});

document.querySelector<HTMLInputElement>("#import-domains")?.addEventListener("change", (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (file) {
    void importDomains(file);
  }
});

void renderDomains();
