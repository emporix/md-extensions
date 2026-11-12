# Scopes

Group the user's scopes into resources by dropping the `_read` or `_manage` suffix.

`ai.agent_read` and `ai.agent_manage` are one resource, code `ai.agent`. A scope that does not end in `_read` or `_manage` is a stop: ask the user.

Constant name: the segment after the last `.`, uppercased. `ai.agent_read` → `AGENT_READ`. Do not insert extra underscores.

New `_id` values keep the prefix of the latest object in that file and use a new last segment. Reject an id that already appears in the repo.

`de` strings copy the English text. Do not invent a translation.

Standard (tenant) scopes follow [emporix/tenant-automation#488](https://github.com/emporix/tenant-automation/pull/488) (`ai.agent_read` / `ai.agent_manage`). Internal scopes stay under `src/iam/emporix/`.

## `library/scopes`

Add a nested class at the end of `src/main/java/com/emporix/scopes/Scopes.java`, before the closing brace of `Scopes`. Same shape as `PartnerLibrary`. Class name is the PascalCase service name.

```java
public static final class PartnerLibrary {

  public static final String COMPONENT_READ = "library.component_read";
  public static final String COMPONENT_MANAGE = "library.component_manage";

  private PartnerLibrary() {
  }
}
```

One constant per scope the user provided, standard and internal.

Bump the library version in `build.gradle`. Increment the last numeric segment of `version` (`0.0.135` becomes `0.0.136`). Read the current value from the file; do not assume the number above. The publish workflow releases that version.

## `tenant-automation/src/iam/scopesDb.json`

Add one object per scope the user provided, standard and internal. This file was added after PR 488, so that pull request does not show it. Insert each object so `_id` stays in alphabetical order. `domain` is the scope prefix before the first dot (`ai.agent_read` → `ai`). `de` copies `en`.

Standard scope:

```json
{
  "_id": "ai.agent_read",
  "description": {
    "en": "Read {segment}",
    "de": "Read {segment}"
  },
  "domain": "ai"
}
```

Use `Manage {segment}` for a `_manage` scope.

Internal scope:

```json
{
  "_id": "library.licence_read",
  "internal": true
}
```

Do not edit `src/oe/iam/scopesDb.json`. That file is the OE scope list.

## Standard scopes — `tenant-automation/src/iam`

For each standard resource, edit the same files as `ai.agent_*` in PR 488. `{segment}` is the resource code after the dot (`ai.agent` → `agent`). Create a row only for a suffix the user asked for. Do not edit `acCustomerDb.json` or `templatesDb.json`.

**`resourcesDb.json`**

```json
{
  "_id": "<new-id>",
  "name": {
    "en": "{DisplayName} | {segment}",
    "de": "{DisplayName} | {segment}"
  },
  "description": {
    "en": "{DisplayName} service with {segment} capabilities",
    "de": "{DisplayName} service with {segment} capabilities"
  },
  "code": "{resource-code}",
  "metadata": {
    "version": 1
  }
}
```

**`permissionsDb.json`** — append the resource `_id` to `applicableResources` of the object whose `code` is `read` when a `_read` scope exists, and of the object whose `code` is `manage` when a `_manage` scope exists. There is one object for each code.

**`acManagerDb.json`** — one row when a `_manage` scope exists. `roleId` is `1rl5e52e-6e27-4ac5-9471-2467d3fb7502`. `scopes` lists only the `_manage` scope.

```json
{
  "_id": "<new-id>",
  "resourceId": "<resource _id>",
  "roleId": "1rl5e52e-6e27-4ac5-9471-2467d3fb7502",
  "name": {
    "en": "{DisplayName} | {segment} manager",
    "de": "{DisplayName} | {segment} manager"
  },
  "scopes": [
    "ai.agent_manage"
  ]
}
```

**`acViewerDb.json`** — one row when a `_read` scope exists. `roleId` is `1rl5e52e-6e27-4ac5-9471-2467d3fb7500`. `scopes` lists only the `_read` scope.

```json
{
  "_id": "<new-id>",
  "resourceId": "<resource _id>",
  "roleId": "1rl5e52e-6e27-4ac5-9471-2467d3fb7500",
  "name": {
    "en": "{DisplayName} | {segment} viewer",
    "de": "{DisplayName} | {segment} viewer"
  },
  "scopes": [
    "ai.agent_read"
  ]
}
```

**`groupsDb.json`** — append both new access-control ids to the groups whose `code` is `BO_MANAGER` and `BO_ADMIN`. Skip an id for a suffix the user did not ask for. Do not add them to other groups.

## Internal scopes — `tenant-automation/src/iam/emporix`

Same resource object in `resourcesDb.json` (`code` is the internal resource, such as `library.licence`).

**`permissionsDb.json`** — append the resource `_id` to the `read` and/or `manage` object's `applicableResources`, matching which suffixes exist.

**`accessControlsDb.json`** — one row per suffix, not one combined manager row:

| Suffix | roleId | name suffix |
|---|---|---|
| `_read` | `1rl5e52e-6e27-4ac5-0000-2467d3fb7570` | viewer |
| `_manage` | `1rl5e52e-6e27-4ac5-0000-2467d3fb7571` | editor |

```json
{
  "_id": "<new-id>",
  "resourceId": "<resource _id>",
  "roleId": "1rl5e52e-6e27-4ac5-0000-2467d3fb7570",
  "name": {
    "en": "{DisplayName} | {segment} viewer",
    "de": "{DisplayName} | {segment} viewer"
  }
}
```

Keep internal access controls in `src/iam/emporix/` only. Do not add them to `groupsDb.json`, `templatesDb.json`, `acManagerDb.json`, `acViewerDb.json`, or `acCustomerDb.json`. Do not copy unrelated rows from older commits (the COP-4603 diff also touched feature-toggle entries; leave those alone).

Validate each JSON file parses before committing. IAM edits and the Apigee developer-app edit from [apigee.md](apigee.md) share one `tenant-automation` branch and one PR.
