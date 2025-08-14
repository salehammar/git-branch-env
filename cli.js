#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const lib = require('./index');

// Helper function to generate random passphrase
function generatePassphrase(length, charset) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Helper function to generate word-based passphrase
function generateWordPassphrase(length) {
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
    'island', 'jungle', 'knight', 'lemon', 'mountain', 'ocean', 'planet', 'queen',
    'river', 'sunset', 'tiger', 'umbrella', 'village', 'window', 'xylophone', 'yellow',
    'zebra', 'adventure', 'beautiful', 'creative', 'delicious', 'excellent', 'fantastic'
  ];
  
  const selectedWords = [];
  for (let i = 0; i < Math.ceil(length / 8); i++) {
    selectedWords.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return selectedWords.join('-');
}

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
    const sampleContent = template === 'ts' 
      ? '# TypeScript/Node.js Environment Variables\nDATABASE_URL=postgres://localhost:5432/myapp\nAPI_KEY=your_api_key_here\nNODE_ENV=development\n'
      : '# JavaScript/Node.js Environment Variables\nPORT=3000\nDEBUG=false\nDATABASE_URL=mysql://localhost:3306/myapp\nAPI_KEY=your_api_key_here\n';
    fs.writeFileSync(exampleFile, sampleContent);
    fs.copyFileSync(exampleFile, envFile);
  }
  console.log(`git-branch-env: Initialized ${envFile} (${template} template).`);
  
} else if (command === 'sync') {
  lib.load({ verbose: true });
  
} else if (command === 'validate') {
  try {
    lib.validate({ verbose: true });
  } catch (error) {
    console.error(`git-branch-env: Validation failed - ${error.message}`);
    process.exit(1);
  }
  
} else if (command === 'setup-hooks') {
  const hookPath = path.join(process.cwd(), '.git/hooks/post-checkout');
  const hookContent = `#!/usr/bin/env node
require('${path.resolve(__dirname, 'index.js')}').load({ verbose: true });
`;
  fs.writeFileSync(hookPath, hookContent);
  execSync(`chmod +x ${hookPath}`);
  
  // Husky detect: If .husky exists, suggest manual add
  if (fs.existsSync(path.join(process.cwd(), '.husky'))) {
    console.log('git-branch-env: Husky detected. Add to .husky/post-checkout: npx git-branch-env sync');
  }
  console.log('git-branch-env: Hook installed (cross-platform).');
  
} else if (command === 'gitignore-env') {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  if (!content.includes('.env')) {
    fs.appendFileSync(gitignorePath, '\n# git-branch-env\n.env*\n!.env*.example\n');
    console.log('git-branch-env: Added .env* to .gitignore.');
  } else {
    console.log('git-branch-env: .env* already in .gitignore.');
  }
  
} else if (command === 'export') {
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
  
} else if (command === 'encrypt') {
  const filePath = args[1];
  const passphrase = args[2];
  if (!filePath || !passphrase) {
    console.error('Usage: git-branch-env encrypt <file> <passphrase>');
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(passphrase).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
  const hmac = crypto.createHmac('sha256', passphrase).update(encrypted).digest('hex');
  const result = `${iv.toString('hex')}:${hmac}:${encrypted.toString('hex')}`;
  fs.writeFileSync(`${filePath}.encrypted`, result);
  console.log(`git-branch-env: Encrypted ${filePath} to ${filePath}.encrypted`);
  
} else if (command === 'decrypt') {
  const filePath = args[1];
  const passphrase = args[2];
  if (!filePath || !passphrase) {
    console.error('Usage: git-branch-env decrypt <file> <passphrase>');
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const [ivHex, hmac, encrypted] = content.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encrypted, 'hex');
  
  // Verify HMAC on encrypted data first
  const expectedHmac = crypto.createHmac('sha256', passphrase).update(encryptedBuffer).digest('hex');
  if (hmac !== expectedHmac) throw new Error('git-branch-env: HMAC verification failed');
  
  // Decrypt the data
  const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(passphrase).digest(), iv);
  const data = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  const decrypted = data.toString();
  const outputPath = filePath.replace('.encrypted', '.decrypted');
  fs.writeFileSync(outputPath, decrypted);
  console.log(`git-branch-env: Decrypted ${filePath} to ${outputPath}`);
  
} else if (command === 'generate-passphrase') {
  const length = parseInt(args[1]) || 32;
  const type = args[2] || 'mixed';
  
  let passphrase = '';
  const chars = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  
  switch (type) {
  case 'alphanumeric':
    passphrase = generatePassphrase(length, chars.lowercase + chars.uppercase + chars.numbers);
    break;
  case 'symbols':
    passphrase = generatePassphrase(length, chars.lowercase + chars.uppercase + chars.numbers + chars.symbols);
    break;
  case 'words':
    passphrase = generateWordPassphrase(length);
    break;
  case 'mixed':
  default:
    passphrase = generatePassphrase(length, chars.lowercase + chars.uppercase + chars.numbers + chars.symbols);
    break;
  }
  
  console.log(`Generated passphrase (${type}, ${length} chars):`);
  console.log(passphrase);
  console.log('\n💡 Tip: Store this securely and use it with:');
  console.log(`npx git-branch-env encrypt .env.prod "${passphrase}"`);
  
} else {
  console.log(`git-branch-env v${require('./package.json').version}
Automatically load environment variables based on git branch

Usage: git-branch-env <command> [options]

Commands:
  init [--template=typescript] [branch]  Initialize env file for current branch
  sync                                  Load and apply environment variables
  validate                              Validate environment configuration
  setup-hooks                          Install git post-checkout hook
  gitignore-env                        Add .env* to .gitignore
  export                               Export environment variables for shell
  vscode                               Add VSCode launch configuration
  encrypt <file> <passphrase>          Encrypt an environment file
  decrypt <file> <passphrase>          Decrypt an environment file
  generate-passphrase [length] [type]  Generate a secure passphrase

Examples:
  npx git-branch-env init
  npx git-branch-env init --template=typescript
  npx git-branch-env sync
  npx git-branch-env validate
  npx git-branch-env generate-passphrase 32 mixed
  npx git-branch-env encrypt .env.prod "my-secret-passphrase"

For more information, visit: https://github.com/salehammar/git-branch-env`);
}
