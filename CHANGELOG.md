# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI/CD workflow
- Contributing guidelines
- Changelog documentation

## [1.4.0] - 2024-01-XX

### Added
- **Branch-aware environment loading** - Automatically loads `.env.{branch}` files
- **CI/CD Integration** - Support for GitHub Actions, GitLab CI, CircleCI, Travis, Bitbucket
- **Encryption Support** - AES-256-CBC encryption for sensitive environment files
- **Pattern Mapping** - Map branch patterns to specific env files (e.g., `feature/*` → `.env.dev`)
- **Validation** - Ensure required environment variables are present
- **Developer Experience** - VSCode integration, git hooks, templates
- **Environment Variable Expansion** - Support for `${VAR}` syntax
- **Branch Sanitization** - Replace special characters and limit length
- **Template Fallbacks** - Use `.env.{branch}.example` files when actual files don't exist
- **CLI Commands**:
  - `init` - Initialize environment files with templates
  - `sync` - Load and apply environment variables
  - `validate` - Validate environment configuration
  - `setup-hooks` - Install git post-checkout hook
  - `gitignore-env` - Add .env* to .gitignore
  - `export` - Export environment variables for shell
  - `vscode` - Add VSCode launch configuration
  - `encrypt` - Encrypt environment files
  - `decrypt` - Decrypt environment files

### Features
- **Zero Configuration** - Works out of the box with sensible defaults
- **Cross-Platform** - Works on Windows, macOS, and Linux
- **Performance Optimized** - Caching for branch detection and config loading
- **Error Handling** - Comprehensive error messages and validation
- **Extensible** - Modular design for easy customization

### Technical
- Node.js 12+ compatibility
- MIT License
- Comprehensive test suite
- ESLint configuration
- Professional documentation

---

## Version History

- **1.4.0** - Initial release with full feature set
- **1.3.0** - Beta version with core functionality
- **1.2.0** - Alpha version with basic branch detection
- **1.1.0** - Proof of concept
- **1.0.0** - Initial concept

---

For detailed information about each release, see the [GitHub releases page](https://github.com/yourusername/git-branch-env/releases).
