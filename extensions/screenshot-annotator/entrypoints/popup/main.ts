import { browser } from "wxt/browser";
import "@hub/shared/ui/styles.css";

const captureButton = document.querySelector<HTMLButtonElement>("#capture");
const status = document.querySelector<HTMLParagraphElement>("#status");

function setStatus(message: string, isError = false): void {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("hub-status-error", isError);
}

async function openAnnotator(dataUrl: string): Promise<void> {
  await browser.storage.session.set({
    "screenshot-annotator.capture": dataUrl,
  });
  await browser.tabs.create({
    url: browser.runtime.getURL("/annotate.html"),
  });
}

captureButton?.addEventListener("click", async () => {
  if (!captureButton || !status) {
    return;
  }

  captureButton.disabled = true;
  setStatus("Capturing...");

  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.windowId) {
      throw new Error("No active tab available.");
    }

    const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });

    if (!dataUrl) {
      throw new Error("Capture failed.");
    }

    await openAnnotator(dataUrl);
    setStatus("Opened annotator.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Capture failed.", true);
  } finally {
    captureButton.disabled = false;
  }
});
