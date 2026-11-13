import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const extensionsDir = path.resolve(process.cwd(), "extensions");
const plugins = [
  "_template",
  "dark-mode-lite",
  "tab-stash",
  "volume-booster",
  "quick-translate",
  "focus-lock",
] as const;

const forbiddenPermissions = new Set([
  "webRequestBlocking",
  "debugger",
  "management",
  "nativeMessaging",
  "cookies",
  "history",
  "bookmarks",
  "downloads",
]);

type Manifest = {
  manifest_version?: number;
  name?: string;
  version?: string;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{
    matches?: string[];
  }>;
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  browser_specific_settings?: {
    gecko?: {
      id?: string;
    };
  };
};

function readManifest(browserTarget: "chrome" | "firefox", plugin: string): Manifest {
  const manifestPath = path.join(
    extensionsDir,
    plugin,
    ".output",
    `${browserTarget}-mv3`,
    "manifest.json",
  );

  if (!existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${path.relative(process.cwd(), manifestPath)}`);
  }

  return JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
}

function validateManifest(browserTarget: "chrome" | "firefox", plugin: string): void {
  const manifest = readManifest(browserTarget, plugin);
  const errors: string[] = [];

  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, got ${manifest.manifest_version}`);
  }

  if (!manifest.name) {
    errors.push("manifest.name is required");
  }

  if (!manifest.version) {
    errors.push("manifest.version is required");
  }

  if (browserTarget === "chrome" && manifest.background && !manifest.background.service_worker) {
    errors.push("Chrome MV3 background, when present, must use service_worker");
  }

  if (browserTarget === "firefox" && !manifest.browser_specific_settings?.gecko?.id) {
    errors.push("Firefox manifest requires browser_specific_settings.gecko.id");
  }

  for (const permission of manifest.permissions ?? []) {
    if (forbiddenPermissions.has(permission)) {
      errors.push(`Permission "${permission}" is forbidden without an approved ADR exception`);
    }
  }

  const hostPermissions = manifest.host_permissions ?? [];

  if (hostPermissions.includes("<all_urls>")) {
    errors.push('host_permissions must not contain "<all_urls>"');
  }

  for (const contentScript of manifest.content_scripts ?? []) {
    if (contentScript.matches?.includes("<all_urls>")) {
      errors.push('Registered content_scripts.matches must not contain "<all_urls>"');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `${plugin} (${browserTarget}):\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }
}

let failed = false;

for (const plugin of plugins) {
  for (const browserTarget of ["chrome", "firefox"] as const) {
    try {
      validateManifest(browserTarget, plugin);
      console.log(`✓ ${plugin} ${browserTarget} MV3`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (failed) {
  process.exit(1);
}
