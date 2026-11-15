import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type ChromeStoreMetadata = {
  schemaVersion: 1;
  package: {
    plugin: string;
    packageName: string;
    version: string;
    targetStore: "chrome-web-store";
  };
  listing: {
    name: string;
    summary: string;
    description: string;
    permissionJustifications: Record<string, string>;
    category: string | null;
    language: string;
    screenshotPaths: string[];
    promoImages: {
      small: string | null;
      marquee: string | null;
    };
    privacyPolicyUrl: string | null;
    supportUrl: string | null;
    homepageUrl: string | null;
  };
  compliance: {
    singlePurpose: string;
    remoteCode: false;
    ads: false;
    analytics: false;
    accounts: false;
    dataSaleOrSharing: false;
  };
  manifest: {
    version: string;
    permissions: string[];
    hostPermissions: string[];
    icons: Record<string, string>;
  };
  privacySummary: string[];
  permissionNotes: string;
  openItems: string[];
};

export type ChromeListing = {
  name: string;
  summary: string;
  description: string;
  singlePurpose: string;
  permissionJustifications: Record<string, string>;
};

function parseSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  let currentHeading: string | undefined;
  let lines: string[] = [];

  const flush = (): void => {
    if (currentHeading) {
      sections.set(currentHeading.toLowerCase(), lines.join("\n").trim());
    }
  };

  for (const line of markdown.split(/\r?\n/)) {
    const match = /^##\s+(.+?)\s*$/.exec(line);

    if (match) {
      flush();
      currentHeading = match[1];
      lines = [];
      continue;
    }

    if (currentHeading) {
      lines.push(line);
    }
  }

  flush();
  return sections;
}

function requireSection(sections: Map<string, string>, heading: string): string {
  const value = sections.get(heading.toLowerCase());

  if (!value) {
    throw new Error(`Missing Chrome listing section: ${heading}`);
  }

  return value;
}

