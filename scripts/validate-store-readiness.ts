import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const extensionsDir = path.join(root, "extensions");
const listingsDir = path.join(root, "docs", "listings");

type BrowserTarget = "chrome" | "firefox";

type Manifest = {
  name?: string;
  version?: string;
  description?: string;
  permissions?: string[];
  host_permissions?: string[];
  background?: {
    service_worker?: string;
  };
  action?: {
    default_popup?: string;
  };
  options_ui?: {
    page?: string;
  };
  chrome_url_overrides?: {
    newtab?: string;
  };
  icons?: Record<string, string>;
  browser_specific_settings?: {
    gecko?: {
      id?: string;
      data_collection_permissions?: {
        required?: string[];
      };
    };
  };
};

type PluginPackage = {
  name?: string;
  version?: string;
};

function parseArgs(): {
  plugin?: string;
  browser?: BrowserTarget;
  allowIncomplete: boolean;
} {
  const args = process.argv.slice(2);
  const pluginIndex = args.indexOf("--plugin");
  const browserIndex = args.indexOf("--browser");
  const browser =
    browserIndex >= 0 ? (args[browserIndex + 1] as BrowserTarget | undefined) : undefined;
  return {
    plugin: pluginIndex >= 0 ? args[pluginIndex + 1] : undefined,
    browser,
    allowIncomplete: args.includes("--allow-incomplete"),
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

function pngSize(file: string): {
  width: number;
  height: number;
} {
  const buffer = readFileSync(file);

  if (
    buffer.length < 24 ||
    !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    throw new Error("Not a PNG file");
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function hasNoPlaceholders(content: string): boolean {
  return !/placeholder|TODO|FIXME/i.test(content);
}

function validateStoreReadiness(
  browserTarget: BrowserTarget,
  plugin: string,
  allowIncomplete: boolean,
): void {
  const pluginDir = path.join(extensionsDir, plugin);
  const packageFile = path.join(pluginDir, "package.json");
  const manifestFile = path.join(pluginDir, "dist", `${browserTarget}-mv3`, "manifest.json");
  const listingDir = path.join(listingsDir, plugin);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(packageFile) || !existsSync(manifestFile)) {
    throw new Error(`Missing package manifest or built manifest for ${plugin} (${browserTarget}).`);
  }

  const pluginPackage = readJson<PluginPackage>(packageFile);
  const manifest = readJson<Manifest>(manifestFile);
  const outputDir = path.dirname(manifestFile);
  const expectedName = plugin === "_template" ? "@hub/template" : `@hub/${plugin}`;

  if (pluginPackage.name !== expectedName) {
    errors.push(`package name must be "${expectedName}"`);
  }

  if (!manifest.name) errors.push("manifest name is required");
  if (!manifest.version) errors.push("manifest version is required");
  if (!manifest.description || manifest.description.trim().length < 20) {
    errors.push("manifest description must be meaningful");
  }

  for (const [size, icon] of Object.entries(manifest.icons ?? {})) {
    const iconPath = path.join(outputDir, icon);

    if (!existsSync(iconPath)) {
      errors.push(`icon ${size} is missing`);
      continue;
    }

    try {
      const dimensions = pngSize(iconPath);
      const expected = Number(size);

      if (dimensions.width !== expected || dimensions.height !== expected) {
        errors.push(`icon ${size} is ${dimensions.width}x${dimensions.height}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (browserTarget === "firefox") {
    const geckoId = manifest.browser_specific_settings?.gecko?.id;

    if (!geckoId) errors.push("Firefox gecko.id is required");

    const dataCollection = manifest.browser_specific_settings?.gecko?.data_collection_permissions;

    if (dataCollection?.required?.[0] !== "none") {
      errors.push('Firefox data_collection_permissions.required must be ["none"]');
    }
  }

  if (browserTarget === "chrome" && manifest.background && !manifest.background.service_worker) {
    errors.push("Chrome background must use service_worker");
  }

  if (manifest.action?.default_popup) {
    const popupPath = path.join(outputDir, manifest.action.default_popup);

    if (!existsSync(popupPath)) errors.push(`popup is missing: ${manifest.action.default_popup}`);
  }

  if (manifest.options_ui?.page) {
    const optionsPath = path.join(outputDir, manifest.options_ui.page);

    if (!existsSync(optionsPath))
      errors.push(`options page is missing: ${manifest.options_ui.page}`);
  }

  if (manifest.chrome_url_overrides?.newtab) {
    const newtabPath = path.join(outputDir, manifest.chrome_url_overrides.newtab);

    if (!existsSync(newtabPath))
      errors.push(`new tab page is missing: ${manifest.chrome_url_overrides.newtab}`);
  }

  for (const documentName of [
    "chrome.md",
    "firefox.md",
    "privacy.md",
    "permissions.md",
    "screenshots.md",
  ]) {
    const documentPath = path.join(listingDir, documentName);

    if (!existsSync(documentPath)) {
      errors.push(`listing document is missing: docs/listings/${plugin}/${documentName}`);
    }
  }

  const screenshotsPath = path.join(listingDir, "screenshots.md");

  if (existsSync(screenshotsPath)) {
    const content = readFileSync(screenshotsPath, "utf8");

    if (!hasNoPlaceholders(content)) {
      errors.push("screenshots checklist contains placeholder text");
    }

    const unchecked = content.match(/- \[ \]/g)?.length ?? 0;

    if (unchecked > 0) {
      const message = `${unchecked} screenshot checklist item(s) are incomplete`;

      if (allowIncomplete) {
        warnings.push(message);
      } else {
        errors.push(message);
      }
    }
  }

  const privacyPath = path.join(listingDir, "privacy.md");

  if (existsSync(privacyPath) && !hasNoPlaceholders(readFileSync(privacyPath, "utf8"))) {
    errors.push("privacy document contains placeholder text");
  }

  const pluginDocPath = path.join(pluginDir, "PLUGIN.md");
  const qaDocPath = path.join(root, "docs", "qa", `${plugin}.md`);

  if (!existsSync(pluginDocPath)) errors.push("PLUGIN.md is missing");
  if (!existsSync(qaDocPath)) errors.push("docs/qa/<plugin>.md is missing");

  const requiredImages: Array<[string, number, number]> = [
    ["images/screenshots/main-1280x800.png", 1280, 800],
    ["images/screenshots/secondary-640x400.png", 640, 400],
    ["images/promo/small-440x280.png", 440, 280],
    ["images/promo/marquee-1400x560.png", 1400, 560],
  ];

  for (const [relativePath, width, height] of requiredImages) {
    const imagePath = path.join(listingDir, relativePath);

    if (!existsSync(imagePath)) {
      errors.push(`store image is missing: docs/listings/${plugin}/${relativePath}`);
      continue;
    }

    if (statSync(imagePath).size > 1024 * 1024) {
      errors.push(`store image exceeds 1 MB: docs/listings/${plugin}/${relativePath}`);
      continue;
    }

    try {
      const dimensions = pngSize(imagePath);

      if (dimensions.width !== width || dimensions.height !== height) {
        errors.push(
          `store image ${relativePath} is ${dimensions.width}x${dimensions.height}; expected ${width}x${height}`,
        );
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `${plugin} (${browserTarget}):\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  for (const warning of warnings) {
    console.warn(`! ${plugin} (${browserTarget}): ${warning}`);
  }
}

function main(): void {
  const { plugin: requestedPlugin, browser: requestedBrowser, allowIncomplete } = parseArgs();

  if (requestedBrowser && requestedBrowser !== "chrome" && requestedBrowser !== "firefox") {
    throw new Error("--browser must be chrome or firefox");
  }

  const availablePlugins = discoverPlugins();
  const plugins = requestedPlugin
    ? [requestedPlugin]
    : availablePlugins.filter((plugin) => plugin !== "_template");
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
        validateStoreReadiness(browserTarget, plugin, allowIncomplete);
        console.log(`✓ ${plugin} ${browserTarget} store readiness`);
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
