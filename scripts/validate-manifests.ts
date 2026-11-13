import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const extensionsDir = path.resolve(process.cwd(), "extensions");
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
const broadHostPatterns = new Set([
  "<all_urls>",
  "*://*/*",
  "http://*/*",
  "https://*/*",
  "file:///*",
]);

type BrowserTarget = "chrome" | "firefox";

type Manifest = {
  manifest_version?: number;
  name?: string;
  short_name?: string;
  version?: string;
  description?: string;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts?: Array<{
    matches?: string[];
    js?: string[];
  }>;
  background?: {
    service_worker?: string;
    scripts?: string[];
  };
  action?: {
    default_popup?: string;
  };
  options_ui?: {
    page?: string;
  };
  icons?: Record<string, string>;
  chrome_url_overrides?: {
    newtab?: string;
  };
  browser_specific_settings?: {
    gecko?: {
      id?: string;
    };
  };
};

type PluginPackage = {
  name?: string;
  version?: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const pluginIndex = args.indexOf("--plugin");
  const browserIndex = args.indexOf("--browser");
  const plugin = pluginIndex >= 0 ? args[pluginIndex + 1] : undefined;
  const browser =
    browserIndex >= 0 ? (args[browserIndex + 1] as BrowserTarget | undefined) : undefined;

  return {
    plugin,
    browser,
  };
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function discoverPlugins(): string[] {
  if (!existsSync(extensionsDir)) {
    return [];
  }

  return readdirSync(extensionsDir, {
    withFileTypes: true,
  })
    .filter(
      (entry) =>
        entry.isDirectory() && existsSync(path.join(extensionsDir, entry.name, "package.json")),
    )
    .map((entry) => entry.name);
}

function validateManifest(browserTarget: BrowserTarget, plugin: string): void {
  const pluginDir = path.join(extensionsDir, plugin);
  const packagePath = path.join(pluginDir, "package.json");
  const manifestPath = path.join(pluginDir, "dist", `${browserTarget}-mv3`, "manifest.json");

  if (!existsSync(packagePath)) {
    throw new Error(`Missing package manifest: ${path.relative(process.cwd(), packagePath)}`);
  }

  if (!existsSync(manifestPath)) {
    throw new Error(`Missing built manifest: ${path.relative(process.cwd(), manifestPath)}`);
  }

  const pluginPackage = readJson<PluginPackage>(packagePath);
  const manifest = readJson<Manifest>(manifestPath);
  const outputDir = path.dirname(manifestPath);
  const errors: string[] = [];
  const expectedName = plugin === "_template" ? "@hub/template" : `@hub/${plugin}`;

  if (pluginPackage.name !== expectedName) {
    errors.push(
      `package name must be "${expectedName}", got "${pluginPackage.name ?? "undefined"}"`,
    );
  }

  if (pluginPackage.version && manifest.version && pluginPackage.version !== manifest.version) {
    errors.push(
      `package version "${pluginPackage.version}" does not match manifest version "${manifest.version}"`,
    );
  }

  if (manifest.manifest_version !== 3) {
    errors.push(`manifest_version must be 3, got ${manifest.manifest_version}`);
  }

  if (!manifest.name) {
    errors.push("manifest.name is required");
  }

  if (!manifest.version) {
    errors.push("manifest.version is required");
  }

  if (!manifest.description) {
    errors.push("manifest.description is required");
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

  for (const hostPermission of manifest.host_permissions ?? []) {
    if (broadHostPatterns.has(hostPermission)) {
      errors.push(`host_permissions must not contain broad pattern "${hostPermission}"`);
    }
  }

  for (const contentScript of manifest.content_scripts ?? []) {
    for (const match of contentScript.matches ?? []) {
      if (broadHostPatterns.has(match)) {
        errors.push(`Registered content_scripts.matches must not contain broad pattern "${match}"`);
      }
    }

    for (const file of contentScript.js ?? []) {
      const filePath = path.join(outputDir, file);

      if (!existsSync(filePath)) {
        errors.push(`content script file is missing: ${file}`);
      }
    }
  }

  for (const [size, iconPath] of Object.entries(manifest.icons ?? {})) {
    const resolvedPath = path.join(outputDir, iconPath);

    if (!existsSync(resolvedPath)) {
      errors.push(`icon ${size} is missing: ${iconPath}`);
    }
  }

  if (manifest.chrome_url_overrides?.newtab) {
    const newtabPath = path.join(outputDir, manifest.chrome_url_overrides.newtab);

    if (!existsSync(newtabPath)) {
      errors.push(`new tab page file is missing: ${manifest.chrome_url_overrides.newtab}`);
    }
  }

  if (manifest.action?.default_popup) {
    const popupPath = path.join(outputDir, manifest.action.default_popup);

    if (!existsSync(popupPath)) {
      errors.push(`popup file is missing: ${manifest.action.default_popup}`);
    }
  }

  if (manifest.options_ui?.page) {
    const optionsPath = path.join(outputDir, manifest.options_ui.page);

    if (!existsSync(optionsPath)) {
      errors.push(`options file is missing: ${manifest.options_ui.page}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `${plugin} (${browserTarget}):\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }
}

function main(): void {
  const { plugin: requestedPlugin, browser: requestedBrowser } = parseArgs();

  if (requestedBrowser && requestedBrowser !== "chrome" && requestedBrowser !== "firefox") {
    throw new Error("--browser must be chrome or firefox");
  }

  const availablePlugins = discoverPlugins();
  const plugins = requestedPlugin ? [requestedPlugin] : availablePlugins;
  const browsers: BrowserTarget[] = requestedBrowser ? [requestedBrowser] : ["chrome", "firefox"];
  let failed = false;

  for (const plugin of plugins) {
    if (!availablePlugins.includes(plugin)) {
      failed = true;
      console.error(`✗ Unknown plugin: ${plugin}`);
      continue;
    }

    for (const browserTarget of browsers) {
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
}

main();
