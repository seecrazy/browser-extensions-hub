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

  await chrome.scripting.executeScript({
    target: {
      tabId: activeTab.tabId,
      allFrames: options.allFrames === true,
    },
    files: [options.file],
  });

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
