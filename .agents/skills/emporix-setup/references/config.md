# `ai-setup.json`

Committed at the repository root. Shared by the whole team, so it holds only
values that are identical on every machine: relative paths, workspace folder
basenames, GitHub `owner/name` slugs, env var **names**. Never absolute paths,
tokens, tenant values, client secrets, or personal identities.

Setup writes it. `--set key=value` changes single values. Humans may edit it.

## Full example

```json
{
  "baseBranch": "auto",
  "tracker": "jira",
  "codeHost": "github",
  "jira": {
    "project": "COP",
    "site": "emporix.atlassian.net",
    "buddyUrl": "http://ai-buddy.vpn.emporix.io"
  },
  "buddy": {
    "service": "Cart Service",
    "sync": true
  },
  "validation": {
    "commands": ["npm run lint", "npm test"]
  },
  "app": {
    "kind": "ui",
    "auth": "cockpit-token",
    "start": "npm run start",
    "baseUrl": "http://localhost:4173",
    "readyPath": "/",
    "authLanguage": "en"
  },
  "browser": {
    "provider": "agent-browser"
  },
  "qa": {
    "postman": {
      "workspace": "postman-collections",
      "repo": "emporix/postman-collections",
      "folder": "cart"
    }
  },
  "docs": {
    "targets": [
      {
        "flavor": "user-guides",
        "workspace": "emporix-documentation-portal",
        "repo": "emporix/emporix-documentation-portal",
        "paths": ["content/user-guides/management-dashboard/product-management"]
      },
      {
        "flavor": "api-references",
        "workspace": "api-references",
        "repo": "emporix/api-references",
        "paths": ["orders/order"]
      },
      {
        "flavor": "changelog",
        "workspace": "api-references",
        "repo": "emporix/api-references",
        "paths": ["changelog"]
      }
    ]
  },
  "standards": {
    "frontend": {
      "rules": ["core", "ui-components", "emporix-component-library", "testing", "e2e-test-ids", "api-data", "npm-dependencies", "i18n"]
    }
  },
  "design": {
    "priorArt": ["https://www.figma.com/design/…"]
  },
  "review": {
    "agentTokenEnv": "EMPORIX_REVIEW_AGENT_TOKEN"
  },
  "repoSkills": { "skills": ["emporix-shared-release-helper"] },
  "labels": { "enabled": false }
}
```

A minimal backend config is just:

```json
{
  "tracker": "jira",
  "codeHost": "github",
  "jira": { "project": "COP" },
  "validation": { "commands": ["./gradlew test"] },
  "app": { "kind": "backend", "start": "./gradlew bootRun", "baseUrl": "http://localhost:8080", "readyPath": "/actuator/health" }
}
```

Missing keys take the defaults below in `scripts/load-config.sh`.

## Keys

