# git-branch-env

🚀 **Automatically load environment variables based on git branch** with CI/CD support, encryption, and developer tools.

[![npm version](https://badge.fury.io/js/git-branch-env.svg)](https://badge.fury.io/js/git-branch-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/salehammar/git-branch-env/workflows/CI/badge.svg)](https://github.com/salehammar/git-branch-env/actions)

## ✨ Features

- 🔄 **Branch-aware environment loading** - Automatically loads `.env.{branch}` files
- 🏭 **CI/CD Integration** - Works with GitHub Actions, GitLab CI, CircleCI, Travis, Bitbucket
- 🔐 **Encryption Support** - Secure your sensitive environment files with passphrase generation
- 🎯 **Pattern Mapping** - Map branch patterns to specific env files (e.g., `feature/*` → `.env.dev`)
- ✅ **Validation** - Ensure required environment variables are present
- 🎨 **Developer Experience** - VSCode integration, git hooks, templates
- 🚀 **Zero Configuration** - Works out of the box with sensible defaults
- 👥 **Team Collaboration** - Easy sharing and management of environment configurations

## 🚀 Quick Start

```bash
# Install globally
npm install -g git-branch-env

# Or use with npx
npx git-branch-env init
npx git-branch-env sync
```

## 📁 File Structure

```
your-project/
├── .env.base                    # Base environment variables (shared)
├── .env.main                    # Production environment
├── .env.dev                     # Development environment
├── .env.staging                 # Staging environment
├── .env.feature-auth            # Feature branch environment
├── .env.feature-auth.example    # Template for feature branch
├── .env.prod.encrypted          # Encrypted production environment
├── branch-env.config.json       # Configuration file
├── .gitignore                   # Excludes .env* files
└── README.md                    # Team documentation
```

### 📋 **File Types Explained**

- **`.env.base`** - Shared variables across all environments
- **`.env.{branch}`** - Branch-specific overrides
- **`.env.{branch}.example`** - Templates for new branches
- **`.env.{env}.encrypted`** - Encrypted sensitive files
- **`branch-env.config.json`** - Configuration and mappings

## 🛠️ Usage

### Basic Usage

```javascript
// In your application
require('git-branch-env').load();

// Now process.env contains your branch-specific variables
console.log(process.env.DATABASE_URL);
```

### CLI Commands

```bash
# Initialize environment file for current branch
npx git-branch-env init

# Load and apply environment variables
npx git-branch-env sync

# Validate environment configuration
npx git-branch-env validate

# Setup git hooks for automatic syncing
npx git-branch-env setup-hooks

# Add .env* to .gitignore
npx git-branch-env gitignore-env

# Export environment variables for shell
npx git-branch-env export

# Add VSCode launch configuration
npx git-branch-env vscode

# Generate secure passphrases
npx git-branch-env generate-passphrase
npx git-branch-env generate-passphrase 32 mixed
npx git-branch-env generate-passphrase 24 alphanumeric
npx git-branch-env generate-passphrase 16 words

# Encrypt/Decrypt environment files
npx git-branch-env encrypt .env.prod "my-secret-passphrase"
npx git-branch-env decrypt .env.prod.encrypted "my-secret-passphrase"
```

## ⚙️ Configuration

Create `branch-env.config.json` in your project root:

```json
{
  "mappings": {
    "feature/*": ".env.dev",
    "hotfix/*": ".env.staging",
    "release/*": ".env.staging"
  },
  "requiredKeys": ["DATABASE_URL", "API_KEY"],
  "baseEnv": ".env.base",
  "warnOnTemplate": true,
  "branchSanitizer": {
    "replaceSpecialChars": true,
    "maxLength": 30
  },
  "branchFallbacks": [
    {
      "envVar": "CUSTOM_BRANCH"
    },
    {
      "file": "./branch.txt"
    }
  ]
}
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `mappings` | Object | Map branch patterns to env files |
| `requiredKeys` | Array | Required environment variables |
| `baseEnv` | String | Base environment file (default: `.env.base`) |
| `warnOnTemplate` | Boolean | Warn when using template files |
| `branchSanitizer` | Object | Branch name sanitization rules |
| `branchFallbacks` | Array | Fallback methods for branch detection |

## 🔐 Encryption & Passphrase Management

git-branch-env provides robust encryption for your sensitive environment files with multiple passphrase options.

### 🔑 **Passphrase Options**

#### **1. Generate Secure Passphrases**

```bash
# Generate a mixed passphrase (default: 32 chars)
npx git-branch-env generate-passphrase

# Generate specific length and type
npx git-branch-env generate-passphrase 24 alphanumeric
npx git-branch-env generate-passphrase 16 words
npx git-branch-env generate-passphrase 40 symbols
```

**Passphrase Types:**
- `mixed` - Letters, numbers, and symbols (default)
- `alphanumeric` - Letters and numbers only
- `symbols` - Letters, numbers, and special characters
- `words` - Easy-to-remember word combinations

**Examples:**
```bash
# Mixed (32 chars): w)QoU)emlu9@cAF[S3o=(gw*A]K|eB,L
# Alphanumeric (24 chars): 4XegezfLB7o9WacRLJhg0Koo
# Words (16 chars): eagle-lemon
```

#### **2. Use Your Own Passphrase**

```bash
# Use a custom passphrase
npx git-branch-env encrypt .env.prod "my-custom-secure-passphrase-123"
```

#### **3. Environment Variable Passphrase**

```bash
# Set passphrase as environment variable
export GIT_BRANCH_ENV_PASSPHRASE="my-secret-passphrase"

# Use in your application
require('git-branch-env').load({ 
  encrypted: true, 
  passphrase: process.env.GIT_BRANCH_ENV_PASSPHRASE 
});
```

### 🔐 **Encryption Commands**

```bash
# Encrypt a file
npx git-branch-env encrypt .env.prod "my-secret-passphrase"

# Decrypt a file
npx git-branch-env decrypt .env.prod.encrypted "my-secret-passphrase"

# Use encrypted file in your app
require('git-branch-env').load({ 
  encrypted: true, 
  passphrase: 'my-secret-passphrase' 
});
```

### 🛡️ **Security Features**

- **AES-256-CBC** encryption with random IV
- **HMAC-SHA256** verification for integrity
- **Tamper detection** - prevents modification
- **Secure key derivation** using SHA-256
- **Environment isolation** to prevent leaks

### 📋 **Passphrase Best Practices**

1. **Length**: Use at least 16 characters (32+ recommended)
2. **Complexity**: Include letters, numbers, and symbols
3. **Uniqueness**: Use different passphrases for different environments
4. **Storage**: Store securely (password manager, environment variables)
5. **Rotation**: Change passphrases regularly
6. **Backup**: Keep secure backups of your passphrases

### 🔄 **Workflow Examples**

#### **Scenario 1: Production Environment**
```bash
# 1. Generate a strong passphrase
npx git-branch-env generate-passphrase 32 mixed
# Output: w)QoU)emlu9@cAF[S3o=(gw*A]K|eB,L

# 2. Encrypt production environment
npx git-branch-env encrypt .env.prod "w)QoU)emlu9@cAF[S3o=(gw*A]K|eB,L"

# 3. Add encrypted file to version control
git add .env.prod.encrypted
git commit -m "Add encrypted production environment"

# 4. Use in your application
require('git-branch-env').load({ 
  encrypted: true, 
  passphrase: process.env.PROD_PASSPHRASE 
});
```

#### **Scenario 2: Development Team**
```bash
# 1. Generate easy-to-remember passphrase
npx git-branch-env generate-passphrase 16 words
# Output: eagle-lemon

# 2. Share passphrase securely with team
# (Use password manager, secure chat, etc.)

# 3. Encrypt development environment
npx git-branch-env encrypt .env.dev "eagle-lemon"

# 4. Team members can decrypt when needed
npx git-branch-env decrypt .env.dev.encrypted "eagle-lemon"
```

#### **Scenario 3: CI/CD Pipeline**
```bash
# 1. Generate alphanumeric passphrase (no special chars)
npx git-branch-env generate-passphrase 24 alphanumeric
# Output: 4XegezfLB7o9WacRLJhg0Koo

# 2. Set as CI/CD secret
# In GitHub Actions: GIT_BRANCH_ENV_PASSPHRASE

# 3. Use in CI/CD
require('git-branch-env').load({ 
  encrypted: true, 
  passphrase: process.env.GIT_BRANCH_ENV_PASSPHRASE 
});
```

### 🚨 **Security Warnings**

- ⚠️ **Never commit** unencrypted `.env` files
- ⚠️ **Never share** passphrases in code or logs
- ⚠️ **Use strong** passphrases (avoid common words)
- ⚠️ **Store securely** (not in plain text files)
- ⚠️ **Rotate regularly** for production environments

## 🏭 CI/CD Integration

### GitHub Actions

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - name: Load Environment
        run: npx git-branch-env sync
      - run: npm test
```

### GitLab CI

```yaml
stages:
  - test
  - build

test:
  stage: test
  script:
    - npm ci
    - npx git-branch-env sync
    - npm test
```

### CircleCI

```yaml
version: 2.1
jobs:
  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run: npm ci
      - run: npx git-branch-env sync
      - run: npm test
```

## 👥 Team Collaboration

git-branch-env makes it easy for teams to manage environment variables together while maintaining security and consistency.

### 🚀 **Initial Team Setup**

#### **Step 1: Project Lead Setup**
```bash
# 1. Initialize the project with git-branch-env
npx git-branch-env init

# 2. Create base environment file
echo "APP_NAME=MyAwesomeApp
APP_VERSION=1.0.0
NODE_ENV=development" > .env.base

# 3. Create development environment
echo "DATABASE_URL=postgres://dev:pass@localhost:5432/dev
API_KEY=dev_key_123
DEBUG=true" > .env.dev

# 4. Create production template (encrypted)
npx git-branch-env generate-passphrase 32 mixed
# Use the generated passphrase to encrypt production env
npx git-branch-env encrypt .env.prod "generated-passphrase"

# 5. Setup git hooks for automatic syncing
npx git-branch-env setup-hooks

# 6. Add to .gitignore
npx git-branch-env gitignore-env

# 7. Commit and push
git add .env.base .env.dev .env.prod.encrypted branch-env.config.json
git commit -m "Setup git-branch-env for team collaboration"
git push origin main
```

#### **Step 2: Team Member Onboarding**
```bash
# 1. Clone the repository
git clone https://github.com/yourteam/your-project.git
cd your-project

# 2. Install git-branch-env
npm install --save-dev git-branch-env

# 3. Setup git hooks (optional)
npx git-branch-env setup-hooks

# 4. Get production passphrase from team lead (secure channel)
# 5. Test environment loading
npx git-branch-env sync
```

### 🔄 **Daily Team Workflows**

#### **Scenario 1: Starting a New Feature**
```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Initialize environment for the feature
npx git-branch-env init

# 3. Customize environment if needed
echo "AUTH_SERVICE_URL=http://localhost:3001/auth
JWT_SECRET=feature-jwt-secret" >> .env.feature-user-authentication

# 4. Test your changes
npm test

# 5. Commit and push
git add .env.feature-user-authentication
git commit -m "Add authentication feature environment"
git push origin feature/user-authentication
```

#### **Scenario 2: Switching Between Branches**
```bash
# Automatic (with git hooks)
git checkout main
# Environment automatically switches to .env.main

git checkout feature/user-authentication
# Environment automatically switches to .env.feature-user-authentication

# Manual sync if needed
npx git-branch-env sync
```

#### **Scenario 3: Team Member Joins Existing Feature**
```bash
# 1. Pull the latest changes
git pull origin feature/user-authentication

# 2. Environment automatically loads
# (git hooks handle this automatically)

# 3. If environment file doesn't exist, use template
# git-branch-env will automatically use .env.feature-user-authentication.example
```

### 🔐 **Secure Team Collaboration**

#### **Production Environment Management**
```bash
# Team Lead: Encrypt production environment
npx git-branch-env generate-passphrase 32 mixed
# Share passphrase securely with team (password manager, secure chat)

# Team Members: Use encrypted environment
npx git-branch-env decrypt .env.prod.encrypted "shared-passphrase"
# Or use in application
require('git-branch-env').load({ 
  encrypted: true, 
  passphrase: process.env.PROD_PASSPHRASE 
});
```

#### **Development Environment Sharing**
```bash
# Create shared development environment
echo "DATABASE_URL=postgres://dev:pass@dev-db:5432/dev
REDIS_URL=redis://dev-redis:6379
API_BASE_URL=https://dev-api.example.com" > .env.dev

# Commit to repository (safe for development)
git add .env.dev
git commit -m "Update development environment"
git push origin main
```

### 📋 **Team Roles & Responsibilities**

#### **Project Lead / DevOps**
- ✅ Setup initial git-branch-env configuration
- ✅ Manage production passphrases securely
- ✅ Create and maintain `.env.base` with shared variables
- ✅ Setup CI/CD integration
- ✅ Monitor environment consistency across team

#### **Senior Developers**
- ✅ Create feature branch environments
- ✅ Review environment changes in pull requests
- ✅ Maintain environment templates (`.env.*.example`)
- ✅ Help team members with environment issues

#### **Team Members**
- ✅ Use `npx git-branch-env init` for new features
- ✅ Keep feature environments minimal and focused
- ✅ Test environment changes locally before committing
- ✅ Follow team's environment naming conventions

### 🚨 **Team Security Guidelines**

#### **What to Commit** ✅
- `.env.base` - Shared, non-sensitive variables
- `.env.dev` - Development environment (non-sensitive)
- `.env.*.example` - Templates for new branches
- `.env.*.encrypted` - Encrypted sensitive files
- `branch-env.config.json` - Configuration

#### **What NOT to Commit** ❌
- `.env.prod` - Unencrypted production environment
- `.env.staging` - Unencrypted staging environment
- Any `.env` files with real API keys, passwords, or secrets
- Passphrases or encryption keys

#### **Secure Sharing Practices**
- 🔐 Use password managers for passphrases
- 🔐 Share passphrases via secure channels (not email/Slack)
- 🔐 Rotate passphrases regularly
- 🔐 Use different passphrases for different environments
- 🔐 Limit access to production passphrases

### 🔄 **Pull Request Workflow**

#### **When Creating a PR**
```bash
# 1. Ensure environment files are properly named
ls -la .env*

# 2. Test environment loading
npx git-branch-env validate

# 3. Update documentation if needed
# 4. Create pull request with clear description
```

#### **When Reviewing a PR**
- ✅ Check that no sensitive data is exposed
- ✅ Verify environment file naming follows conventions
- ✅ Ensure `.env.*.example` files are updated
- ✅ Test environment loading in the feature branch
- ✅ Confirm CI/CD tests pass

### 🎨 Developer Experience

### VSCode Integration

```bash
npx git-branch-env vscode
```

This creates a `.vscode/launch.json` with automatic environment loading.

### Git Hooks

```bash
npx git-branch-env setup-hooks
```

Automatically syncs environment when switching branches.

### Husky Integration

If you're using Husky, add to `.husky/post-checkout`:

```bash
#!/bin/sh
npx git-branch-env sync
```

## 🔧 Advanced Usage

### Programmatic API

```javascript
const gitBranchEnv = require('git-branch-env');

// Load with options
gitBranchEnv.load({
  verbose: true,
  diff: true,
  encrypted: true,
  passphrase: 'secret'
});

// Validate only
gitBranchEnv.validate({ verbose: true });

// Get current branch
const branch = gitBranchEnv.getCurrentBranch();

// Match branch to env file
const envFile = gitBranchEnv.matchBranchToEnv(branch, config);
```

### Environment Variable Expansion

```bash
# .env.base
BASE_URL=https://api.example.com
API_VERSION=v1

# .env.dev
API_URL=${BASE_URL}/${API_VERSION}/dev
DEBUG=true
```

### Multiline Values

```bash
# .env.prod
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm test                    # Unit tests
npm run test:ci            # CI integration tests
npm run test:encryption    # Encryption and passphrase tests

# Test encryption manually
npx git-branch-env encrypt .env.prod my-secret-passphrase
npx git-branch-env decrypt .env.prod.encrypted my-secret-passphrase
```

## 📦 Installation

```bash
# Global installation
npm install -g git-branch-env

# Local installation (recommended for teams)
npm install --save-dev git-branch-env

# Using npx (no installation required)
npx git-branch-env init
```

### 🏗️ **Project Setup**

```bash
# 1. Initialize git-branch-env in your project
npx git-branch-env init

# 2. Setup git hooks for automatic syncing
npx git-branch-env setup-hooks

# 3. Add environment files to .gitignore
npx git-branch-env gitignore-env

# 4. Create your first environment file
npx git-branch-env init --template=typescript
```

## 🔧 Troubleshooting

### ❓ **Common Issues & Solutions**

#### **Issue: Environment not loading**
```bash
# Check if git-branch-env is detecting your branch
npx git-branch-env sync --verbose

# Verify your environment file exists
ls -la .env*

# Check branch-env.config.json configuration
cat branch-env.config.json
```

#### **Issue: Git hooks not working**
```bash
# Reinstall git hooks
npx git-branch-env setup-hooks

# Check if hooks are executable
ls -la .git/hooks/post-checkout

# Test manual sync
npx git-branch-env sync
```

#### **Issue: Encryption/Decryption failing**
```bash
# Verify passphrase is correct
npx git-branch-env decrypt .env.prod.encrypted "your-passphrase"

# Check if encrypted file is corrupted
cat .env.prod.encrypted

# Regenerate passphrase if needed
npx git-branch-env generate-passphrase 32 mixed
```

#### **Issue: CI/CD not detecting branch**
```bash
# Check CI environment variables
echo "GITHUB_REF: $GITHUB_REF"
echo "GITLAB_CI: $GITLAB_CI"
echo "CIRCLE_BRANCH: $CIRCLE_BRANCH"

# Use fallback configuration
echo "CUSTOM_BRANCH=main" >> branch-env.config.json
```

#### **Issue: Validation failing**
```bash
# Check required keys in configuration
cat branch-env.config.json

# Verify all required variables are set
npx git-branch-env validate --verbose

# Check for missing or empty values
grep -E "^[A-Z_]+=$" .env*
```

### 🐛 **Debug Mode**

```bash
# Enable verbose logging
npx git-branch-env sync --verbose

# Check branch detection
node -e "console.log(require('./index').getCurrentBranch())"

# Test configuration loading
node -e "console.log(JSON.stringify(require('./index').loadConfig(), null, 2))"
```

### 📞 **Getting Help**

- 📖 **Documentation**: Check this README for detailed examples
- 🐛 **Issues**: [GitHub Issues](https://github.com/salehammar/git-branch-env/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/salehammar/git-branch-env/discussions)
- 📧 **Email**: hi@salehammar.com

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🧪 **Development Setup**

```bash
# Clone the repository
git clone https://github.com/salehammar/git-branch-env.git
cd git-branch-env

# Install dependencies
npm install

# Run tests
npm run test:all

# Run linter
npm run lint
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for branch-specific environment management
- Built with ❤️ for the developer community
- Thanks to all contributors and users

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/salehammar/git-branch-env/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/salehammar/git-branch-env/wiki)

## 📚 **Complete Feature Summary**

### 🎯 **What git-branch-env Solves**

| Problem | Solution |
|---------|----------|
| **Manual environment switching** | Automatic branch-based loading |
| **Environment file management** | Pattern mapping and templates |
| **Sensitive data security** | AES-256 encryption with HMAC |
| **Team collaboration** | Shared configurations and secure sharing |
| **CI/CD integration** | Multi-platform support |
| **Developer experience** | Git hooks, VSCode integration |

### 🚀 **Key Capabilities**

- ✅ **Branch Detection** - Works with local git and all major CI platforms
- ✅ **Pattern Mapping** - Map branch patterns to specific environments
- ✅ **Template System** - Automatic fallback to example files
- ✅ **Encryption** - Secure sensitive files with passphrase generation
- ✅ **Validation** - Ensure required variables are present
- ✅ **Team Workflows** - Complete collaboration guidelines
- ✅ **CI/CD Ready** - Works in GitHub Actions, GitLab CI, CircleCI, etc.
- ✅ **Developer Tools** - VSCode integration, git hooks, debugging

### 📊 **Usage Statistics**

```bash
# Most common commands
npx git-branch-env init          # Initialize environment
npx git-branch-env sync          # Load environment
npx git-branch-env validate      # Validate configuration
npx git-branch-env generate-passphrase  # Generate secure passphrase
npx git-branch-env encrypt       # Encrypt sensitive files
```

### 🎉 **Success Stories**

- **Teams**: Manage environments across 10+ developers
- **CI/CD**: Automated deployments with branch-specific configs
- **Security**: Encrypted production environments in version control
- **Productivity**: Zero manual environment switching

---

**Made with ❤️ for developers who love clean, automated workflows!**

**Ready to transform your environment management?** 🚀

```bash
# Get started in 30 seconds
npx git-branch-env init
npx git-branch-env setup-hooks
npx git-branch-env sync
```
