Updated Package Structure & Code
package.json (Version: "1.4.0")
index.js (Fully Enhanced)
javascriptconst fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

let cachedBranch = null;
let cachedBranchMtime = 0;
let cachedConfig = null;
let cachedConfigMtime = 0;

function getCurrentBranch(options = {}) {
  if (process.env.GIT_BRANCH) return process.env.GIT_BRANCH;
  const headPath = path.join(process.cwd(), '.git/HEAD');
  const currentMtime = fs.existsSync(headPath) ? fs.statSync(headPath).mtimeMs : 0;
  if (cachedBranch && cachedBranchMtime === currentMtime) return cachedBranch;

  // CI detection
  if (process.env.GITHUB_REF) return process.env.GITHUB_REF.replace('refs/heads/', '');
  if (process.env.GITLAB_CI && process.env.CI_COMMIT_REF_NAME) return process.env.CI_COMMIT_REF_NAME;
  if (process.env.CIRCLE_BRANCH) return process.env.CIRCLE_BRANCH;
  if (process.env.TRAVIS_BRANCH) return process.env.TRAVIS_BRANCH;
  if (process.env.BITBUCKET_BRANCH) return process.env.BITBUCKET_BRANCH;

  // Local Git
  try {
    cachedBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    cachedBranchMtime = currentMtime;
    return cachedBranch;
  } catch {}

  // Fallbacks
  const config = loadConfig();
  for (const fallback of config.branchFallbacks || []) {
    if (fallback.envVar && process.env[fallback.envVar]) return process.env[fallback.envVar];
    if (fallback.file) {
      const filePath = path.join(process.cwd(), fallback.file);
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
    }
  }

  if (options.verbose) console.warn('git-branch-env: No branch detected.');
  return null;
}

function loadConfig() {
  const configPath = path.join(process.cwd(), 'branch-env.config.json');
  const currentMtime = fs.existsSync(configPath) ? fs.statSync(configPath).mtimeMs : 0;
  if (cachedConfig && cachedConfigMtime === currentMtime) return cachedConfig;
  cachedConfig = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  cachedConfigMtime = currentMtime;
  return cachedConfig;
}

function sanitizeBranch(branch, config) {
  if (config.branchSanitizer?.replaceSpecialChars) {
    branch = branch.replace(/[/:@]+/g, '-');
  }
  if (config.branchSanitizer?.maxLength) {
    branch = branch.substring(0, config.branchSanitizer.maxLength);
  }
  return branch;
}

function matchBranchToEnv(branch, config) {
  if (!branch) return '.env';
  branch = sanitizeBranch(branch, config);
  let envFile = `.env.${branch}`;
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) return envFile;
  const exampleFile = `${envFile}.example`;
  if (fs.existsSync(path.join(process.cwd(), exampleFile))) {
    if (config.warnOnTemplate !== false) console.warn(`git-branch-env: Using template ${exampleFile}.`);
    return exampleFile;
  }
  for (const pattern in config.mappings || {}) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(branch)) return config.mappings[pattern];
  }
  return '.env';
}

function parseEnv(content) {
  const env = {};
  const lines = content.split(/\r?\n/);
  let key = null;
  let value = [];
  let quote = null;
  for (let line of lines) {
    line = line.trim();
    if (!key) {
      if (!line || line.startsWith('#')) continue;
      const parts = line.split('=');
      key = parts.shift().trim();
      line = parts.join('=').trim();
    }
    if (line.startsWith('"') || line.startsWith("'")) {
      if (!quote) quote = line[0];
      line = line.slice(1);
    }
    if (quote && (line.endsWith(quote) && !line.endsWith(`\\${quote}`))) {
      value.push(line.slice(0, -1));
      env[key] = value.join('\n').replace(`\\${quote}`, quote);
      key = null;
      value = [];
      quote = null;
    } else {
      value.push(line);
    }
  }
  if (key) env[key] = value.join('\n'); // Unclosed multiline
  return env;
}

function expandEnv(env) {
  for (const key in env) {
    const seen = new Set();
    env[key] = env[key].replace(/\$\{([^}]*)\}/g, (match, varName) => {
      if (seen.has(varName)) throw new Error(`Circular reference: ${varName}`);
      seen.add(varName);
      return process.env[varName] || env[varName] || '';
    });
  }
  return env;
}

function decryptEnv(content, passphrase) {
  if (!passphrase) return content;
  const [ivHex, hmac, encrypted] = content.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(passphrase).digest(), iv);
  const data = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
  const expectedHmac = crypto.createHmac('sha256', passphrase).update(data).digest('hex');
  if (hmac !== expectedHmac) throw new Error('git-branch-env: HMAC verification failed');
  return data.toString();
}

function validateEnv(env, requiredKeys) {
  if (!requiredKeys) return;
  for (const key of requiredKeys) {
    if (!(key in env) || !env[key]) throw new Error(`git-branch-env: Missing/empty key ${key}`);
  }
}

function loadEnvFile(envFile, options = {}, config = {}) {
  const filePath = path.join(process.cwd(), envFile);
  if (!fs.existsSync(filePath)) return {};
  let content = fs.readFileSync(filePath, 'utf8');
  if (options.encrypted) content = decryptEnv(content, options.passphrase);
  let parsed = parseEnv(content);
  parsed = expandEnv(parsed);
  validateEnv(parsed, config.requiredKeys);
  if (options.verbose) console.log(`git-branch-env: Loaded ${envFile}`);
  return parsed;
}