export function parseChromeListing(markdown: string): ChromeListing {
  const sections = parseSections(markdown);
  const justificationSection = requireSection(sections, "Permission justifications");
  const permissionJustifications: Record<string, string> = {};

  for (const line of justificationSection.split(/\r?\n/)) {
    const match = /^-\s+`([^`]+)`:\s+(.+)$/.exec(line.trim());

    if (!match) {
      throw new Error("Permission justifications must use: - `permission`: reason");
    }

    permissionJustifications[match[1]] = match[2];
  }

  return {
    name: requireSection(sections, "Name"),
    summary: requireSection(sections, "Short description"),
    description: requireSection(sections, "Detailed description"),
    singlePurpose: requireSection(sections, "Single purpose"),
    permissionJustifications,
  };
}

function parseBullets(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

type Manifest = {
  version?: string;
  permissions?: string[];
  host_permissions?: string[];
  icons?: Record<string, string>;
};

export function buildChromeStoreMetadata(input: {
  plugin: string;
  packageName: string;
  version: string;
  listing: ChromeListing;
  privacyMarkdown: string;
  permissionsMarkdown: string;
  manifest: Manifest;
  screenshotPaths?: string[];
  promoImages?: { small?: string | null; marquee?: string | null };
}): ChromeStoreMetadata {
  if (input.manifest.version !== input.version) {
    throw new Error(
      `Manifest version "${input.manifest.version}" does not match package version "${input.version}".`,
    );
  }

  const privacySummary = parseBullets(input.privacyMarkdown);

  const requiredPermissions = [
    ...(input.manifest.permissions ?? []),
    ...(input.manifest.host_permissions ?? []),
  ];
  const missingJustifications = requiredPermissions.filter(
    (permission) => !input.listing.permissionJustifications[permission],
  );

  if (missingJustifications.length > 0) {
    throw new Error(
      `Missing Chrome permission justifications for: ${missingJustifications.join(", ")}`,
    );
  }

  if (privacySummary.length === 0) {
    throw new Error("Privacy listing must contain bullet points.");
  }

  const openItems: string[] = [
    "Select a Chrome Web Store category in the dashboard.",
    ...(input.screenshotPaths && input.screenshotPaths.length > 0
      ? []
      : ["Add the required store screenshots."]),
    "Set a privacy policy URL if required by the store review.",
    "Set support and homepage URLs, if you want them shown publicly.",
  ];

  return {
    schemaVersion: 1,
    package: {
      plugin: input.plugin,
      packageName: input.packageName,
      version: input.version,
      targetStore: "chrome-web-store",
    },
    listing: {
      name: input.listing.name,
      summary: input.listing.summary,
      description: input.listing.description,
      permissionJustifications: input.listing.permissionJustifications,
      category: null,
      language: "en",
      screenshotPaths: input.screenshotPaths ?? [],
      promoImages: {
        small: input.promoImages?.small ?? null,
        marquee: input.promoImages?.marquee ?? null,
      },
      privacyPolicyUrl: null,
      supportUrl: null,
      homepageUrl: null,
    },
    compliance: {
      singlePurpose: input.listing.singlePurpose,
      remoteCode: false,
      ads: false,
      analytics: false,
      accounts: false,
      dataSaleOrSharing: false,
    },
    manifest: {
      version: input.manifest.version ?? input.version,
      permissions: input.manifest.permissions ?? [],
      hostPermissions: input.manifest.host_permissions ?? [],
      icons: input.manifest.icons ?? {},
    },
    privacySummary,
    permissionNotes: input.permissionsMarkdown.trim(),
    openItems,
  };
}

export function createChromeSubmissionReport(
  metadata: ChromeStoreMetadata,
  chromeZipName: string,
): string {
  return [
    `# Chrome Web Store submission — ${metadata.package.plugin} ${metadata.package.version}`,
    "",
    "Upload the zip file whose root contains `manifest.json`:",
    "",
    "```text",
    chromeZipName,
    "```",
    "",
    "## Store listing fields",
    "",
    "- Name: " + metadata.listing.name,
    "- Short description: " + metadata.listing.summary,
    "",
    "### Detailed description",
    "",
    metadata.listing.description,
    "",
    "## Privacy practices tab",
    "",
    "### Single purpose",
    "",
    metadata.compliance.singlePurpose,
    "",
    "### Permission justifications",
    "",
    ...Object.entries(metadata.listing.permissionJustifications).map(
      ([permission, reason]) => `- ${permission}: ${reason}`,
    ),
    "",
    "### Data-use confirmation",
    "",
    ...metadata.privacySummary.map((line) => `- ${line}`),
    "",
    "Certify in the Chrome dashboard that the disclosures below match the plugin's implementation and the privacy summary above.",
    "",
    "## Privacy summary",
    "",
    ...metadata.privacySummary.map((line) => `- ${line}`),
    "",
    "## Complete in the Chrome dashboard",
    "",
    ...metadata.openItems.map((line) => `- [ ] ${line}`),
    "",
  ].join("\n");
}

export function loadChromeStoreMetadata(options: {
  plugin: string;
  packageName: string;
  version: string;
  root: string;
}): { metadata: ChromeStoreMetadata; report: string } {
  const pluginDir = path.join(options.root, "extensions", options.plugin);
  const listingDir = path.join(options.root, "docs", "listings", options.plugin);
  const manifest = JSON.parse(
    readFileSync(path.join(pluginDir, "dist", "chrome-mv3", "manifest.json"), "utf8"),
  ) as Manifest;
  const listing = parseChromeListing(readFileSync(path.join(listingDir, "chrome.md"), "utf8"));
  const privacyMarkdown = readFileSync(path.join(listingDir, "privacy.md"), "utf8");
  const permissionsMarkdown = readFileSync(path.join(listingDir, "permissions.md"), "utf8");
  const screenshotPaths = ["main-1280x800.png", "secondary-640x400.png"]
    .map((file) => `images/screenshots/${file}`)
    .filter((file) => existsSync(path.join(listingDir, file)));
  const promoImages = {
    small: existsSync(path.join(listingDir, "images/promo/small-440x280.png"))
      ? "images/promo/small-440x280.png"
      : null,
    marquee: existsSync(path.join(listingDir, "images/promo/marquee-1400x560.png"))
      ? "images/promo/marquee-1400x560.png"
      : null,
  };
  const metadata = buildChromeStoreMetadata({
    plugin: options.plugin,
    packageName: options.packageName,
    version: options.version,
    listing,
    privacyMarkdown,
    permissionsMarkdown,
    manifest,
    screenshotPaths,
    promoImages,
  });
  const report = createChromeSubmissionReport(
    metadata,
    `${options.plugin}-${options.version}-chrome-mv3.zip`,
  );

  return { metadata, report };
}
