const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');

// Mock environment for testing
const originalEnv = { ...process.env };
const originalCwd = process.cwd();

function setupTestEnv() {
  // Create test directory
  const testDir = path.join(__dirname, 'test-project');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
  
  // Initialize git repository
  execSync('git init', { stdio: 'ignore' });
  execSync('git config user.name "Test User"', { stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { stdio: 'ignore' });
  
  // Create a dummy file and commit to establish HEAD
  fs.writeFileSync('dummy.txt', 'test');
  execSync('git add dummy.txt', { stdio: 'ignore' });
  execSync('git commit -m "Initial commit"', { stdio: 'ignore' });
  
  // Create test environment files
  fs.writeFileSync('.env.base', 'BASE_URL=https://api.example.com\nAPI_VERSION=v1\nDATABASE_URL=postgres://base:5432/myapp\n');
  fs.writeFileSync('.env.main', 'DATABASE_URL=postgres://prod:5432/myapp\nAPI_KEY=prod_key\n');
  fs.writeFileSync('.env.dev', 'DATABASE_URL=postgres://dev:5432/myapp\nAPI_KEY=dev_key\nDEBUG=true\n');
  fs.writeFileSync('.env.feature-auth.example', 'DATABASE_URL=postgres://feature:5432/myapp\nAPI_KEY=feature_key\n');
  
  // Create config
  fs.writeFileSync('branch-env.config.json', JSON.stringify({
    mappings: { 'feature/*': '.env.dev' },
    requiredKeys: ['DATABASE_URL'],
    baseEnv: '.env.base'
  }));
}

function cleanupTestEnv() {
  process.chdir(originalCwd);
  const testDir = path.join(__dirname, 'test-project');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  process.env = { ...originalEnv };
}

function testBranchDetection() {
  console.log('🧪 Testing branch detection...');
  
  const lib = require('../index');
  const branch = lib.getCurrentBranch();
  // Git default branch might be 'master' or 'main' depending on git version
  assert(branch === 'main' || branch === 'master', `Should detect main/master branch, got: ${branch}`);
  console.log('✅ Branch detection passed');
}

function testEnvLoading() {
  console.log('🧪 Testing environment loading...');
  
  const lib = require('../index');
  const branch = lib.getCurrentBranch();
  console.log(`Current branch: ${branch}`);
  
  // Create the appropriate env file for the current branch
  const envFile = `.env.${branch}`;
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, 'DATABASE_URL=postgres://prod:5432/myapp\nAPI_KEY=prod_key\n');
  }
  
  console.log(`Env file exists: ${fs.existsSync(envFile)}`);
  console.log(`Env file content: ${fs.readFileSync(envFile, 'utf8')}`);
  
  lib.load({ verbose: true });
  
  assert.strictEqual(process.env.BASE_URL, 'https://api.example.com', 'Should load base env');
  assert.strictEqual(process.env.DATABASE_URL, 'postgres://prod:5432/myapp', 'Should load branch env');
  assert.strictEqual(process.env.API_KEY, 'prod_key', 'Should load branch env');
  // Git default branch might be 'master' or 'main' depending on git version
  assert(process.env.GIT_BRANCH === 'main' || process.env.GIT_BRANCH === 'master', `Should set GIT_BRANCH, got: ${process.env.GIT_BRANCH}`);
  
  console.log('✅ Environment loading passed');
}

function testBranchMapping() {
  console.log('🧪 Testing branch mapping...');
  
  // Switch to feature branch
  execSync('git checkout -b feature/auth', { stdio: 'ignore' });
  
  const lib = require('../index');
  const envFile = lib.matchBranchToEnv('feature/auth', lib.loadConfig());
  assert.strictEqual(envFile, '.env.dev', 'Should map feature branch to dev env');
  
  console.log('✅ Branch mapping passed');
}

function testTemplateFallback() {
  console.log('🧪 Testing template fallback...');
  
  // Switch to feature branch without env file
  execSync('git checkout -b feature/new-feature', { stdio: 'ignore' });
  
  // Create template file for the new branch
  fs.writeFileSync('.env.feature-new-feature.example', 'DATABASE_URL=postgres://template:5432/myapp\nAPI_KEY=template_key\n');
  
  // Create a config without mappings to test template fallback
  const testConfig = {
    mappings: {},
    requiredKeys: ['DATABASE_URL'],
    baseEnv: '.env.base',
    branchSanitizer: {
      replaceSpecialChars: true,
      maxLength: 30
    }
  };
  
  const lib = require('../index');
  const branch = 'feature/new-feature';
  const sanitized = lib.sanitizeBranch(branch, testConfig);
  console.log(`Branch: ${branch}, Sanitized: ${sanitized}`);
  console.log(`Template file exists: ${fs.existsSync('.env.feature-new-feature.example')}`);
  
  const envFile = lib.matchBranchToEnv(branch, testConfig);
  console.log(`Matched env file: ${envFile}`);
  assert.strictEqual(envFile, '.env.feature-new-feature.example', 'Should use template file');
  
  console.log('✅ Template fallback passed');
}

function testValidation() {
  console.log('🧪 Testing validation...');
  
  const lib = require('../index');
  
  // Should pass with required keys
  assert.doesNotThrow(() => {
    lib.validate({ verbose: false });
  }, 'Should validate successfully with required keys');
  
  console.log('✅ Validation passed');
}

function testEnvExpansion() {
  console.log('🧪 Testing environment expansion...');
  
  // Create an env file with variable expansion
  fs.writeFileSync('.env.expand', 'API_URL=${BASE_URL}/${API_VERSION}/test\n');
  
  // Load base environment first
  const lib = require('../index');
  lib.load({ verbose: false });
  
  // Now load the expansion file
  const content = fs.readFileSync('.env.expand', 'utf8');
  const parsed = lib.parseEnv(content);
  const expanded = lib.expandEnv(parsed);
  
  assert.strictEqual(expanded.API_URL, 'https://api.example.com/v1/test', 'Should expand variables');
  
  console.log('✅ Environment expansion passed');
}

function runTests() {
  console.log('🚀 Starting git-branch-env tests...\n');
  
  try {
    setupTestEnv();
    
    testBranchDetection();
    testEnvLoading();
    testBranchMapping();
    testTemplateFallback();
    testValidation();
    testEnvExpansion();
    
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    cleanupTestEnv();
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
