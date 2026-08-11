/* eslint-env node */
/**
 * Interactive version bump for a release. Shows the current version, asks for
 * the next one, writes it to package.json and app.json, and regenerates
 * src/appVersion.ts so the drawer shows what is actually deployed.
 *
 * It deliberately does not build or publish. Both Vercel projects
 * (assetdiary-app at the repo root, assetdiary-site in site/) have no Git
 * integration connected — pushing to GitHub deploys nothing. Shipping is a
 * manual `npx vercel deploy --prod` from the right directory, which this
 * script prints but never runs, so nothing ships without an explicit command.
 */
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON = path.join(PROJECT_ROOT, "package.json");
const APP_JSON = path.join(PROJECT_ROOT, "app.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");

const isValid = (version) => /^\d+\.\d+\.\d+$/.test(version);

/** Suggest the next patch version, e.g. 1.2.3 -> 1.2.4. */
const suggestNext = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version || "");
  if (!match) return "";
  const [, major, minor, patch] = match;
  return `${major}.${minor}.${Number(patch) + 1}`;
};

const ask = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
};

async function main() {
  const pkg = readJson(PACKAGE_JSON);
  const current = pkg.version;
  const suggestion = suggestNext(current);

  console.log(`\nCurrent version: ${current}`);
  let next = await ask(
    `Enter the next version${suggestion ? ` [${suggestion}]` : ""}: `
  );

  // Empty input accepts the suggested patch bump.
  if (!next && suggestion) {
    next = suggestion;
  }
  if (!isValid(next)) {
    console.error(`\n"${next}" is not a valid x.y.z version. Aborting.`);
    process.exit(1);
  }
  if (next === current) {
    console.error(`\nVersion ${next} matches the current one. Aborting.`);
    process.exit(1);
  }

  pkg.version = next;
  writeJson(PACKAGE_JSON, pkg);

  try {
    const app = readJson(APP_JSON);
    if (app.expo) {
      app.expo.version = next;
      writeJson(APP_JSON, app);
    }
  } catch (error) {
    console.warn("Could not update app.json version:", error.message);
  }

  // Regenerate now rather than leaving it to the Vercel build, so the bumped
  // version is committed alongside the manifests instead of drifting.
  execSync("node scripts/gen-version.js", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  console.log(`
Version bumped to ${next}. Nothing has been deployed yet.

  git add package.json app.json src/appVersion.ts
  git commit -m "Release ${next}"
  git push

Then ship it (no Git integration — pushing above does not deploy):

  - App (app.assetdiary.in):    npx vercel deploy --prod
  - Site (assetdiary.in):       cd site && npx vercel deploy --prod
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
