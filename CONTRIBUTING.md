# Contributing to git-branch-env

Thank you for your interest in contributing to git-branch-env! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/salehammar/git-branch-env.git`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/amazing-feature`
5. **Make** your changes
6. **Test** your changes: `npm test`
7. **Commit** your changes: `git commit -m 'Add amazing feature'`
8. **Push** to your fork: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

## 🧪 Development Setup

```bash
# Clone the repository
git clone https://github.com/salehammar/git-branch-env.git
cd git-branch-env

# Install dependencies
npm install

# Run tests
npm test

# Run CI tests
npm run test:ci

# Lint code
npm run lint
```

## 📝 Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

## 🧪 Testing

We use Node.js built-in `assert` for testing. All tests should:

- Be in the `test/` directory
- Have descriptive names
- Test both success and failure cases
- Clean up after themselves

```bash
# Run all tests
npm test

# Run specific test file
node test/test.js

# Run CI tests
npm run test:ci
```

## 📦 Package Structure

```
git-branch-env/
├── index.js                 # Main library
├── cli.js                   # Command-line interface
├── package.json             # Package configuration
├── README.md               # Documentation
├── test/                   # Test files
│   ├── test.js            # Unit tests
│   └── test-ci.js         # CI integration tests
└── examples/              # Example files
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment**: Node.js version, OS, git-branch-env version
2. **Steps to reproduce**: Clear, step-by-step instructions
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Additional context**: Any relevant configuration or logs

## 💡 Feature Requests

When requesting features, please:

1. **Describe** the problem you're trying to solve
2. **Explain** how the feature would help
3. **Provide** examples of how it would work
4. **Consider** if it fits the project's scope

## 📋 Pull Request Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what the PR does and why
- **Tests**: Include tests for new features
- **Documentation**: Update README if needed
- **Breaking changes**: Clearly mark and explain

## 🏷️ Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** version: Breaking changes
- **Minor** version: New features (backward compatible)
- **Patch** version: Bug fixes (backward compatible)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:

- The README file
- Release notes
- GitHub contributors list

Thank you for contributing to git-branch-env! 🚀
