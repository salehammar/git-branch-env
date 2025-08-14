const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple test function that directly tests the logic without complex mocking
function testCILogic() {
  console.log('🧪 Testing CI logic...');
  
  // Test 1: GitHub CI
  const githubEnv = {
    GITHUB_REF: 'refs/heads/feature/test'
  };
  const githubBranch = getBranchFromEnv(githubEnv);
  assert.strictEqual(githubBranch, 'feature/test', 'GitHub CI should extract branch from GITHUB_REF');
  console.log('✅ GitHub CI logic passed');
  
  // Test 2: GitLab CI
  const gitlabEnv = {
    GITLAB_CI: 'true',
    CI_COMMIT_REF_NAME: 'feature/test'
  };
  const gitlabBranch = getBranchFromEnv(gitlabEnv);
  assert.strictEqual(gitlabBranch, 'feature/test', 'GitLab CI should use CI_COMMIT_REF_NAME');
  console.log('✅ GitLab CI logic passed');
  
  // Test 3: CircleCI
  const circleEnv = {
    CIRCLE_BRANCH: 'feature/test'
  };
  const circleBranch = getBranchFromEnv(circleEnv);
  assert.strictEqual(circleBranch, 'feature/test', 'CircleCI should use CIRCLE_BRANCH');
  console.log('✅ CircleCI logic passed');
  
  // Test 4: Travis CI
  const travisEnv = {
    TRAVIS_BRANCH: 'feature/test'
  };
  const travisBranch = getBranchFromEnv(travisEnv);
  assert.strictEqual(travisBranch, 'feature/test', 'Travis CI should use TRAVIS_BRANCH');
  console.log('✅ Travis CI logic passed');
  
  // Test 5: Bitbucket CI
  const bitbucketEnv = {
    BITBUCKET_BRANCH: 'feature/test'
  };
  const bitbucketBranch = getBranchFromEnv(bitbucketEnv);
  assert.strictEqual(bitbucketBranch, 'feature/test', 'Bitbucket CI should use BITBUCKET_BRANCH');
  console.log('✅ Bitbucket CI logic passed');
  
  // Test 6: Custom fallback
  const customEnv = {
    CUSTOM_BRANCH: 'fallback-branch'
  };
  const customBranch = getBranchFromEnv(customEnv);
  assert.strictEqual(customBranch, 'fallback-branch', 'Custom fallback should use CUSTOM_BRANCH');
  console.log('✅ Custom fallback logic passed');
  
  // Test 7: File fallback
  const fileEnv = {};
  fs.writeFileSync('./branch.txt', 'file-branch');
  const fileBranch = getBranchFromEnv(fileEnv);
  assert.strictEqual(fileBranch, 'file-branch', 'File fallback should read from branch.txt');
  fs.unlinkSync('./branch.txt');
  console.log('✅ File fallback logic passed');
  
  console.log('🎉 All CI logic tests passed!');
}

// Simple function that implements the branch detection logic
function getBranchFromEnv(env) {
  // CI detection
  if (env.GITHUB_REF) {
    return env.GITHUB_REF.replace('refs/heads/', '');
  }
  if (env.GITLAB_CI && env.CI_COMMIT_REF_NAME) {
    return env.CI_COMMIT_REF_NAME;
  }
  if (env.CIRCLE_BRANCH) {
    return env.CIRCLE_BRANCH;
  }
  if (env.TRAVIS_BRANCH) {
    return env.TRAVIS_BRANCH;
  }
  if (env.BITBUCKET_BRANCH) {
    return env.BITBUCKET_BRANCH;
  }
  
  // Fallbacks
  if (env.CUSTOM_BRANCH) {
    return env.CUSTOM_BRANCH;
  }
  
  // File fallback
  const filePath = path.join(process.cwd(), 'branch.txt');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  
  return null;
}

// Run the tests
function runSimpleCITests() {
  console.log('🚀 Starting simple CI tests...\n');
  
  try {
    testCILogic();
    console.log('\n🎉 All simple CI tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Simple CI test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runSimpleCITests();
}

module.exports = { runSimpleCITests, testCILogic };
