/* eslint-env node */
/**
 * Release script: bumps the version and ships to Vercel. It never touches git —
 * committing the bump is left to you.
 *
 * Neither Vercel project (assetdiary-app at the repo root, assetdiary-site in
 * site/) has a Git integration connected, so pushing to GitHub deploys nothing.
 * Shipping is a `vercel deploy --prod` from the right directory, which this
 * script runs for you once you confirm the version.
 *
 *   npm run deploy           bump, then deploy the app  (app.assetdiary.in)
 *   npm run deploy --app     same — the app is the default target
 *   npm run deploy --site    bump, then deploy the site (assetdiary.in)
 *   npm run deploy --both    deploy both
 *
 * The version prompt is the only prompt, and comes pre-filled with the next
 * patch bump: press Enter to take it, or edit it in place. Deploying starts as
 * soon as you accept the version.
 *
 * npm turns bare flags into npm_config_* env vars rather than passing them
 * through, so `--site` and `--both` are read from the env as well as argv.
 * (npm 10 drops `--app` entirely — it never reaches this script in any form.
 * That is harmless only because the app is the default.) Extra flags need the
 * `--` separator, e.g. `npm run deploy -- --dry-run`:
 *
 *   --version=x.y.z    use this version instead of asking
 *   --yes, -y          accept all defaults, never prompt
 *   --no-bump          skip the version bump, just deploy
 *   --no-deploy        bump only, ship nothing
 *   --dry-run          print the deploy commands without running them
 */
const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(PROJECT_ROOT, "site");
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

const argv = process.argv.slice(2);
const hasFlag = (...names) => names.some((name) => argv.includes(name));
const flagValue = (name) => {
  const hit = argv.find((arg) => arg.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1).trim() : "";
};

/**
 * `npm run deploy --app` never reaches process.argv — npm turns the flag into
 * npm_config_app instead. Check the env too so the short form works.
 */
const npmFlag = (name) => {
  const value = process.env[`npm_config_${name}`];
  return value === "true" || value === "";
};
const hasEitherFlag = (name) => hasFlag(`--${name}`) || npmFlag(name);

const assumeYes = hasFlag("--yes", "-y");
const shouldBump = !hasFlag("--no-bump");
const shouldDeploy = !hasFlag("--no-deploy");
const dryRun = hasFlag("--dry-run");
const targetFromFlags =
  ["both", "site", "app"].find((name) => hasEitherFlag(name)) || "";

const interactive = process.stdin.isTTY && !assumeYes;

/**
 * Ask a question with `prefill` already typed into the input, so the answer can
 * be accepted with Enter or edited in place instead of retyped.
 */
const ask = (question, prefill = "") => {
  if (!interactive) {
    console.log(`${question}${prefill}`);
    return Promise.resolve(prefill);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
    if (prefill) rl.write(prefill);
  });
};

const run = (command, cwd = PROJECT_ROOT) => {
  const where =
    cwd === PROJECT_ROOT ? "" : `  (in ${path.relative(PROJECT_ROOT, cwd)})`;
  console.log(`\n> ${command}${where}${dryRun ? "   [dry run, not executed]" : ""}`);
  if (dryRun) return;
  execSync(command, { cwd, stdio: "inherit" });
};

async function bumpVersion() {
  const pkg = readJson(PACKAGE_JSON);
  const current = pkg.version;

  if (!shouldBump) {
    console.log(`\nVersion: ${current} (unchanged, --no-bump)`);
    return { version: current, bumped: false };
  }

  const suggestion = flagValue("--version") || suggestNext(current);

  console.log(`\nCurrent version: ${current}`);
  const next = (await ask("Enter the next version: ", suggestion)) || suggestion;

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

  // Regenerate now rather than leaving it to the Vercel build, so the version
  // the drawer shows matches the manifests instead of drifting.
  execSync("node scripts/gen-version.js", {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  console.log(`\nVersion bumped to ${next}.`);
  return { version: next, bumped: true };
}

function deploy(version) {
  if (!shouldDeploy) {
    console.log(`
Nothing deployed (--no-deploy). To ship it yourself:

  - App (app.assetdiary.in):    npx vercel deploy --prod
  - Site (assetdiary.in):       cd site && npx vercel deploy --prod
`);
    return;
  }

  // No prompt here: accepting the version is the go-ahead. The app is the
  // default because npm never forwards `--app` (see the header).
  const target = targetFromFlags || "app";
  const what = target === "both" ? "app and site" : target;
  const tag = version ? ` (v${version})` : "";
  console.log(`\nDeploying ${what}${tag} to production...`);

  if (target === "app" || target === "both") {
    run("npx vercel deploy --prod", PROJECT_ROOT);
  }
  if (target === "site" || target === "both") {
    run("npx vercel deploy --prod", SITE_ROOT);
  }

  console.log("\nDone.");
}

async function main() {
  const { version } = await bumpVersion();
  deploy(version);
  // Deliberately no git step: committing the bump is left to you.
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
