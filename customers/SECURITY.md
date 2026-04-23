# Security

## Reporting vulnerabilities

If you believe you have found a security issue, please report it through your usual Emporix channel (e.g. internal security contact or support) rather than opening a public issue with exploit details.

## Using this extension

- **Production:** Always load this remote from the **Management Dashboard** (or another trusted host) that supplies a real `appState` with valid `tenant` and `token`. The standalone dev defaults (`tenant` / `token` placeholders) are **not** for production.
- **API URL:** Set `VITE_API_URL` via environment at build time; do not hardcode credentials in the repo.
- **Tokens:** JWTs and API keys belong in host-provided `appState`, not in source control.
