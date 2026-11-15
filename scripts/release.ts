import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

type ReleaseOptions = {
  plugin: string;
  createTag: boolean;
  push: boolean;
  publish: boolean;
  allowIncomplete: boolean;
};

const root = process.cwd();
const releaseRoot = path.join(root, "release");

function printUsage(): never {
  console.log(
    [
      "Usage:",
      "  pnpm release <plugin>                Build, validate, and package a release candidate.",
      "  pnpm release <plugin> --tag          Also create <plugin>@<version> locally.",
      "  pnpm release <plugin> --push         Create the tag, push it, and trigger the release workflow.",
      "  pnpm release <plugin> --publish      Submit directly to store CLIs using local credentials.",
      "  pnpm release <plugin> --publish --skip-chrome",
      "  pnpm release <plugin> --publish --skip-firefox",
      "",
      "Store submission variables:",
      "  CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN, CHROME_PUBLISHER_ID,",
      "  <PLUGIN_SNAKE_CASE>_CHROME_EXTENSION_ID, AMO_JWT_ISSUER, AMO_JWT_SECRET",
    ].join("\n"),
  );
  process.exit(1);
}

function parseReleaseOptions(): ReleaseOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      tag: { type: "boolean", default: false },
      push: { type: "boolean", default: false },
      publish: { type: "boolean", default: false },
      "skip-chrome": { type: "boolean", default: false },
      "skip-firefox": { type: "boolean", default: false },
      "allow-incomplete": { type: "boolean", default: false },
    },
  });

  const plugin = positionals?.[0];

  if (
    typeof plugin !== "string" ||
    !/^[a-z0-9][a-z0-9-]*$/.test(plugin) ||
    plugin === "_template"
  ) {
    printUsage();
  }

  if (values.push) {
    values.tag = true;
  }

  return {
    plugin,
    createTag: values.tag === true,
    push: values.push === true,
    publish: values.publish === true,
    allowIncomplete: values["allow-incomplete"] === true,
  };
}

function run(command: string, args: string[], cwd?: string): void {
  const result = spawnSync(command, args, {
    cwd: cwd ?? root,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }
}

function output(command: string, args: string[]): string {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(" ")}`);
  }

  return result.stdout.trim();
}

function readPlugin(options: ReleaseOptions): { name: string; version: string } {
  const packageFile = path.join(root, "extensions", options.plugin, "package.json");

  if (!exists(packageFile)) {
    throw new Error(`Unknown plugin: ${options.plugin}`);
  }

  const pluginPackage = JSON.parse(readFileSync(packageFile, "utf8")) as {
    name?: string;
    version?: string;
  };

  if (pluginPackage.name !== `@hub/${options.plugin}`) {
    throw new Error(`Expected package name "@hub/${options.plugin}", got "${pluginPackage.name}"`);
  }

  if (!pluginPackage.version || !/^\d+\.\d+\.\d+/.test(pluginPackage.version)) {
    throw new Error(`Plugin version must be semver, got "${pluginPackage.version}"`);
  }

  return {
    name: pluginPackage.name,
    version: pluginPackage.version,
  };
}

function exists(file: string): boolean {
  try {
    readFileSync(file);
    return true;
  } catch {
    return false;
  }
}

function assertCleanTree(): void {
  if (output("git", ["status", "--porcelain"]).length > 0) {
    throw new Error("Git tree is dirty. Commit or stash changes before releasing.");
  }
}

function assertQuality(options: ReleaseOptions): void {
  run("pnpm", ["install", "--frozen-lockfile"]);
  run("pnpm", ["typecheck"]);
  run("pnpm", ["lint"]);
  run("pnpm", ["format:check"]);
  run("pnpm", ["test"]);
  run("pnpm", ["audit", "--prod"]);

  run("pnpm", ["--filter", `@hub/${options.plugin}`, "build:chrome"]);
  run("pnpm", ["--filter", `@hub/${options.plugin}`, "build:firefox"]);

  run("node", [
    "--experimental-strip-types",
    "scripts/validate-manifests.ts",
    "--plugin",
    options.plugin,
    "--browser",
    "chrome",
  ]);
  run("node", [
    "--experimental-strip-types",
    "scripts/validate-manifests.ts",
    "--plugin",
    options.plugin,
    "--browser",
    "firefox",
  ]);

  run("pnpm", ["exec", "web-ext", "lint", "--source-dir", firefoxSource(options.plugin)]);
  run("pnpm", [
    "validate:store-readiness",
    "--plugin",
    options.plugin,
    "--browser",
    "chrome",
    ...(options.allowIncomplete ? ["--allow-incomplete"] : []),
  ]);
  run("pnpm", [
    "validate:store-readiness",
    "--plugin",
    options.plugin,
    "--browser",
    "firefox",
    ...(options.allowIncomplete ? ["--allow-incomplete"] : []),
  ]);
}

function chromeSource(plugin: string): string {
  return path.join(root, "extensions", plugin, "dist", "chrome-mv3");
}

function firefoxSource(plugin: string): string {
  return path.join(root, "extensions", plugin, "dist", "firefox-mv3");
}

function ensureEmptyDirectory(directory: string): void {
  rmSync(directory, {
    recursive: true,
    force: true,
  });
  mkdirSync(directory, {
    recursive: true,
  });
}

function writeChecksums(directory: string): void {
  const files = readdirSync(directory)
    .filter((file) => file !== "SHA256SUMS")
    .sort();
  const checksums = files.map((file) => {
    const data = readFileSync(path.join(directory, file));
    return `${createHash("sha256").update(data).digest("hex")}  ${file}`;
  });

  writeText(path.join(directory, "SHA256SUMS"), `${checksums.join("\n")}\n`);
}

function writeText(file: string, content: string): void {
  writeFileSync(file, content);
}

function packageArtifacts(options: ReleaseOptions, version: string): string {
  const releaseDir = path.join(releaseRoot, options.plugin, version);
  ensureEmptyDirectory(releaseDir);
  const chromeZip = path.join(releaseDir, `${options.plugin}-${version}-chrome-mv3.zip`);
  const firefoxZip = path.join(releaseDir, `${options.plugin}-${version}-firefox-mv3.zip`);
  const sourceZip = path.join(releaseDir, `${options.plugin}-${version}-firefox-source.zip`);

  run("zip", ["-r", "-q", chromeZip, "."], chromeSource(options.plugin));
  run("zip", ["-r", "-q", firefoxZip, "."], firefoxSource(options.plugin));
  run("git", [
    "archive",
    "--format=zip",
    `--output=${sourceZip}`,
    "HEAD",
    `extensions/${options.plugin}`,
    "packages/shared",
    "packages/tsconfig",
    "packages/eslint-config",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "package.json",
    "tsconfig.base.json",
  ]);
  writeChecksums(releaseDir);

  return releaseDir;
}

function chromeExtensionId(options: ReleaseOptions): string {
  const variable = `${options.plugin.toUpperCase().replaceAll("-", "_")}_CHROME_EXTENSION_ID`;
  const value = process.env[variable];

  if (!value) {
    throw new Error(`Missing ${variable} for Chrome submission.`);
  }

  return value;
}

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} for store submission.`);
  }

  return value;
}

