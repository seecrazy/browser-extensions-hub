export type MessageResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export type MessageSenderInfo = {
  tab?:
    | {
        id?: number | undefined;
      }
    | undefined;
};

export type MaybePromise<T> = T | Promise<T>;

export type MessageContract = Record<
  string,
  {
    payload?: unknown;
    response: unknown;
  }
>;

type ContractKey<T extends MessageContract> = keyof T & string;

type MessageFor<
  T extends MessageContract,
  K extends ContractKey<T>,
> = T[K]["payload"] extends undefined
  ? {
      type: K;
    }
  : {
      type: K;
      payload: T[K]["payload"];
    };

export type ContractHandler<T extends MessageContract, K extends ContractKey<T>> = (
  payload: T[K]["payload"],
  sender?: MessageSenderInfo,
) => MaybePromise<T[K]["response"]>;

export type ContractHandlers<T extends MessageContract> = {
  [K in ContractKey<T>]: ContractHandler<T, K>;
};

export type SendOptions = {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

function isResponse<T>(value: unknown): value is MessageResponse<T> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return "ok" in value;
}

export function success<T>(data: T): MessageResponse<T> {
  return {
    ok: true,
    data,
  };
}

export function failure(code: string, message: string): MessageResponse<never> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function timeoutFailure(timeoutMs: number): MessageResponse<never> {
  return failure("TIMEOUT", `Message handler did not respond in ${timeoutMs}ms.`);
}

async function callChromeApi(
  call: (callback: (result: unknown) => void) => void,
  timeoutMs: number,
): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return new Promise<unknown>((resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error("__HUB_TIMEOUT__"));
    }, timeoutMs);

    call((result) => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message ?? "Runtime message failed."));
        return;
      }

      resolve(result);
    });
  });
}

function normalizeResponse<T>(response: unknown, invalidMessage: string): MessageResponse<T> {
  if (!isResponse<T>(response)) {
    return failure("INVALID_RESPONSE", invalidMessage);
  }

  return response;
}

export function defineMessageContract<TContract extends MessageContract>(
  contract: TContract,
): TContract {
  return contract;
}

export function createMessageSender<TContract extends MessageContract>(contract: TContract) {
  void contract;

  return async <K extends ContractKey<TContract>>(
    message: MessageFor<TContract, K>,
    options: SendOptions = {},
  ): Promise<MessageResponse<TContract[K]["response"]>> => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    try {
      const response = await callChromeApi((callback) => {
        chrome.runtime.sendMessage(message, callback);
      }, timeoutMs);
      return normalizeResponse<TContract[K]["response"]>(
        response,
        "Message handler returned an invalid response.",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "__HUB_TIMEOUT__") {
        return timeoutFailure(timeoutMs);
      }

      return failure("RUNTIME_ERROR", error instanceof Error ? error.message : String(error));
    }
  };
}

export function createTabMessageSender<TContract extends MessageContract>(contract: TContract) {
  void contract;

  return async <K extends ContractKey<TContract>>(
    tabId: number,
    message: MessageFor<TContract, K>,
    options: SendOptions = {},
  ): Promise<MessageResponse<TContract[K]["response"]>> => {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    try {
      const response = await callChromeApi((callback) => {
        chrome.tabs.sendMessage(tabId, message, callback);
      }, timeoutMs);
      return normalizeResponse<TContract[K]["response"]>(
        response,
        "Content script returned an invalid response.",
      );
    } catch (error) {
      if (error instanceof Error && error.message === "__HUB_TIMEOUT__") {
        return timeoutFailure(timeoutMs);
      }

      return failure("TAB_MESSAGE_ERROR", error instanceof Error ? error.message : String(error));
    }
  };
}

export function createContractDispatcher<TContract extends MessageContract>(
  contract: TContract,
  handlers: ContractHandlers<TContract>,
) {
  const handlerMap = handlers as unknown as Record<
    string,
    (payload: unknown, sender?: MessageSenderInfo) => unknown
  >;

  void contract;

  return async (
    message: unknown,
    sender?: MessageSenderInfo,
  ): Promise<MessageResponse<unknown>> => {
    if (
      typeof message !== "object" ||
      message === null ||
      typeof (message as { type?: unknown }).type !== "string"
    ) {
      return failure("INVALID_MESSAGE", "Message must contain a string type.");
    }

    const type = (message as { type: string }).type;
    const handler = handlerMap[type];

    if (!handler) {
      return failure("UNSUPPORTED_MESSAGE", `No handler for "${type}".`);
    }

    try {
      return success(await handler((message as { payload?: unknown }).payload, sender));
    } catch (error) {
      return failure("HANDLER_ERROR", error instanceof Error ? error.message : String(error));
    }
  };
}

export function onContractMessage<TContract extends MessageContract>(
  contract: TContract,
  handlers: ContractHandlers<TContract>,
): void {
  const dispatcher = createContractDispatcher(contract, handlers);

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void dispatcher(message, sender).then(sendResponse);
    return true;
  });
}
