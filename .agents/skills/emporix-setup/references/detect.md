# Detection (setup step 1)

Everything here reads manifests, config files, CI, top-level directories, and
git metadata. It does not read application source; that is the knowledge scan
in `project-knowledge.md`. Record the evidence path next to every value — the
`AGENTS.md` template needs it.

## Default branch

`git symbolic-ref refs/remotes/origin/HEAD`, then
`git rev-parse --abbrev-ref origin/HEAD`. Config stays `"auto"`; detection is
only to sanity-check the repo has a remote.

## Jira project key

```bash
{ git log --format=%s%n%b -n 500 2>/dev/null; git branch -a --format='%(refname:short)' 2>/dev/null; } \
  | grep -oE '\b[A-Z][A-Z0-9]{1,9}-[0-9]+\b' | sed 's/-[0-9]*$//' | sort | uniq -c | sort -rn | head -5
```

- One clear winner (≥ 2× the runner-up, or the only key) → use it.
- Two or more keys close in frequency → ask (default mode too).
- No key → write `COP` and flag it in the report.

Ignore obvious non-Jira tokens such as `UTF-8`, `SHA-256`, `ISO-8601`, `HTTP-2`.

## Runner and validation commands

First matching manifest wins; prefer commands that already appear in
`.github/workflows/*` (or other CI config) over ones that merely exist.

| Manifest | Runner | Candidate commands (in this order) |
|---|---|---|
| `package.json` | `pnpm-lock.yaml` → `pnpm`; `package-lock.json` → `npm run`; `yarn.lock` → `yarn`; `bun.lockb` → `bun run` | scripts named `typecheck`, `lint`, `test`, `build` and close variants (`test:unit`, `lint:ci`, `check`) |
| `Makefile` | `make` | targets `lint`, `test`, `build` |
| `pom.xml` | `./mvnw` if present else `mvn` | `verify` (or `test` when `verify` is not used in CI) |
| `build.gradle*` | `./gradlew` if present else `gradle` | `check` (or `test`) |
| `Cargo.toml` | `cargo` | `clippy -- -D warnings`, `test` |
| `go.mod` | `go` | `vet ./...`, `test ./...` |
| `pyproject.toml` / `setup.cfg` | from tool config (`poetry run`, `uv run`, plain) | `ruff check .` / `flake8`, `mypy`, `pytest` |
| `composer.json` | `composer` | scripts `lint`, `test` |

Monorepos (`apps/`, `packages/`, `services/`): prefer a root-level script that
fans out (`turbo run test`, `pnpm -r test`, `nx run-many`). Do not list every
package's command.

Nothing found → `validation.commands: []` and a report line.

## Toolchain versions

Only from files that pin them: `.nvmrc`, `.node-version`, `engines` in
`package.json`, `.java-version`, `.sdkmanrc`, `gradle/wrapper/gradle-wrapper.properties`,
`rust-toolchain*`, `go.mod` `go` line, `.python-version`, `pyproject` `requires-python`.
No pin → `unknown`.

## Frameworks and infrastructure

Direct dependencies only (not transitive):

- Backend: Spring Boot, Quarkus, Micronaut, NestJS, Express, Fastify, FastAPI, Django, Flask, Gin, Echo, Actix, Axum.
- Frontend: React, Vue, Angular, Svelte, Next, Nuxt, Vite, module-federation.
- Persistence: JPA/Hibernate, MongoDB, PostgreSQL/MySQL drivers, Prisma, TypeORM, Mongoose, SQLAlchemy, Flyway, Liquibase, migration folders.
- Messaging: Kafka, RabbitMQ, SQS/SNS, Pub/Sub, NATS.
- API: OpenAPI/Swagger/springdoc files or plugins, GraphQL schema files, protobuf, AsyncAPI.
- Runtime: `Dockerfile*`, `docker-compose*`, `helm/`, `k8s/`, `terraform/`, `serverless.yml`.

Record the dependency name, version when the manifest pins it, and the manifest path.

## Style authorities

Formatter/linter/compiler/instruction files at the root (and one level into
packages): `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/`,
`CONTRIBUTING.md`, `STYLEGUIDE.md`, `.editorconfig`, Prettier, ESLint, Biome,
`tsconfig*`, Checkstyle, Spotless, PMD, ktlint, detekt, Ruff, Black, mypy,
`.golangci.yml`, `rustfmt.toml`, `clippy.toml`. Record the path and what it
governs. A tool name without its config path is not evidence.

## Tests

Test configs and plugins (Jest, Vitest, Playwright, Cypress, JUnit/Surefire/
Failsafe, Testcontainers, pytest, Go test, cargo test) plus top-level or
one-level test directories. Distinguish unit, integration, contract, and
end-to-end when the repo does. Record runner, location pattern, fixtures or
required services, and the exact command.

## CI

Workflow file names and their command-bearing steps. Do not copy whole files.
Note which steps gate a PR; those commands are the strongest candidates for
`validation.commands`.

## Layout

Top-level directories, and one level into `apps/`, `packages/`, `services/`,
`libs/`, `modules/`, `src/main/java/<group>/` (package roots). Each gets one
line: path, responsibility (from its README title or manifest description, or
`unknown`), notable entry point.
