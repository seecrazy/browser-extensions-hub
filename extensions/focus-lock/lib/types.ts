export type FocusLockSettings = {
  schemaVersion: 1;
  domains: string[];
  unlockedUntil: Record<string, number>;
  passwordHash?: string;
  passwordSalt?: string;
  failedAttempts: number;
  lockoutUntil?: number;
};

export type FocusLockState = {
  domains: string[];
  hasPassword: boolean;
  failedAttempts: number;
  lockedUntil?: number;
  unlockedDomains: string[];
};

export const focusLockDefaults: FocusLockSettings = {
  schemaVersion: 1,
  domains: [],
  unlockedUntil: {},
  failedAttempts: 0,
};

export function normalizeDomain(input: string): string {
  const value = input.trim().toLowerCase();

  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return value
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .toLowerCase();
  }
}

export function isValidDomain(domain: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
}

export function validateFocusLockSettings(value: unknown): FocusLockSettings {
  const record =
    typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const domainsValue = Array.isArray(record.domains) ? record.domains : [];
  const unlockedRecord =
    typeof record.unlockedUntil === "object" && record.unlockedUntil !== null
      ? (record.unlockedUntil as Record<string, unknown>)
      : {};
  const unlockedUntil: Record<string, number> = {};

  for (const [domain, until] of Object.entries(unlockedRecord)) {
    if (typeof until === "number") {
      unlockedUntil[domain] = until;
    }
  }

  return {
    schemaVersion: 1,
    domains: [
      ...new Set(domainsValue.filter((domain): domain is string => typeof domain === "string")),
    ],
    unlockedUntil,
    ...(typeof record.passwordHash === "string" ? { passwordHash: record.passwordHash } : {}),
    ...(typeof record.passwordSalt === "string" ? { passwordSalt: record.passwordSalt } : {}),
    failedAttempts: typeof record.failedAttempts === "number" ? record.failedAttempts : 0,
    ...(typeof record.lockoutUntil === "number" ? { lockoutUntil: record.lockoutUntil } : {}),
  };
}
