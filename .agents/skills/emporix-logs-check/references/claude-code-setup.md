# Add the Logging MCP in Claude Code

Show this when `list_log_entries` is missing in Claude Code (CLI or the Claude desktop app). It uses the same OAuth client as [cursor-setup.md](cursor-setup.md). Do not edit `~/.claude.json` unless they ask. Never write a client secret into the skill, a commit, or the chat.

The client ID and secret live in 1Password. Tell the user to open 1Password and search for `MCP cursor GCP logs client auth credentials`. Do not read or print the 1Password values yourself. Do not use the 1Password CLI (`op`).

## Why not just edit `~/.claude.json`

Claude Code has no field for the client secret in `~/.claude.json`. It stores the secret in the macOS Keychain (item `Claude Code-credentials`), and only `claude mcp add --client-secret` puts it there. Two more things break a hand-written entry:

- `"clientId": "${GCP_LOGGING_MCP_CLIENT_ID}"` is not expanded inside the `oauth` block. Google gets the literal text and answers `Error 401: invalid_client` ("The OAuth client was not found").
- The OAuth client only allows the redirect URI `http://localhost:8787/callback`. Any other `callbackPort` (for example `8080`) fails with `redirect_uri_mismatch`.

## Steps

1. Remove any old entry. Skip this when there is none.

```bash
claude mcp remove cloud-logging -s user
```

2. Add the server. Replace `paste-client-id` with the client ID from 1Password. The command then asks for the client secret. Paste it there (Cmd+V works, the input stays hidden) and press Enter.

```bash
claude mcp add --transport http cloud-logging https://logging.googleapis.com/mcp -s user --client-id 'paste-client-id' --client-secret --callback-port 8787 -H "x-goog-user-project: develop-297605"
```

When `GCP_LOGGING_MCP_CLIENT_ID` and `GCP_LOGGING_MCP_CLIENT_SECRET` are already set from the Cursor setup, they can skip the copy and paste:

```bash
MCP_CLIENT_SECRET="$GCP_LOGGING_MCP_CLIENT_SECRET" claude mcp add --transport http cloud-logging https://logging.googleapis.com/mcp -s user --client-id "$GCP_LOGGING_MCP_CLIENT_ID" --client-secret --callback-port 8787 -H "x-goog-user-project: develop-297605"
```

`~/.claude.json` then holds the URL, the header, the client ID, and `callbackPort: 8787`. The secret is only in the Keychain.

3. Quit the Claude desktop app with Cmd+Q and open it again, or start a new `claude` in the terminal. A running session keeps the old config, so Reconnect there signs in with the old values.
4. In a new session, type `/mcp`, open `cloud-logging`, and choose **Authenticate**. Sign in with the Emporix Google account, not a personal one. Wait for the browser page that says sign-in is complete before going back to Claude. Clicking Reconnect earlier shows "Sign-in hasn't completed".
5. Permissions are the same as in step 3 of [cursor-setup.md](cursor-setup.md): log read access on each project they query, plus **MCP Tool User** (`roles/mcp.toolUser`) and `serviceusage.services.use` on the quota project `develop-297605`.

## If sign-in still fails

Run `claude` in a terminal and repeat step 4 there. The terminal shows the full error instead of a toast.

| Browser or terminal says | Cause |
| --- | --- |
| `invalid_client` | The client ID is wrong or still the literal `${...}` text. Repeat steps 1 and 2. |
| `redirect_uri_mismatch` | `callbackPort` is not `8787`. Repeat steps 1 and 2. |
| `PERMISSION_DENIED` on a query | The quota-project grant on `develop-297605` is missing. See step 5. |