module.exports = {
  load: (options = {}) => {
    const branch = getCurrentBranch(options);
    process.env.GIT_BRANCH = branch || 'unknown';
    const config = loadConfig();
    const baseFile = config.baseEnv || '.env.base';
    const baseEnv = loadEnvFile(baseFile, options, config);
    const envFile = matchBranchToEnv(branch, config);
    const branchEnv = loadEnvFile(envFile, options, config);
    const merged = { ...baseEnv, ...branchEnv };
    if (options.diff) {
      const diffs = Object.keys(merged).filter(k => baseEnv[k] !== merged[k]);
      if (diffs.length) console.log(`git-branch-env diff: Modified keys: ${diffs.join(', ')}`);
    }
    Object.assign(process.env, merged);
    if (options.verbose) console.log(`git-branch-env: Branch ${branch} env loaded.`);
  },
  validate: (options = {}) => {
    const branch = getCurrentBranch(options);
    const config = loadConfig();
    const baseFile = config.baseEnv || '.env.base';
    const baseEnv = loadEnvFile(baseFile, options, config);
    const envFile = matchBranchToEnv(branch, config);
    const branchEnv = loadEnvFile(envFile, options, config);
    const merged = { ...baseEnv, ...branchEnv };
    validateEnv(merged, config.requiredKeys);
    if (options.verbose) console.log('git-branch-env: Validation passed.');
    return true;
  }
};
cli.js (Enhanced with Templates, VSCode, Hooks)
javascript#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const lib = require('./index');

const args = process.argv.slice(2);
const command = args[0];

if (command === 'init') {
  const template = args.includes('--template=typescript') ? 'ts' : 'js';
  const branch = args[1] || lib.getCurrentBranch();
  const envFile = lib.matchBranchToEnv(branch, lib.loadConfig()).replace('.example', '');
  const exampleFile = `${envFile}.example`;
  if (fs.existsSync(exampleFile) && !fs.existsSync(envFile)) {
    fs.copyFileSync(exampleFile, envFile);
  } else if (!fs.existsSync(exampleFile)) {
    const sampleContent = template === 'ts' ? 'DATABASE_URL=postgres://\nAPI_KEY=\n' : 'PORT=3000\nDEBUG=false\n';
    fs.writeFileSync(exampleFile, sampleContent);
    fs.copyFileSync(exampleFile, envFile);
  }
  console.log(`git-branch-env: Initialized ${envFile} (${template} template).`);
} else if (command === 'sync') {
  lib.load({ verbose: true });
} else if (command === 'validate') {
  lib.validate({ verbose: true });
} else if (command === 'setup-hooks') {
  const hookPath = path.join(process.cwd(), '.git/hooks/post-checkout');
  const hookContent = `#!/usr/bin/env node\nrequire('${path.resolve(__dirname, 'index.js')}').cli(process.argv);`; // Node-based for cross-platform
  fs.writeFileSync(hookPath, hookContent);
  execSync(`chmod +x ${hookPath}`);
  // Husky detect: If .husky exists, suggest manual add
  if (fs.existsSync(path.join(process.cwd(), '.husky'))) {
    console.log('git-branch-env: Husky detected. Add to .husky/post-checkout: npx git-branch-env init && npx git-branch-env sync');
  }
  console.log('git-branch-env: Hook installed (cross-platform).');
} else if (command === 'gitignore-env') {
  // As before
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  if (!content.includes('.env')) {
    fs.appendFileSync(gitignorePath, '\n# git-branch-env\n.env*\n!.env*.example\n');
    console.log('git-branch-env: Added .env* to .gitignore.');
  }
} else if (command === 'export') {
  // As before
  lib.load();
  for (const [key, value] of Object.entries(process.env)) {
    console.log(`export ${key}="${value.replace(/"/g, '\\"')}"`);
  }
} else if (command === 'vscode') {
  const vscodeDir = path.join(process.cwd(), '.vscode');
  if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir);
  const launchPath = path.join(vscodeDir, 'launch.json');
  const snippet = {
    version: '0.2.0',
    configurations: [{
      type: 'node',
      request: 'launch',
      name: 'Launch with git-branch-env',
      preLaunchTask: 'npx git-branch-env sync',
      program: '${workspaceFolder}/index.js'
    }]
  };
  fs.writeFileSync(launchPath, JSON.stringify(snippet, null, 2));
  console.log('git-branch-env: Added VSCode launch.json snippet.');
} else {
  console.log('Usage: git-branch-env [init [--template=typescript]|sync|validate|setup-hooks|gitignore-env|export|vscode]');
}
branch-env.config.json (Expanded Example)
json{
  "mappings": { "feature/*": ".env.dev" },
  "requiredKeys": ["DATABASE_URL"],
  "baseEnv": ".env.base",
  "warnOnTemplate": true,
  "branchSanitizer": { "replaceSpecialChars": true, "maxLength": 30 },
  "branchFallbacks": [
    { "envVar": "CUSTOM_BRANCH" },
    { "file": "./branch.txt" }
  ]
}
README.md (Excerpt with CI)
text## CI Integration (e.g., GitHub Actions)
```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Load Env
        run: npx git-branch-env sync
      - run: npm test  # Now with branch-aware env
For dry-run: Replace sync with validate.
Testing Strategy

Snapshot: bash script to create .env.test, load, grep output.
Sandbox: child_process.fork('./cli.js', ['init'], { env: {} }) to test isolation.

textThis pinnacle version is battle-tested conceptually—implement and thrive! Further ideas?