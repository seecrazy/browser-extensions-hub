import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const tag = process.argv[2];

if (!tag) {
  console.error("Usage: pnpm validate:release-tag <plugin-name>@<version>");
  process.exit(1);
}

const match = /^([a-z0-9-]+)@(\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?)$/.exec(tag);

if (!match) {
  console.error(`Invalid release tag: ${tag}`);
  console.error("Expected format: <plugin-name>@<semver>");
  process.exit(1);
}

const [, pluginName, version] = match;
const extensionDir = path.resolve(process.cwd(), "extensions", pluginName);
const packagePath = path.join(extensionDir, "package.json");

if (!existsSync(packagePath)) {
  console.error(`Release tag points to a missing extension directory: ${extensionDir}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
  name?: string;
  version?: string;
};

if (packageJson.name !== `@hub/${pluginName}`) {
  console.error(
    `Package name mismatch. Expected "@hub/${pluginName}", got "${packageJson.name ?? "undefined"}".`,
  );
  process.exit(1);
}

if (packageJson.version !== version) {
  console.error(
    `Version mismatch for ${tag}: package.json contains ${packageJson.version ?? "undefined"}.`,
  );
  process.exit(1);
}

console.log(`✓ Release tag ${tag} matches ${packageJson.name}@${packageJson.version}`);
