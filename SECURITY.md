# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | :white_check_mark: |
| < 1.4   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 🔒 **Private Disclosure**

1. **DO NOT** create a public GitHub issue
3. **Include** the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### 📋 **What to Include**

Please provide as much detail as possible:

- **Version**: git-branch-env version affected
- **Environment**: Node.js version, OS, configuration
- **Description**: Clear explanation of the vulnerability
- **Reproduction**: Step-by-step instructions
- **Impact**: Potential consequences
- **Timeline**: When you discovered it

### ⏱️ **Response Timeline**

- **Initial Response**: Within 48 hours
- **Status Update**: Within 1 week
- **Fix Timeline**: Depends on severity (1-4 weeks)

### 🏆 **Recognition**

Security researchers who responsibly disclose vulnerabilities will be:

- Listed in our security acknowledgments
- Given credit in release notes

## Security Features

### 🔐 **Encryption**

git-branch-env includes several security features:

- **AES-256-CBC** encryption for sensitive files
- **HMAC verification** for integrity
- **Secure key derivation** using SHA-256
- **Environment isolation** to prevent leaks

### 🛡️ **Best Practices**

- **Never commit** `.env` files to version control
- **Use encryption** for sensitive environment files
- **Validate** required environment variables
- **Sanitize** branch names to prevent injection
- **Use strong passphrases** for encryption

### 🔍 **Security Checklist**

Before using git-branch-env in production:

- [ ] Review your `.gitignore` to exclude `.env*` files
- [ ] Use encrypted files for sensitive data
- [ ] Validate all required environment variables
- [ ] Test in a secure environment first
- [ ] Keep dependencies updated

## Known Issues

Currently, there are no known security vulnerabilities.

## Updates

Security updates will be released as patch versions (e.g., 1.4.1, 1.4.2).

---

**Thank you for helping keep git-branch-env secure!** 🛡️
