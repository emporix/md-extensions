---
name: emporix-service-create
description: >-
  Scaffold a new Emporix DCP Spring service from spring-service-template, then
  add Cloud Build triggers, certificates, the Helm chart, Argo CD apps, scopes,
  and Apigee (proxy, trigger, API product). Use when creating a new backend
  service, a new GitHub service repository, or /emporix-service-create.
disable-model-invocation: true
---

# Emporix Service Create

Scaffold one **DCP** Spring service and the platform repos that must know about it. Pattern matches partner-library (COP-4602, COP-4603).

Does not invent a business domain, Pub/Sub topics, or Postman tests. Does not merge. Does not run Rundeck.

## Arguments

Ask once if any of these are missing. Confirm the list with the user before `gh repo create` or any push.

- `{service}` — GitHub repo name, kebab-case (`^[a-z][a-z0-9]+(-[a-z0-9]+)*$`). Example: `partner-library`.
- `{issue_key}` — Jira key (`^[A-Z][A-Z0-9_]+-[0-9]+$`). Commit and PR titles must start with it.
- Scopes. Each entry is a scope string plus **standard** (tenant) or **internal** (Emporix-only). Example: `ai.agent_read` standard, `library.licence_read` internal. Every scope must end with `_read` or `_manage`.
- Display name (optional). Default: title-case the service name (`partner-library` → `Partner Library`).

Derived names:

| Name | Rule | Example |
|---|---|---|
| Package | drop hyphens | `com.emporix.partnerlibrary` |
| Java class | PascalCase of the service name | `PartnerLibrary` |
| Host | `{service}.k8s-{develop\|stage\|prod}.emporix.io` | |
| Image | `europe-docker.pkg.dev/tech-306612/dcp/{service}` | |

## Checkouts

Find the workspace root: a directory that contains `backend/spring-service-template`. Search ancestors of the current directory, then sibling folders, then `$HOME/workspace`.

Required folders (clone `git@github.com:emporix/<repo>.git` into the path when the folder is missing):

| Path | GitHub repo |
|---|---|
| `backend/spring-service-template` | `emporix/spring-service-template` |
| `backend/{service}` | created by this skill |
| `infrastructure/terraform` | `emporix/terraform` |
| `infrastructure/terraform-developers` | `emporix/terraform-developers` |
| `infrastructure/services-helm-charts` | `emporix/services-helm-charts` |
| `library/scopes` | `emporix/scopes` |
| `infrastructure/tenant-automation` | `emporix/tenant-automation` |
| `infrastructure/apigee-x-proxies` | `emporix/apigee-x-proxies` |
| `infrastructure/apigee-x-configuration` | `emporix/apigee-x-configuration` |

Stop if any existing checkout is dirty, or if `emporix/{service}` already exists, or if `backend/{service}` already exists.

`gh auth status` must succeed before creating the repo.

## Workflow

Copy this checklist and track it:

```
- [ ] Confirm service name, Jira key, and scopes
- [ ] Service repo pushed to master
- [ ] Cloud Build triggers (terraform-developers) and certificates (terraform)
- [ ] Helm chart and Argo CD apps
- [ ] Scopes library and tenant IAM
- [ ] Apigee proxy, trigger, API product, developer app
- [ ] One PR per existing repo
```

1. **Service repo.** Follow [references/service-repo.md](references/service-repo.md). Push `master`. This repo does not get a PR.

2. **Terraform.** Follow [references/terraform.md](references/terraform.md). The Cloud Build triggers go to `terraform-developers`; the certificates go to `terraform`.

3. **Helm and Argo CD.** Follow [references/helm.md](references/helm.md). Image tags are the new repo's initial commit SHA.

4. **Scopes.** Follow [references/scopes.md](references/scopes.md).

5. **Apigee.** Follow [references/apigee.md](references/apigee.md). The proxy's Cloud Build trigger is in `terraform-developers` (`apigee-x/proxies.tf`) and ships in that repo's single PR together with the service triggers from step 2. The developer-app edit is in `tenant-automation` and ships in that repo's single PR together with the IAM edits from step 4.

6. **PRs.** In each existing repo, branch `{issue_key}-add-{service}` from the remote default branch. One PR per repo, against that default branch. Do not merge.

`apigee-x-proxies` is the exception. Its default branch is `prod`. Branch from `prod`, then open two pull requests from that branch: one into `prod` with `[prod]` at the end of the title, and one into `stage` with `[stage]` at the end of the title.

Repos that get a PR: `terraform`, `terraform-developers`, `services-helm-charts`, `scopes`, `tenant-automation`, `apigee-x-proxies` (two), `apigee-x-configuration`.

## Commits

Commit as the GitHub token owner, never as Cursor or an agent. Do not change `git config`.

Resolve `git-commit-as-user.sh` from the sibling `emporix-feature` skill (`skill_script emporix-feature git-commit-as-user.sh`, or `.agents/skills/emporix-feature/scripts/git-commit-as-user.sh`). Stage the intended files, then run it from that repo. The message must start with `{issue_key}`.

Do not `--no-verify`. Do not commit unrelated dirty files.

## Report

```
Service: emporix/{service} (master, <sha>)
PR terraform: <url>
PR terraform-developers: <url>
PR helm: <url>
PR scopes: <url>
PR tenant-automation: <url>
PR apigee-x-proxies [prod]: <url>
PR apigee-x-proxies [stage]: <url>
PR apigee-x-configuration: <url>
Manual: run the Rundeck scripts for existing tenants after the tenant-automation and Apigee changes are merged.
```

The container image does not exist until the first Cloud Build on `master` finishes. Argo CD will be out of sync until then.
