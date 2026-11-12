# Service repository

Copy `backend/spring-service-template` into `backend/{service}` without `.git`, `.gradle`, or `build/`.

## Rename

Replace every `com.emporix.template` with `com.emporix.{package}` in Java, Groovy, and `build.gradle`. Move the source directories to match:

- `src/main/java/com/emporix/template` → `src/main/java/com/emporix/{package}`
- `src/intTest/java/com/emporix/template` → `src/intTest/java/com/emporix/{package}`
- `src/intTest/groovy/com/emporix/template` → `src/intTest/groovy/com/emporix/{package}`

`{package}` is the service name with hyphens removed (`partner-library` → `partnerlibrary`).

Also set:

| File | Change |
|---|---|
| `settings.gradle` | `rootProject.name="{service}"` |
| `build.gradle` | `group = "com.emporix.{package}"` |
| `src/main/resources/application.yml` | default `APP_NAME` and `MONGODB_DATABASE` from `spring-service-template` to `{service}` (`service.name` is `emporix.${APP_NAME:{service}}`) |
| `src/main/resources/logback.xml` | `customFields` application value to `{service}` |
| `README.md` | title `# {service}`. Replace the "Required setup for Partner Library" heading with the display name. Leave the newspaper cleanup checklist. |

Search the new tree for `spring-service-template`, `service-template`, and `com.emporix.template`. The only remaining hits should be the README note that this was copied from the template.

## Keep the newspaper sample

Do not delete or rename the `newspaper` endpoint, model, repository, Pub/Sub topic, or Spock spec. Do not add a guessed domain. The sample is what makes the copied project build.

## Local agent state

Keep the template line `/.ai` in `.gitignore`. Do not change it to `.ai/`: that pattern ignores a directory and misses a worktree symlink. Do not create or commit `.ai`. Setup writes that directory later on the primary checkout.

## Publish

```bash
git init -b master
# stage, then git-commit-as-user.sh "{issue_key} create {service} from spring-service-template"
gh repo create emporix/{service} --private --source=. --remote=origin --push
```

Do not `git add` `.ai` or anything under it.

Stop if `gh repo view emporix/{service}` already succeeds. Record the commit SHA; Helm image tags use it.
