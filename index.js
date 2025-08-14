const fs = require('fs');
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
  } catch {
    // Git command failed, continue to fallbacks
  }

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
  if (!branch) return branch;
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
  
  // Check mappings first
  for (const pattern in config.mappings || {}) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    if (regex.test(branch)) return config.mappings[pattern];
  }
  
  // Check for branch-specific env file
  const envFile = `.env.${branch}`;
  const fullPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) return envFile;
  
  // Check for template file
  const exampleFile = `${envFile}.example`;
  if (fs.existsSync(path.join(process.cwd(), exampleFile))) {
    if (config.warnOnTemplate !== false) console.warn(`git-branch-env: Using template ${exampleFile}.`);
    return exampleFile;
  }
  
  return '.env';
}

function parseEnv(content) {
  const env = {};
  const lines = content.split(/\r?\n/);
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) continue;
    
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    
    // Handle quoted values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith('\'') && value.endsWith('\''))) {
      env[key] = value.slice(1, -1);
    } else {
      env[key] = value;
    }
  }
  
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
  const encryptedBuffer = Buffer.from(encrypted, 'hex');
  
  // Verify HMAC on encrypted data first
  const expectedHmac = crypto.createHmac('sha256', passphrase).update(encryptedBuffer).digest('hex');
  if (hmac !== expectedHmac) throw new Error('git-branch-env: HMAC verification failed');
  
  // Decrypt the data
  const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(passphrase).digest(), iv);
  const data = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  
  return data.toString();
}

function validateEnv(env, requiredKeys) {
  if (!requiredKeys) return;
  for (const key of requiredKeys) {
    if (!(key in env) || !env[key]) throw new Error(`git-branch-env: Missing/empty key ${key}`);
  }
}

function loadEnvFile(envFile, options = {}) {
  const filePath = path.join(process.cwd(), envFile);
  if (!fs.existsSync(filePath)) return {};
  let content = fs.readFileSync(filePath, 'utf8');
  if (options.encrypted) content = decryptEnv(content, options.passphrase);
  let parsed = parseEnv(content);
  parsed = expandEnv(parsed);
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
    validateEnv(merged, config.requiredKeys);
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
  },
  getCurrentBranch,
  matchBranchToEnv,
  loadConfig,
  sanitizeBranch,
  parseEnv,
  expandEnv,
  decryptEnv
};
