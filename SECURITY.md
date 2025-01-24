# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of OffersPlus seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

Please send vulnerability reports to:
- Email: security@offerplus.io
- Subject Line: [Security Vulnerability] - Brief description

### What to Include

Please include the following information in your report:

1. Description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact of the vulnerability
4. Suggested fix (if any)
5. Your contact information for follow-up questions

### Response Timeline

We aim to respond to security reports within 24 hours. After the initial reply, we will keep you informed about the progress towards a fix and full announcement.

### Security Response Process

1. Initial Response (within 24 hours)
2. Confirmation & Investigation (1-3 days)
3. Fix Development & Testing (timeline varies based on complexity)
4. Security Advisory Release
5. Patch Release

### Disclosure Policy

- Please do not disclose the vulnerability publicly until we have had a chance to address it
- We will credit researchers who report valid security issues (unless they wish to remain anonymous)
- We aim to release patches within 90 days of receiving a report

## Security Best Practices

### For Contributors

1. **Code Review**
   - All code changes must go through peer review
   - Security-sensitive changes require additional review

2. **Dependencies**
   - Keep dependencies up to date
   - Regularly run security audits on dependencies
   - Use only trusted and well-maintained packages

3. **Authentication & Authorization**
   - Always use HTTPS
   - Implement proper session management
   - Follow the principle of least privilege

4. **Data Protection**
   - Never commit sensitive data (API keys, credentials)
   - Use environment variables for configuration
   - Encrypt sensitive data at rest

### For Users

1. **Account Security**
   - Use strong, unique passwords
   - Enable two-factor authentication when available
   - Keep your access tokens secure

2. **API Usage**
   - Protect your API keys
   - Use separate API keys for development and production
   - Rotate keys periodically

## Security Features

- JWT-based authentication
- HTTPS enforcement
- CORS protection
- Rate limiting
- Input validation
- XSS protection
- CSRF protection
- SQL injection prevention
- Secure password hashing

## Compliance

We strive to comply with industry security standards and best practices:

- OWASP Security Guidelines
- GDPR compliance for EU users
- Regular security audits
- Secure development lifecycle

## Contact

For any security-related questions, please contact:
- Email: security@offerplus.io
- Website: https://offerplus.io/security

---

Last updated: January 2025
