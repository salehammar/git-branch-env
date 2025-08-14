const fs = require('fs');
const assert = require('assert');

// Mock CI environment variables
const originalEnv = { ...process.env };

function setupCIEnv(ciType) {
  // Reset environment
  process.env = { ...originalEnv };
  
  switch (ciType) {
  case 'github':
    process.env.GITHUB_REF = 'refs/heads/feature/test';
    break;
  case 'gitlab':
    process.env.GITLAB_CI = 'true';
    process.env.CI_COMMIT_REF_NAME = 'feature/test';
    break;
  case 'circle':
    process.env.CIRCLE_BRANCH = 'feature/test';
    break;
  case 'travis':
    process.env.TRAVIS_BRANCH = 'feature/test';
    break;
  case 'bitbucket':
    process.env.BITBUCKET_BRANCH = 'feature/test';
    break;
  default:
    process.env.GIT_BRANCH = 'feature/test';
  }
}

function testCIIntegration() {
  console.log('🏭 Testing CI integration...');
  
  // Mock execSync to fail for git command so CI env vars are used
  const originalExecSync = require('child_process').execSync;
  require('child_process').execSync = () => { throw new Error('git command failed'); };
  
  const ciTypes = ['github', 'gitlab', 'circle', 'travis', 'bitbucket', 'custom'];
  
  for (const ciType of ciTypes) {
    // Reset environment completely
    process.env = { ...originalEnv };
    setupCIEnv(ciType);
    
    // Clear require cache to reload the module with new env
    delete require.cache[require.resolve('../index')];
    const lib = require('../index');
    
    const branch = lib.getCurrentBranch();
    assert.strictEqual(branch, 'feature/test', `Should detect branch in ${ciType} CI`);
    console.log(`✅ ${ciType} CI integration passed`);
  }
  
  // Restore execSync
  require('child_process').execSync = originalExecSync;
}

function testFallbackDetection() {
  console.log('🔄 Testing fallback detection...');
  
  // Test environment variable fallback
  process.env = { ...originalEnv };
  process.env.CUSTOM_BRANCH = 'fallback-branch';
  
  // Mock execSync to fail for git command
  const originalExecSync = require('child_process').execSync;
  require('child_process').execSync = () => { throw new Error('git command failed'); };
  
  // Clear require cache to reload the module with new env
  delete require.cache[require.resolve('../index')];
  const lib = require('../index');
  const branch = lib.getCurrentBranch();
  assert.strictEqual(branch, 'fallback-branch', 'Should use env var fallback');
  
  // Test file fallback
  process.env = { ...originalEnv };
  fs.writeFileSync('./branch.txt', 'file-branch');
  
  // Clear require cache again
  delete require.cache[require.resolve('../index')];
  const lib2 = require('../index');
  const branch2 = lib2.getCurrentBranch();
  assert.strictEqual(branch2, 'file-branch', 'Should use file fallback');
  
  // Cleanup
  fs.unlinkSync('./branch.txt');
  
  // Restore execSync
  require('child_process').execSync = originalExecSync;
  
  console.log('✅ Fallback detection passed');
}

function testSanitization() {
  console.log('🧹 Testing branch sanitization...');
  
  const lib = require('../index');
  const config = {
    branchSanitizer: {
      replaceSpecialChars: true,
      maxLength: 10
    }
  };
  
  const sanitized = lib.sanitizeBranch('feature/auth@v2', config);
  assert.strictEqual(sanitized, 'feature-au', 'Should sanitize branch name');
  
  console.log('✅ Branch sanitization passed');
}

function runCITests() {
  console.log('🚀 Starting CI tests...\n');
  
  try {
    testCIIntegration();
    testFallbackDetection();
    testSanitization();
    
    console.log('\n🎉 All CI tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CI test failed:', error.message);
    process.exit(1);
  } finally {
    process.env = { ...originalEnv };
  }
}

if (require.main === module) {
  runCITests();
}

module.exports = { runCITests };
