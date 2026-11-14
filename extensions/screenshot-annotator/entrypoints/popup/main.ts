import { browser } from "wxt/browser";
import { createStatusView } from "@hub/shared/ui";
import "@hub/shared/ui/styles.css";

const captureButton = document.querySelector<HTMLButtonElement>("#capture");
const statusView = createStatusView(document.querySelector<HTMLParagraphElement>("#status"));

async function openAnnotator(dataUrl: string): Promise<void> {
  await browser.storage.session.set({
    "screenshot-annotator.capture": dataUrl,
  });
  await browser.tabs.create({
    url: browser.runtime.getURL("/annotate.html"),
  });
}

captureButton?.addEventListener("click", async () => {
  if (!captureButton) {
    return;
  }

  captureButton.disabled = true;
  statusView.set("Capturing...");

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
    statusView.set("Opened annotator.");
  } catch (error) {
    statusView.set(error instanceof Error ? error.message : "Capture failed.", true);
  } finally {
    captureButton.disabled = false;
  }
});