function submitChrome(options: ReleaseOptions, releaseDir: string, version: string): void {
  const zip = path.join(releaseDir, `${options.plugin}-${version}-chrome-mv3.zip`);
  const extensionId = chromeExtensionId(options);
  requireEnv("CHROME_CLIENT_ID");
  requireEnv("CHROME_CLIENT_SECRET");
  requireEnv("CHROME_REFRESH_TOKEN");
  requireEnv("CHROME_PUBLISHER_ID");

  run("pnpm", [
    "exec",
    "chrome-webstore-upload",
    "upload",
    "--source",
    zip,
    "--extension-id",
    extensionId,
  ]);
  run("pnpm", ["exec", "chrome-webstore-upload", "publish", "--extension-id", extensionId]);
}

function submitFirefox(options: ReleaseOptions, releaseDir: string, version: string): void {
  const issuer = requireEnv("AMO_JWT_ISSUER");
  const secret = requireEnv("AMO_JWT_SECRET");
  const artifactsDir = path.join(releaseDir, "signed");
  mkdirSync(artifactsDir, { recursive: true });
  const sourceZip = path.join(releaseDir, `${options.plugin}-${version}-firefox-source.zip`);

  run("pnpm", [
    "exec",
    "web-ext",
    "sign",
    "--source-dir",
    firefoxSource(options.plugin),
    "--artifacts-dir",
    artifactsDir,
    "--channel",
    "listed",
    "--api-key",
    issuer,
    "--api-secret",
    secret,
    "--upload-source-code",
    sourceZip,
    "--timeout",
    "300000",
    "--approval-timeout",
    "0",
    "--no-input",
  ]);

  const signedXpi = readdirSync(artifactsDir).find((file) => file.endsWith(".xpi"));

  if (!signedXpi) {
    throw new Error("AMO signing completed without producing an xpi.");
  }

  copyFileSync(
    path.join(artifactsDir, signedXpi),
    path.join(releaseDir, `${options.plugin}-${version}-firefox-mv3-signed.xpi`),
  );
  rmSync(path.join(releaseDir, `${options.plugin}-${version}-firefox-mv3.zip`), { force: true });
  writeChecksums(releaseDir);
}

function submitStores(options: ReleaseOptions, releaseDir: string, version: string): void {
  const skipChrome = process.argv.includes("--skip-chrome");
  const skipFirefox = process.argv.includes("--skip-firefox");

  if (!skipChrome) {
    submitChrome(options, releaseDir, version);
  }

  if (!skipFirefox) {
    submitFirefox(options, releaseDir, version);
  }
}

function createAndMaybePushTag(options: ReleaseOptions, tag: string): void {
  if (output("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`]).length > 0) {
    throw new Error(`Tag already exists: ${tag}`);
  }

  run("git", ["tag", "-a", tag, "-m", `Release ${tag}`]);

  if (!options.push) {
    return;
  }

  const branch = output("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

  if (branch === "HEAD") {
    throw new Error("Cannot push a release tag from detached HEAD.");
  }

  const remote = output("git", ["remote"]);

  if (!remote) {
    throw new Error("No git remote configured.");
  }

  run("git", ["push", "origin", branch, tag]);
}

async function main(): Promise<void> {
  const options = parseReleaseOptions();
  const { version } = readPlugin(options);
  const tag = `${options.plugin}@${version}`;

  assertCleanTree();
  assertQuality(options);

  const releaseDir = packageArtifacts(options, version);

  if (options.publish) {
    submitStores(options, releaseDir, version);
  }

  if (options.createTag) {
    run("pnpm", ["validate:release-tag", tag]);
    createAndMaybePushTag(options, tag);
  }

  console.log(`\n✓ Release candidate ready: ${path.relative(root, releaseDir)}`);

  if (options.publish) {
    console.log("✓ Store submission complete.");
  } else {
    console.log("Next: pnpm release <plugin> --publish, or create/push the release tag.");
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
