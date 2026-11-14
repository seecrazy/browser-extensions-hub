import { createMessageSender } from "@hub/shared/messaging";
import { createNamespacedStorage } from "@hub/shared/storage";
import { quickTranslateMessages } from "../lib/messages";
import { isRtlLanguage, translateDefaults, validateTranslateSettings } from "../lib/types";

const settingsStorage = createNamespacedStorage(
  "quick-translate.settings",
  translateDefaults,
  "local",
  {
    validate: validateTranslateSettings,
  },
);
const sendMessage = createMessageSender(quickTranslateMessages);
const cache = new Map<string, string>();

const hostId = "__hub-quick-translate-host__";
let shadowRoot: ShadowRoot | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let currentSelectionText = "";

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

      .bubble-actions {
        display: flex;
        gap: 4px;
      }

      .bubble-button {
        padding: 2px 7px;
        color: #f9fafb;
        background: transparent;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
      }

      .bubble-button:hover {
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
  const bubble = shadowRoot?.querySelector(".bubble");
  bubble?.remove();
}

function copyTranslation(): void {
  const text = shadowRoot?.querySelector<HTMLElement>(".bubble-text")?.textContent ?? "";

  if (text && navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  }
}

function showBubble(text: string, options: { isError?: boolean; dir?: "ltr" | "rtl" } = {}): void {
  const root = getShadowRoot();
  root.querySelector(".bubble")?.remove();
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const header = document.createElement("div");
  header.className = "bubble-header";
  const title = document.createElement("span");
  title.className = "bubble-title";
  title.textContent = "Quick Translate";
  const actions = document.createElement("div");
  actions.className = "bubble-actions";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "bubble-button";
  copyButton.textContent = "Copy";
  copyButton.setAttribute("aria-label", "Copy translation");
  copyButton.addEventListener("click", copyTranslation);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "bubble-button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close translation");
  closeButton.addEventListener("click", hideBubble);
  actions.append(copyButton, closeButton);
  header.append(title, actions);
  const content = document.createElement("p");
  content.className = options.isError ? "bubble-text bubble-error" : "bubble-text";
  content.textContent = text;
  content.dir = options.dir ?? "auto";
  bubble.append(header, content);
  root.append(bubble);
}

function positionBubble(rect: DOMRect): void {
  const bubble = shadowRoot?.querySelector(".bubble") as HTMLElement | null;

  if (!bubble) {
    return;
  }

  const margin = 8;
  let left = rect.left;
  let top = rect.bottom + margin;

  left = Math.max(margin, Math.min(window.innerWidth - bubble.offsetWidth - margin, left));

  if (top + bubble.offsetHeight > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - bubble.offsetHeight - margin);
  }

  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

function isEditableSelection(node: Node | null): boolean {
  const element = node instanceof Element ? node : node?.parentElement;
  return Boolean(
    element?.closest("input, textarea, select, [contenteditable=true], [contenteditable='']"),
  );
}

function selectionIsInsideBubble(node: Node | null): boolean {
  return Boolean(node?.parentElement?.closest(`#${hostId}`));
}

async function translateSelection(selection: Selection): Promise<void> {
  if (selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const rawText = selection.toString().trim();

  if (
    !rawText ||
    isEditableSelection(selection.anchorNode) ||
    isEditableSelection(selection.focusNode)
  ) {
    return;
  }

  const settings = await settingsStorage.get();
  const text = rawText.length > 1000 ? `${rawText.slice(0, 1000)}...` : rawText;
  const cacheKey = `${settings.targetLanguage}:${text}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    showBubble(cached);
    positionBubble(rect);
    return;
  }

  showBubble(`Translating to ${settings.targetLanguage}...`);
  positionBubble(rect);
  const response = await sendMessage(
    {
      type: "QUICK_TRANSLATE_TRANSLATE",
      payload: {
        text,
        targetLanguage: settings.targetLanguage,
      },
    },
    {
      timeoutMs: settings.timeoutMs,
    },
  );

  if (!response.ok) {
    showBubble(response.error.message, {
      isError: true,
    });
    positionBubble(rect);
    return;
  }

  cache.set(cacheKey, response.data.text);
  showBubble(response.data.text, {
    dir: isRtlLanguage(response.data.sourceLanguage ?? settings.targetLanguage) ? "rtl" : "ltr",
  });
  positionBubble(rect);
}

function handleSelectionChange(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    const selection = document.getSelection();

    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount === 0 ||
      selectionIsInsideBubble(selection.anchorNode)
    ) {
      hideBubble();
      return;
    }

    const text = selection.toString().trim();

    if (!text || text === currentSelectionText) {
      return;
    }

    currentSelectionText = text;
    void translateSelection(selection);
  }, 220);
}

async function initialize(): Promise<void> {
  const installedMarker = "__hubQuickTranslateInstalled";
  const windowWithMarker = window as typeof window & Record<string, boolean | undefined>;

  if (windowWithMarker[installedMarker]) {
    return;
  }

  windowWithMarker[installedMarker] = true;
  document.addEventListener("selectionchange", handleSelectionChange, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideBubble();
    }
  });
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
