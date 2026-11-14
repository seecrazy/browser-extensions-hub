import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createContractDispatcher,
  createMessageSender,
  createTabMessageSender,
  defineMessageContract,
  failure,
  success,
} from "../messaging";

type TestContract = {
  PING: {
    payload: undefined;
    response: { pong: boolean };
  };
  ADD: {
    payload: { left: number; right: number };
    response: number;
  };
};

const contract = defineMessageContract<TestContract>({
  PING: {
    payload: undefined,
    response: { pong: true },
  },
  ADD: {
    payload: { left: 1, right: 2 },
    response: 0,
  },
});

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("createContractDispatcher", () => {
  it("dispatches typed handlers", async () => {
    const dispatcher = createContractDispatcher(contract, {
      PING: () => ({ pong: true }),
      ADD: (payload) => payload.left + payload.right,
    });

    await expect(dispatcher({ type: "ADD", payload: { left: 2, right: 3 } })).resolves.toEqual(
      success(5),
    );
    await expect(dispatcher({ type: "PING" })).resolves.toEqual(success({ pong: true }));
  });

  it("rejects unsupported and invalid messages", async () => {
    const dispatcher = createContractDispatcher(contract, {
      PING: () => ({ pong: true }),
      ADD: () => 0,
    });

    await expect(dispatcher({ type: "MISSING" })).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNSUPPORTED_MESSAGE",
      },
    });
    await expect(dispatcher(null)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "INVALID_MESSAGE",
      },
    });
  });

  it("converts handler errors", async () => {
    const dispatcher = createContractDispatcher(contract, {
      PING: () => {
        throw new Error("boom");
      },
      ADD: () => 0,
    });

    await expect(dispatcher({ type: "PING" })).resolves.toEqual(failure("HANDLER_ERROR", "boom"));
  });
});

describe("createMessageSender", () => {
  it("returns normalized responses", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        lastError: undefined,
        sendMessage: vi.fn((_message, callback) => {
          callback(success(7));
        }),
      },
    });
    const sendMessage = createMessageSender(contract);

    await expect(
      sendMessage({
        type: "ADD",
        payload: { left: 3, right: 4 },
      }),
    ).resolves.toEqual(success(7));
  });

  it("returns a timeout response", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        lastError: undefined,
        sendMessage: vi.fn((_message, _callback) => {
          return undefined;
        }),
      },
    });
    const sendMessage = createMessageSender(contract);

    await expect(
      sendMessage(
        {
          type: "PING",
        },
        {
          timeoutMs: 20,
        },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "TIMEOUT",
      },
    });
  });
});

describe("createTabMessageSender", () => {
  it("retries while a runtime-injected content script registers its listener", async () => {
    let calls = 0;

    vi.stubGlobal("chrome", {
      runtime: {
        lastError: undefined,
      },
      tabs: {
        sendMessage: vi.fn(
          (_tabId: number, _message: unknown, callback: (result: unknown) => void) => {
            calls += 1;

            if (calls === 1) {
              chrome.runtime.lastError = {
                message: "Could not establish connection. Receiving end does not exist.",
              };
              callback(undefined);
              chrome.runtime.lastError = undefined;
              return;
            }

            callback(success({ pong: true }));
          },
        ),
      },
    });

    const sendMessage = createTabMessageSender(contract);

    await expect(sendMessage(1, { type: "PING" }, { connectionRetryMs: 100 })).resolves.toEqual(
      success({ pong: true }),
    );
    expect(calls).toBe(2);
  });

  it("returns the receiving-end error after retries are exhausted", async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        lastError: undefined,
      },
      tabs: {
        sendMessage: vi.fn(
          (_tabId: number, _message: unknown, callback: (result: unknown) => void) => {
            chrome.runtime.lastError = {
              message: "Could not establish connection. Receiving end does not exist.",
            };
            callback(undefined);
            chrome.runtime.lastError = undefined;
          },
        ),
      },
    });

    const sendMessage = createTabMessageSender(contract);

    await expect(
      sendMessage(1, { type: "PING" }, { connectionRetryMs: 10 }),
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "TAB_MESSAGE_ERROR",
        message: expect.stringContaining("Receiving end does not exist"),
      },
    });
  });
});
