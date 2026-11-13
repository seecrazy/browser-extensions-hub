import { createNamespacedStorage } from "@hub/shared/storage";
import { onRuntimeMessage } from "@hub/shared/messaging";

type FocusLockSettings = {
  schemaVersion: number;
  domains: string[];
  passwordHash?: string;
  passwordSalt?: string;
  unlockUntil?: number;
  failedAttempts: number;
  lockoutUntil?: number;
};

const settingsStorage = createNamespacedStorage<FocusLockSettings>("focus-lock.settings", {
  schemaVersion: 1,
  domains: [],
  failedAttempts: 0,
});

const DNR_RULE_ID = 1;
const PBKDF2_ITERATIONS = 100000;
const FAILED_ATTEMPT_LIMIT = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const UNLOCK_DURATION_MS = 5 * 60 * 1000;
const COOLDOWN_DURATION_MS = 60 * 1000;

function bytesToBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function hashPassword(password: string, saltBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(saltBase64),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256,
  );
  return bytesToBase64(derivedBits);
}

async function isUnlockActive(): Promise<boolean> {
  const settings = await settingsStorage.get();
  return typeof settings.unlockUntil === "number" && settings.unlockUntil > Date.now();
}

async function syncDnrRules(): Promise<void> {
  const settings = await settingsStorage.get();
  const unlocked = await isUnlockActive();
  const domains = unlocked ? [] : settings.domains;

  if (domains.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [DNR_RULE_ID],
    });
    return;
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [DNR_RULE_ID],
    addRules: [
      {
        id: DNR_RULE_ID,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            extensionPath: "/blocked.html",
          },
        },
        condition: {
          requestDomains: domains,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
    ],
  });
}

async function scheduleRelock(unlockUntil: number): Promise<void> {
  await chrome.alarms.create("focus-lock-relock", {
    when: unlockUntil,
  });
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    void syncDnrRules();
  });
  chrome.runtime.onStartup.addListener(() => {
    void syncDnrRules();
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "focus-lock-relock") {
      void syncDnrRules();
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && "focus-lock.settings" in changes) {
      void syncDnrRules();
    }
  });

  onRuntimeMessage({
    FOCUS_LOCK_GET_STATE: async () => {
      const settings = await settingsStorage.get();
      return {
        domains: settings.domains,
        hasPassword: Boolean(settings.passwordHash),
        failedAttempts: settings.failedAttempts,
        lockedUntil: settings.lockoutUntil,
        unlockUntil: settings.unlockUntil,
      };
    },
    FOCUS_LOCK_ADD_DOMAIN: async (payload: { domain: string }) => {
      const settings = await settingsStorage.get();
      const domain = payload.domain.trim().toLowerCase();

      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
        throw new Error("Please enter a valid domain, such as example.com.");
      }

      if (settings.domains.includes(domain)) {
        return {
          domains: settings.domains,
        };
      }

      const nextDomains = [...settings.domains, domain].sort();
      await settingsStorage.patch({
        domains: nextDomains,
      });
      await syncDnrRules();
      return {
        domains: nextDomains,
      };
    },
    FOCUS_LOCK_REMOVE_DOMAIN: async (payload: { domain: string }) => {
      const settings = await settingsStorage.get();
      const nextDomains = settings.domains.filter((domain) => domain !== payload.domain);
      await settingsStorage.patch({
        domains: nextDomains,
      });
      await syncDnrRules();
      return {
        domains: nextDomains,
      };
    },
    FOCUS_LOCK_SET_PASSWORD: async (payload: { currentPassword: string; newPassword: string }) => {
      const settings = await settingsStorage.get();

      if (settings.passwordHash) {
        if (!payload.currentPassword) {
          throw new Error("Current password is required.");
        }

        const currentSalt = settings.passwordSalt;

        if (!currentSalt) {
          throw new Error("Stored password is invalid.");
        }

        const currentHash = await hashPassword(payload.currentPassword, currentSalt);

        if (!timingSafeEqual(currentHash, settings.passwordHash)) {
          throw new Error("Current password is incorrect.");
        }
      }

      if (payload.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const saltBytes = crypto.getRandomValues(new Uint8Array(16));
      const salt = bytesToBase64(saltBytes.buffer);
      const hash = await hashPassword(payload.newPassword, salt);
      await settingsStorage.patch({
        passwordHash: hash,
        passwordSalt: salt,
        failedAttempts: 0,
      });
      return {
        hasPassword: true,
      };
    },
    FOCUS_LOCK_UNLOCK: async (payload: { password: string }) => {
      const settings = await settingsStorage.get();
      const now = Date.now();

      if (settings.lockoutUntil && settings.lockoutUntil > now) {
        throw new Error("Too many failed attempts. Try again later.");
      }

      if (!settings.passwordHash || !settings.passwordSalt) {
        throw new Error("No password has been set.");
      }

      const candidateHash = await hashPassword(payload.password, settings.passwordSalt);

      if (!timingSafeEqual(candidateHash, settings.passwordHash)) {
        const failedAttempts = settings.failedAttempts + 1;
        const lockoutUntil =
          failedAttempts >= FAILED_ATTEMPT_LIMIT ? now + LOCKOUT_DURATION_MS : undefined;
        await settingsStorage.patch({
          failedAttempts,
          ...(lockoutUntil ? { lockoutUntil } : {}),
        });
        throw new Error("Incorrect password.");
      }

      const unlockUntil = now + UNLOCK_DURATION_MS;
      await settingsStorage.patch({
        failedAttempts: 0,
        unlockUntil,
      });
      await syncDnrRules();
      await scheduleRelock(unlockUntil);
      return {
        unlockUntil,
      };
    },
    FOCUS_LOCK_START_COOLDOWN: async () => {
      const settings = await settingsStorage.get();

      if (settings.passwordHash) {
        throw new Error("Password is required to unlock.");
      }

      const unlockUntil = Date.now() + COOLDOWN_DURATION_MS;
      await settingsStorage.patch({
        unlockUntil,
      });
      await syncDnrRules();
      await scheduleRelock(unlockUntil);
      return {
        unlockUntil,
      };
    },
  });
});
