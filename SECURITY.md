# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

As we're in early development (Phase 0), we're actively supporting all releases. Once we reach 1.0.0, we'll establish a more formal support schedule.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **Do Not** Open a Public Issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report Privately

Send an email to: **[SECURITY EMAIL TO BE ADDED]**

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Suggested fix (if available)

### 3. Response Timeline

- **Initial Response**: Within 48 hours of report
- **Status Update**: Within 7 days with assessment
- **Fix Timeline**: Depends on severity
  - **Critical**: 24-72 hours
  - **High**: 7-14 days
  - **Medium**: 30 days
  - **Low**: Next regular release

### 4. Disclosure Policy

- Security vulnerabilities will be disclosed after a fix is available
- We'll coordinate disclosure timing with the reporter
- Credit will be given to the reporter (unless they prefer anonymity)

## Security Best Practices

When using this plugin:

1. **Keep Dependencies Updated**: Regularly update ESLint and this plugin
2. **Use Latest Version**: Always use the latest stable release
3. **Review Configuration**: Ensure your ESLint configuration doesn't expose sensitive information
4. **Audit Dependencies**: Run `npm audit` regularly

## Vulnerability Handling Process

1. **Report Received**: We acknowledge receipt within 48 hours
2. **Validation**: We validate the vulnerability
3. **Assessment**: We assess severity using CVSS scoring
4. **Fix Development**: We develop and test a fix
5. **Release**: We release a patch version
6. **Disclosure**: We publish a security advisory
7. **Credit**: We credit the reporter (if desired)

## Security Updates

Security updates will be:
- Released as patch versions (0.1.x)
- Documented in CHANGELOG.md
- Announced via GitHub Security Advisories
- Published to npm immediately

## Contact

For security concerns: **[SECURITY EMAIL TO BE ADDED]**

For general questions: Open a GitHub Discussion or Issue

## Known Security Considerations

### Current (Phase 0)

No known security vulnerabilities at this time. The project is in initial development phase.

### Future Considerations

As the project develops, we'll monitor for:
- Regular expression denial of service (ReDoS) in path matching
- Arbitrary code execution through configuration
- Information disclosure through error messages
- Dependency vulnerabilities

## Acknowledgments

We appreciate the security research community and all those who responsibly disclose vulnerabilities.

---

**Note**: This security policy will be updated as the project matures and evolves. Last updated: February 14, 2026.
