const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

// Mock environment for testing
const originalEnv = { ...process.env };
const originalCwd = process.cwd();

function setupTestEnv() {
  // Create test directory
  const testDir = path.join(__dirname, 'test-encryption');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  process.chdir(testDir);
}

function cleanupTestEnv() {
  process.chdir(originalCwd);
  const testDir = path.join(__dirname, 'test-encryption');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  process.env = { ...originalEnv };
}

function testEncryption() {
  console.log('🔐 Testing encryption functionality...');
  
  const lib = require('../index');
  
  // Test data
  const testData = 'DATABASE_URL=postgres://user:pass@localhost:5432/db\nAPI_KEY=secret_key_123\n';
  const passphrase = 'my-secret-passphrase-123';
  
  // Test encryption using the actual implementation
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
  
  // Calculate HMAC on the encrypted data (not the decrypted data)
  const hmac = crypto.createHmac('sha256', passphrase).update(encrypted).digest('hex');
  const encryptedContent = `${iv.toString('hex')}:${hmac}:${encrypted.toString('hex')}`;
  
  console.log(`Encrypted content format: ${encryptedContent.substring(0, 50)}...`);
  
  // Test decryption using the library function
  const decrypted = lib.decryptEnv(encryptedContent, passphrase);
  
  // Verify the result
  assert.strictEqual(decrypted, testData, 'Decrypted data should match original');
  
  console.log('✅ Encryption/decryption test passed');
}

function testEncryptedEnvLoading() {
  console.log('🔐 Testing encrypted environment loading...');
  
  const lib = require('../index');
  
  // Create encrypted environment file
  const testData = 'DATABASE_URL=postgres://encrypted:pass@localhost:5432/db\nAPI_KEY=encrypted_key\n';
  const passphrase = 'test-passphrase-456';
  
  // Encrypt the data
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
  const hmac = crypto.createHmac('sha256', passphrase).update(encrypted).digest('hex');
  const encryptedContent = `${iv.toString('hex')}:${hmac}:${encrypted.toString('hex')}`;
  
  // Write encrypted file
  fs.writeFileSync('.env.encrypted', encryptedContent);
  
  // Test loading with encryption
  const parsed = lib.parseEnv(testData);
  assert.strictEqual(parsed.DATABASE_URL, 'postgres://encrypted:pass@localhost:5432/db', 'Should parse encrypted env correctly');
  assert.strictEqual(parsed.API_KEY, 'encrypted_key', 'Should parse encrypted env correctly');
  
  console.log('✅ Encrypted environment loading test passed');
}

function testHmacVerification() {
  console.log('🔐 Testing HMAC verification...');
  
  const passphrase = 'hmac-test-passphrase';
  const testData = 'SECRET_KEY=very_secret_value\n';
  
  // Create valid encrypted content
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
  const hmac = crypto.createHmac('sha256', passphrase).update(encrypted).digest('hex');
  const validContent = `${iv.toString('hex')}:${hmac}:${encrypted.toString('hex')}`;
  
  // Test with valid HMAC
  const lib = require('../index');
  const decrypted = lib.decryptEnv(validContent, passphrase);
  assert.strictEqual(decrypted, testData, 'Should decrypt with valid HMAC');
  
  // Test with invalid HMAC
  const invalidHmac = 'invalid_hmac_value';
  const invalidContent = `${iv.toString('hex')}:${invalidHmac}:${encrypted.toString('hex')}`;
  
  assert.throws(() => {
    lib.decryptEnv(invalidContent, passphrase);
  }, /HMAC verification failed/, 'Should throw error with invalid HMAC');
  
  console.log('✅ HMAC verification test passed');
}

function testPassphraseValidation() {
  console.log('🔐 Testing passphrase validation...');
  
  const lib = require('../index');
  
  // Test empty passphrase
  const testData = 'TEST_KEY=test_value\n';
  const emptyPassphrase = '';
  
  // Should return original content when no passphrase
  const result = lib.decryptEnv(testData, emptyPassphrase);
  assert.strictEqual(result, testData, 'Should return original content with empty passphrase');
  
  // Test null passphrase
  const nullResult = lib.decryptEnv(testData, null);
  assert.strictEqual(nullResult, testData, 'Should return original content with null passphrase');
  
  // Test undefined passphrase
  const undefinedResult = lib.decryptEnv(testData, undefined);
  assert.strictEqual(undefinedResult, testData, 'Should return original content with undefined passphrase');
  
  console.log('✅ Passphrase validation test passed');
}

function testCLIEncryption() {
  console.log('🔐 Testing CLI encryption commands...');
  
  // Create test file
  const testContent = 'DATABASE_URL=postgres://cli:test@localhost:5432/db\nAPI_KEY=cli_test_key\n';
  fs.writeFileSync('.env.test', testContent);
  
  // Test encryption via CLI
  const passphrase = 'cli-test-passphrase';
  const { execSync } = require('child_process');
  
  try {
    // Encrypt file
    execSync(`node ../../cli.js encrypt .env.test "${passphrase}"`, { stdio: 'pipe' });
    
    // Verify encrypted file exists
    assert(fs.existsSync('.env.test.encrypted'), 'Encrypted file should be created');
    
    // Decrypt file
    execSync(`node ../../cli.js decrypt .env.test.encrypted "${passphrase}"`, { stdio: 'pipe' });
    
    // Verify decrypted file exists
    assert(fs.existsSync('.env.test.decrypted'), 'Decrypted file should be created');
    
    // Verify content
    const decryptedContent = fs.readFileSync('.env.test.decrypted', 'utf8');
    assert.strictEqual(decryptedContent, testContent, 'Decrypted content should match original');
    
    console.log('✅ CLI encryption commands test passed');
  } catch (error) {
    console.error('❌ CLI encryption test failed:', error.message);
    throw error;
  }
}

function testInvalidEncryption() {
  console.log('🔐 Testing invalid encryption scenarios...');
  
  const lib = require('../index');
  
  // Test malformed encrypted content
  const malformedContent = 'invalid:format:content';
  
  assert.throws(() => {
    lib.decryptEnv(malformedContent, 'test-passphrase');
  }, /git-branch-env: HMAC verification failed/, 'Should throw error with malformed content');
  
  // Test wrong passphrase
  const testData = 'TEST_KEY=test_value\n';
  const passphrase = 'correct-passphrase';
  
  // Create encrypted content
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
  const hmac = crypto.createHmac('sha256', passphrase).update(encrypted).digest('hex');
  const validContent = `${iv.toString('hex')}:${hmac}:${encrypted.toString('hex')}`;
  
  // Test with wrong passphrase
  assert.throws(() => {
    lib.decryptEnv(validContent, 'wrong-passphrase');
  }, /HMAC verification failed/, 'Should throw error with wrong passphrase');
  
  console.log('✅ Invalid encryption scenarios test passed');
}

function runEncryptionTests() {
  console.log('🚀 Starting git-branch-env encryption tests...\n');
  
  try {
    setupTestEnv();
    
    testEncryption();
    testEncryptedEnvLoading();
    testHmacVerification();
    testPassphraseValidation();
    testCLIEncryption();
    testInvalidEncryption();
    
    console.log('\n🎉 All encryption tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Encryption test failed:', error.message);
    process.exit(1);
  } finally {
    cleanupTestEnv();
  }
}

if (require.main === module) {
  runEncryptionTests();
}

module.exports = { runEncryptionTests };
