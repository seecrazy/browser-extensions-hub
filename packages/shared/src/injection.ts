export type InjectRuntimeContentScriptOptions = {
  file: string;
  allFrames?: boolean;
};

export type InjectionResult = {
  tabId: number;
  url?: string;
  origin?: string;
};

function safeOrigin(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export function isInjectableUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const protocol = new URL(url).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function getInjectionErrorMessage(error: unknown, url?: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (
    !isInjectableUrl(url) ||
    rawMessage.includes("Cannot access a chrome:// URL") ||
    rawMessage.includes("cannot access contents of the page") ||
    rawMessage.includes("Missing host permission")
  ) {
    return "This page type cannot be modified. Open an http or https website.";
  }

  return rawMessage;
}

export async function getActiveTab(): Promise<{
  tabId?: number;
  url?: string;
}> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return {
    ...(tab?.id !== undefined ? { tabId: tab.id } : {}),
    ...(tab?.url ? { url: tab.url } : {}),
  };
}

export async function injectRuntimeContentScript(
  options: InjectRuntimeContentScriptOptions,
): Promise<InjectionResult> {
  const activeTab = await getActiveTab();

  if (activeTab.tabId === undefined) {
    throw new Error("No active tab available.");
  }

  try {
    await chrome.scripting.executeScript({
      target: {
        tabId: activeTab.tabId,
        allFrames: options.allFrames === true,
      },
      files: [options.file],
    });
  } catch (error) {
    throw new Error(getInjectionErrorMessage(error, activeTab.url));
  }

  const result: InjectionResult = {
    tabId: activeTab.tabId,
  };

  if (activeTab.url) {
    result.url = activeTab.url;
  }

  const origin = safeOrigin(activeTab.url);

  if (origin) {
    result.origin = origin;
  }

  return result;
}
