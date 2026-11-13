type MessageSender = {
  tab?:
    | {
        id?: number | undefined;
      }
    | undefined;
};

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

export type MessageOf<TType extends string, TPayload = undefined> = TPayload extends undefined
  ? { type: TType }
  : { type: TType; payload: TPayload };

type Handler<TPayload, TResult> = (
  payload: TPayload,
  sender?: RuntimeMessageSender,
) => TResult | Promise<TResult>;

export type MessageHandlerMap = Record<string, Handler<never, unknown>>;

export type RuntimeMessageSender = MessageSender;

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

export function defineMessageHandler<TMap extends MessageHandlerMap>(handlers: TMap) {
  return (message: unknown, sender?: RuntimeMessageSender): Promise<MessageResponse<unknown>> => {
    const run = async (): Promise<MessageResponse<unknown>> => {
      if (
        typeof message !== "object" ||
        message === null ||
        typeof (message as { type?: unknown }).type !== "string"
      ) {
        return failure("INVALID_MESSAGE", "Message must contain a string type.");
      }

      const type = (message as { type: string }).type;
      const handlerMap = handlers as unknown as Record<string, Handler<unknown, unknown>>;
      const handler = handlerMap[type];

      if (!handler) {
        return failure("UNSUPPORTED_MESSAGE", `No handler for "${type}".`);
      }

      const payload = (message as { payload?: unknown }).payload;

      try {
        return success(await handler(payload as never, sender));
      } catch (error) {
        const messageText = error instanceof Error ? error.message : String(error);
        return failure("HANDLER_ERROR", messageText);
      }
    };

    return run();
  };
}

export function onRuntimeMessage<TMap extends MessageHandlerMap>(handlers: TMap): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    void defineMessageHandler(handlers)(message, sender).then(sendResponse);
    return true;
  });
}

export async function sendMessage<TType extends string, TResult>(
  message: TType extends string
    ? {
        type: TType;
        payload?: unknown;
      }
    : never,
): Promise<MessageResponse<TResult>> {
  try {
    const response = await new Promise<unknown>((resolve) => {
      chrome.runtime.sendMessage(message, (result) => {
        resolve(result);
      });
    });

    if (chrome.runtime.lastError) {
      return failure(
        "RUNTIME_ERROR",
        chrome.runtime.lastError.message ?? "Runtime message failed.",
      );
    }

    if (!isResponse<TResult>(response)) {
      return failure("INVALID_RESPONSE", "Message handler returned an invalid response.");
    }

    return response;
  } catch (error) {
    return failure("RUNTIME_ERROR", error instanceof Error ? error.message : String(error));
  }
}

export async function sendTabMessage<TType extends string, TResult>(
  tabId: number,
  message: TType extends string
    ? {
        type: TType;
        payload?: unknown;
      }
    : never,
): Promise<MessageResponse<TResult>> {
  try {
    const response = await new Promise<unknown>((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (result) => {
        resolve(result);
      });
    });

    if (chrome.runtime.lastError) {
      return failure(
        "TAB_MESSAGE_ERROR",
        chrome.runtime.lastError.message ?? "Tab message failed.",
      );
    }

    if (!isResponse<TResult>(response)) {
      return failure("INVALID_RESPONSE", "Content script returned an invalid response.");
    }

    return response;
  } catch (error) {
    return failure("TAB_MESSAGE_ERROR", error instanceof Error ? error.message : String(error));
  }
}
