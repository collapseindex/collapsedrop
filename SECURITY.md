# Security Policy

## Overview

CollapseDrop is designed with security as a priority. As a client-side only widget with **zero runtime dependencies**, the attack surface is minimal.

## Security Features

### XSS Prevention

All user-provided content is sanitized before rendering:

| Input | Protection |
|-------|------------|
| Title | HTML escaped via `escapeHtml()` |
| Subtitle | HTML escaped via `escapeHtml()` |
| Content | HTML escaped via `escapeHtml()` |
| Logo URL | URI encoded via `encodeURI()` |
| Background URL | URI encoded via `encodeURI()` |
| Logo size | HTML escaped |

### No Dangerous Patterns

CollapseDrop does **NOT** use:
- ❌ `eval()`
- ❌ `new Function()`
- ❌ `document.write()`
- ❌ Inline event handlers from user input
- ❌ External API calls
- ❌ Cookies or localStorage
- ❌ Any form of tracking

### Zero Runtime Dependencies

```json
"dependencies": {}
```

No supply chain risk. What you see is what you get.

### Data Privacy

- **No data collection** — Everything runs client-side
- **No external requests** — No analytics, no tracking pixels
- **No server communication** — Pure static JavaScript
- **GDPR compliant by design** — We don't process any data

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ Current |
| < 1.1   | ❌ Upgrade recommended |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Email:** ask@collapseindex.org
2. **Do NOT** open a public GitHub issue for security vulnerabilities
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 7 days
- **Fix (if confirmed):** Within 30 days for critical issues

### Recognition

Security researchers who responsibly disclose vulnerabilities will be:
- Credited in release notes (if desired)
- Added to our security acknowledgments

## Security Checklist for Users

When implementing CollapseDrop:

✅ **DO:**
- Use HTTPS for any external resources (logos, backgrounds)
- Keep CollapseDrop updated to the latest version
- Review any modifications before deploying

❌ **DON'T:**
- Inject untrusted/unsanitized HTML into CollapseDrop options
- Load CollapseDrop from untrusted CDNs
- Modify the escapeHtml function

## Audit History

| Date | Version | Auditor | Findings |
|------|---------|---------|----------|
| Jan 2026 | 1.1.0 | Internal | XSS vectors patched, all inputs sanitized |

## Dev Dependencies

Development dependencies (`devDependencies`) have known vulnerabilities but:
- They are **NOT** included in the distributed package
- They only affect local development
- Users who `npm install collapsedrop` receive zero dependencies

```
✅ Runtime: 0 dependencies
⚠️ Dev only: live-server, esbuild (local dev tools)
```

---

Questions? security@collapseindex.org
