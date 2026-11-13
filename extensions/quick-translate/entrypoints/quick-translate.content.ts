import { createNamespacedStorage } from "@hub/shared/storage";
import { defineMessageHandler, sendMessage } from "@hub/shared/messaging";
import { browser } from "wxt/browser";

type TranslateSettings = {
  schemaVersion: number;
  targetLanguage: string;
};

const settingsStorage = createNamespacedStorage<TranslateSettings>("quick-translate.settings", {
  schemaVersion: 1,
  targetLanguage: "en",
});

const hostId = "__hub-quick-translate-host__";
let shadowRoot: ShadowRoot | null = null;

function getShadowRoot(): ShadowRoot {
  let host = document.getElementById(hostId) as HTMLDivElement | null;

  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.style.position = "fixed";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "none";
    document.body.append(host);
  }

  if (!shadowRoot) {
    shadowRoot = host.attachShadow({
      mode: "open",
    });
    const style = document.createElement("style");
    style.textContent = `
      .bubble {
        pointer-events: auto;
        position: fixed;
        max-width: 360px;
        padding: 10px;
        color: #f9fafb;
        background: #111827;
        border: 1px solid #374151;
        border-radius: 10px;
        box-shadow: 0 10px 24px rgb(0 0 0 / 35%);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }

      .bubble-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }

      .bubble-title {
        color: #9ca3af;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .bubble-close {
        padding: 2px 6px;
        color: #f9fafb;
        background: transparent;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
      }

      .bubble-close:hover {
        background: #374151;
      }

      .bubble-text {
        margin: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .bubble-error {
        color: #fca5a5;
      }
    `;
    shadowRoot.append(style);
  }

  return shadowRoot;
}

function hideBubble(): void {
  const root = shadowRoot;
  const bubble = root?.querySelector(".bubble");
  bubble?.remove();
}

function showBubble(text: string, isError = false): void {
  const root = getShadowRoot();
  const existing = root.querySelector(".bubble");
  existing?.remove();
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const header = document.createElement("div");
  header.className = "bubble-header";
  const title = document.createElement("span");
  title.className = "bubble-title";
  title.textContent = "Quick Translate";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "bubble-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close translation");
  close.addEventListener("click", hideBubble);
  header.append(title, close);
  const content = document.createElement("p");
  content.className = isError ? "bubble-text bubble-error" : "bubble-text";
  content.textContent = text;
  bubble.append(header, content);
  root.append(bubble);
}

function positionBubble(rect: DOMRect): void {
  const bubble = shadowRoot?.querySelector(".bubble") as HTMLElement | null;

  if (!bubble) {
    return;
  }

  const left = Math.max(8, Math.min(window.innerWidth - bubble.offsetWidth - 8, rect.left));
  const top = Math.max(8, rect.bottom + 8);
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

function isEditableSelection(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement;
  return Boolean(
    element?.closest("input, textarea, select, [contenteditable=true], [contenteditable='']"),
  );
}

async function translateSelection(selection: Selection): Promise<void> {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const rawText = selection.toString().trim();

  if (!rawText || isEditableSelection(selection.anchorNode)) {
    return;
  }

  const settings = await settingsStorage.get();
  const text = rawText.length > 1000 ? `${rawText.slice(0, 1000)}...` : rawText;
  showBubble(
    settings.targetLanguage === "auto"
      ? "Translating..."
      : `Translating to ${settings.targetLanguage}...`,
  );
  positionBubble(rect);
  const response = await sendMessage<
    "QUICK_TRANSLATE_TRANSLATE",
    {
      text: string;
    }
  >({
    type: "QUICK_TRANSLATE_TRANSLATE",
    payload: {
      text,
      targetLanguage: settings.targetLanguage,
    },
  });

  if (!response.ok) {
    showBubble(response.error.message, true);
    positionBubble(rect);
    return;
  }

  showBubble(response.data.text);
  positionBubble(rect);
}

async function initialize(): Promise<void> {
  const installedMarker = "__hubQuickTranslateInstalled";
  const windowWithMarker = window as typeof window & Record<string, boolean | undefined>;

  if (windowWithMarker[installedMarker]) {
    return;
  }

  windowWithMarker[installedMarker] = true;
  document.addEventListener(
    "mouseup",
    () => {
      const selection = document.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        hideBubble();
        return;
      }

      void translateSelection(selection);
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideBubble();
    }
  });
  browser.runtime.onMessage.addListener(
    defineMessageHandler({
      QUICK_TRANSLATE_PING: () => {
        return {
          active: true,
        };
      },
    }),
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
