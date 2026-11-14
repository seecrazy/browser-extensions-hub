import { getActiveTab, injectRuntimeContentScript } from "@hub/shared/injection";
import { createTabMessageSender } from "@hub/shared/messaging";
import { createAdvancedSettings, createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";
import { readingProgressMessages } from "../../lib/messages";
import type { ReadingProgressSiteState } from "../../lib/types";

const originLabel = document.querySelector<HTMLParagraphElement>("#origin");
const enabledInput = document.querySelector<HTMLInputElement>("#enabled");
const colorInput = document.querySelector<HTMLInputElement>("#color");
const heightInput = document.querySelector<HTMLInputElement>("#height");
const positionInput = document.querySelector<HTMLSelectElement>("#position");
const offsetTopInput = document.querySelector<HTMLInputElement>("#offset-top");
const offsetBottomInput = document.querySelector<HTMLInputElement>("#offset-bottom");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));
const sendMessage = createTabMessageSender(readingProgressMessages);

const heightLabel = document.querySelector<HTMLLabelElement>('label[for="height"]');
const positionLabel = document.querySelector<HTMLLabelElement>('label[for="position"]');
const offsetTopLabel = document.querySelector<HTMLLabelElement>('label[for="offset-top"]');
const offsetBottomLabel = document.querySelector<HTMLLabelElement>('label[for="offset-bottom"]');
const advancedSettings = createAdvancedSettings(
  [
    heightLabel,
    heightInput,
    positionLabel,
    positionInput,
    offsetTopLabel,
    offsetTopInput,
    offsetBottomLabel,
    offsetBottomInput,
  ].filter((element): element is NonNullable<typeof element> => element !== null),
  { label: "Advanced appearance" },
);
document.querySelector("#advanced")?.append(advancedSettings.root);

function renderState(state: ReadingProgressSiteState): void {
  if (originLabel) {
    originLabel.textContent = state.origin || "Current site";
  }

  if (enabledInput) enabledInput.checked = state.settings.enabled;
  if (colorInput) colorInput.value = state.settings.color;
  if (heightInput) heightInput.value = String(state.settings.height);
  if (positionInput) positionInput.value = state.settings.position;
  if (offsetTopInput) offsetTopInput.value = String(state.settings.offsetTop);
  if (offsetBottomInput) offsetBottomInput.value = String(state.settings.offsetBottom);
}

async function loadState(): Promise<void> {
  const tabId = (await getActiveTab()).tabId;

  if (
    !tabId ||
    !enabledInput ||
    !colorInput ||
    !heightInput ||
    !positionInput ||
    !offsetTopInput ||
    !offsetBottomInput
  ) {
    statusView.set("No active tab available.", true);
    return;
  }

  try {
    await injectRuntimeContentScript({
      file: "/content-scripts/reading-progress.js",
    });
    const response = await sendMessage(tabId, {
      type: "READING_PROGRESS_GET_SITE_STATE",
    });

    if (!response.ok) {
      statusView.set(response.error.message, true);
      return;
    }

    renderState(response.data);
    statusView.set("Connected to current tab.");
  } catch (error) {
    statusView.set(
      error instanceof Error ? error.message : "This tab cannot use Reading Progress.",
      true,
    );
  }
}

type ReadingProgressPatch = {
  enabled?: boolean;
  color?: string;
  height?: number;
  position?: "top" | "bottom";
  offsetTop?: number;
  offsetBottom?: number;
};

async function saveState(patch: ReadingProgressPatch): Promise<void> {
  const tabId = (await getActiveTab()).tabId;

  if (!tabId) {
    statusView.set("No active tab available.", true);
    return;
  }

  const response = await sendMessage(tabId, {
    type: "READING_PROGRESS_SET_SITE_STATE",
    payload: patch,
  });

  if (!response.ok) {
    statusView.set(response.error.message, true);
    return;
  }

  renderState(response.data);
  statusView.set("Saved.");
}

enabledInput?.addEventListener("change", () => {
  void saveState({
    enabled: enabledInput.checked,
  });
});

colorInput?.addEventListener("input", () => {
  void saveState({
    color: colorInput.value,
  });
});

heightInput?.addEventListener("input", () => {
  void saveState({
    height: Number(heightInput.value),
  });
});

positionInput?.addEventListener("change", () => {
  void saveState({
    position: positionInput.value === "bottom" ? "bottom" : "top",
  });
});

offsetTopInput?.addEventListener("input", () => {
  void saveState({
    offsetTop: Number(offsetTopInput.value),
  });
});

offsetBottomInput?.addEventListener("input", () => {
  void saveState({
    offsetBottom: Number(offsetBottomInput.value),
  });
});

void loadState();
