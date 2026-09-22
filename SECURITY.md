# Security Policy

## Reporting a Vulnerability

Please do **not** open a public issue for security vulnerabilities.

Instead, report them privately using GitHub's
[private vulnerability reporting](https://github.com/yapsgg/ANORA-Labs/security/advisories/new)
or by contacting the maintainers through <https://github.com/yapsgg>.

Include as much detail as you can:

- A description of the issue and its impact
- Steps to reproduce
- Affected versions or routes
- Any suggested remediation

We will acknowledge your report as quickly as possible and keep you updated
through the remediation process.

## Supported Versions

ANORA Labs is in early development. Security fixes are applied to the latest
`main` branch.

## Secrets

Never commit API keys or credentials. All `.env*` files except `.env.example`
are gitignored. If you believe a secret has been exposed, rotate it immediately
and notify the maintainers.