| Key | Default | Meaning |
|---|---|---|
| `baseBranch` | `"auto"` | Branch PRs target. `auto` resolves the repository default branch at runtime. |
| `tracker` | `"jira"` | Where issues live. Shipped descriptors: `jira`, `github`. Selects `references/trackers/<tracker>.md`. |
| `codeHost` | `"github"` | Where PRs and CI live. Shipped: `github`. Always read alongside a `jira` tracker. |
| `jira.project` | `"COP"` | Jira project key. Not a secret. Used when a skill needs a default project; skills still require a full key such as `COP-123`. |
| `jira.site` | `"emporix.atlassian.net"` | Jira Cloud host, no scheme. Browse URLs only; Buddy holds credentials. |
| `jira.buddyUrl` | `"http://ai-buddy.vpn.emporix.io"` | Buddy origin for file upload over HTTP (no `/mcp` suffix). |
| `buddy.service` | omitted | Name of this repository's service in the Buddy service registry — the target of **upsert-service-context**. Setup fills it (existing registry match, else `PROJECT.md` title) and the skill creates the service in Buddy when it does not exist yet. Empty means "not synced yet"; the next `emporix-setup` run resolves it again. |
| `buddy.sync` | `true` | When `false`, no skill pushes project knowledge to Buddy (`emporix-setup` step 6b and `emporix-feature` knowledge updates skip the sync and say so in the report). |
| `validation.commands` | `[]` | Ordered shell commands that prove the repo is healthy. Any non-zero exit is a gate failure. |
| `app.kind` | *(required)* | `ui` \| `backend` \| `fullstack`. UI QA runs only for `ui` / `fullstack`. |
| `app.auth` | omitted | `cockpit-token` (Emporix cockpit template, tenant + token gate) or `md-token` (Management Dashboard `serve:local-qa`). Omit otherwise. |
| `app.authLanguage` | `"en"` | Default language on the token gate; a tenant profile's `language` wins. |
| `app.start` | empty | Command that boots the UI preview or local API. Empty when unknown — QA skills ask at runtime. |
| `app.baseUrl` | empty | Origin only. For a backend this is what Newman calls. |
| `app.readyPath` | `"/"` | Path that must respond when the app is up. |
| `browser.provider` | `"agent-browser"` | Browser descriptor for `ui` / `fullstack`. Ignored for `backend`. |
| `qa.postman.workspace` | omitted | Cursor folder basename of the Postman checkout (`postman-collections`). |
| `qa.postman.repo` | omitted | `owner/name` of that checkout, read from its `origin`. |
| `qa.postman.folder` | omitted | Top-level service directory inside it (`cart`, `order`). |
| `docs.targets[]` | omitted | Published docs this product owns. Each: `flavor` (`api-references` \| `changelog` \| `tutorials` \| `user-guides`, or `release-notes` only when the user points at a file other than `content/release-notes/README.md`), `workspace` (folder basename), `repo` (`owner/name`), `paths` (relative, non-empty). Optional `service`, `notes`. A saved `business-docs` row means `user-guides`; keep its paths, do not rewrite it. |
| `standards.frontend.rules` | omitted | React `ui` / `fullstack` only. Enabled `emporix-frontend-standards` rule names (`core` always first). Detection and migration: `frontend-rules.md`. Never set on `backend`. |
| `design.priorArt[]` | omitted | Figma library/file URLs `emporix-design` treats as style authority. Added by hand (`--set design.priorArt='["…"]'`), not detected. |
| `review.agentTokenEnv` | `EMPORIX_REVIEW_AGENT_TOKEN` | Env var **name** holding the GitHub token of the **Emporix Review Agent** account (a bot or machine user with write access to the repo). Optional; no current skill posts as it (the removed `emporix-pr-create` did). Kept so the `review-agent-*` operations in the GitHub descriptor and older PR threads keep working. Never the value. |
| `repoSkills.enabled` | `true` | When `false`, setup does not install repository-specific skills. |
| `repoSkills.repository` | origin repo name | Override for the `{repository-name}` in `skills-repository-specific/{repository-name}/`. Set only when the origin name differs. |
| `repoSkills.source` | `"emporix/emporix-ai-sdlc-skills"` | `owner/name` of the skills source repo. |
| `repoSkills.skills` | omitted | Repo-specific skills setup installed. Written by setup, not by hand — `repo-skills.md`. |
| `labels.enabled` | `false` | When not `true`, tracker label guards are no-ops. |

## Not in this file: personal settings

Per-developer choices that differ between teammates live in
`~/.emporix/settings.json`, not here — `references/local-settings.md`
(today: `worktree.mode`, set with `/emporix-setup --set-local`).

## Removed from the previous layout

- `app.authTenantEnv` / `app.authTokenEnv` — QA credentials no longer come from environment variables or `~/.emporix-qa.env`. `emporix-qa-ui` and `emporix-demo-record` read tenant profiles from `~/.emporix/tenants.json` (`emporix-setup/scripts/tenants.sh`); the user names an alias and the scripts mint the token from the profile's API client. Existing keys are ignored.

- `version` — not used. Migration between layouts is manual.
- `paths.*` — the local layout is fixed: `.ai/runs`, `.ai/specs`, `.ai/qa`, `.ai/mockups`, `.ai/designs`, `.ai/demos`, `.ai/overrides`. The loader exports them as constants. `.ai/mockups` holds pre-existing mockup folders only (nothing creates them anymore); `.ai/designs` is created on demand by `emporix-design`. Ticket markdown (issue plan, review ledger, PR plan, docs plan, and any other note for that ticket) is one directory down, in `.ai/runs/{ticket-branch}/`, named the same as the branch and starting with the Jira key (`references/runs-layout.md`).
- The file itself moved from `.ai/emporix.config.json` (gitignored, per developer) to `ai-setup.json` (committed, per team).

## `--set` semantics

`--set a.b=value` writes `value` at that dotted path with `jq`. If `value`
parses as JSON (`true`, `42`, `["a","b"]`, `{"k":1}`) it is stored as that
type, otherwise as a string. `--set a.b=` removes the key. After writing,
re-render only the sections that depend on the key (`AGENTS.md` **Validation
gate** for `validation.commands`, **App** for `app.*`, **Documentation** /
**Postman** for those blocks, the **Frontend rules** row for
`standards.frontend.rules`) and show the diff. `buddy.*` keys render nothing;
`--set buddy.service=…` only changes which service the next sync targets.
