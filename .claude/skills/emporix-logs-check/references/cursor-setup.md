# Add the Logging MCP in Cursor

Show this when `list_log_entries` is missing in Cursor. This file is the Cursor example. For Claude Code, show [claude-code-setup.md](claude-code-setup.md) instead. Do not edit `mcp.json` unless they ask. Never write a client secret into the skill, a commit, or the chat.

One server covers every project. The log project is chosen later in `resourceNames`. `x-goog-user-project` is only the quota project. One sign-in covers every project the person can read. The client ID and secret live in 1Password. `mcp.json` only references the environment variables below. Those variables must already be set when Cursor starts.

If `GCP_LOGGING_MCP_CLIENT_ID` or `GCP_LOGGING_MCP_CLIENT_SECRET` is empty, stop. Tell the user to open 1Password and search for `MCP cursor GCP logs client auth credentials`, then copy the client id and secret into these two commands by hand. The client ID replaces `paste-client-id`. The client secret replaces `paste-client-secret`. Do not read or print the 1Password values yourself. Do not use the 1Password CLI (`op`). That CLI signs into a personal account, and this item is on the company account.

```bash
launchctl setenv GCP_LOGGING_MCP_CLIENT_ID 'paste-client-id'
launchctl setenv GCP_LOGGING_MCP_CLIENT_SECRET 'paste-client-secret'
```

On macOS, put those two lines in the shell startup file (`~/.zshrc` for zsh, `~/.bash_profile` for bash) so they run when a terminal opens. Then they quit Cursor with Cmd+Q and open it again. A reload does not see variables set after Cursor started. After a reboot they open a terminal once, then open Cursor.

1. In [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients/create), create an OAuth client. Application type **Web application**. Authorized redirect URI `http://localhost:8787/callback`. Leave JavaScript origins empty. Check **Use this client for an AI-powered agent**. Put the client ID and secret in 1Password under `MCP cursor GCP logs client auth credentials`. Add `https://www.cursor.com/agents/mcp/oauth/callback` as well when they use Cursor on the web.
2. Merge this into `~/.cursor/mcp.json`. This file can be shared. It contains no secret.

```json
{
  "mcpServers": {
    "cloud-logging": {
      "url": "https://logging.googleapis.com/mcp",
      "headers": {
        "x-goog-user-project": "develop-297605"
      },
      "auth": {
        "CLIENT_ID": "${env:GCP_LOGGING_MCP_CLIENT_ID}",
        "CLIENT_SECRET": "${env:GCP_LOGGING_MCP_CLIENT_SECRET}",
        "scopes": ["https://www.googleapis.com/auth/logging.read"]
      }
    }
  }
}
```

3. Permissions are two separate grants. On each project they query, including Emporix Hosting projects such as `eh-zgraiffeisen`, they need log read access. On the quota project `develop-297605` they also need **MCP Tool User** (`roles/mcp.toolUser`) and `serviceusage.services.use` (Service Usage Consumer). A cross-project query returns `PERMISSION_DENIED` when that quota-project grant is missing, even if they can read logs in the target project. The Cloud Logging API must be enabled on the quota project.
4. In Cursor, open **Customize**, enable `cloud-logging`, and start a new chat. The first query opens a browser sign-in. Cursor refreshes the token after that.

An unverified consent screen allows about 100 sign-ins. Verification is only needed for a wider audience.
