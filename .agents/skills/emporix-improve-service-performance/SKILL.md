---
name: emporix-improve-service-performance
description: >-
  Improve performance and resilience of an existing Emporix backend service and
  its Helm chart. Detects Micronaut versus Spring from the project and applies
  the matching path. Micronaut heap/HPA and Pub/Sub publisher shutdown are
  supported today; Spring is reserved for a later release. Use when improving
  service performance, heap autoscaling, memory readiness, or in-flight Pub/Sub
  during restart, or for /emporix-improve-service-performance.
disable-model-invocation: true
---

# Emporix service performance

Apply proven performance changes to one existing Emporix service and its Helm chart. Follow [references/patterns.md](references/patterns.md). Do not copy another service's replica counts, memory sizes, Java options, topics, or grace period.

Does not commit, push, or open a PR. Does not merge.

## Arguments

Ask once if either is missing.

- `{service}` — checkout directory and Helm chart name.
- `{issue_key}` — Jira key. Branch names and later commit titles start with it.

## Safety

Stay on the current ticket branch or worktree. `git status` first. Unrelated dirty files → stop.

## Stack detection

Read `build.gradle` (or `pom.xml` if Gradle is absent) in `{service}`:

- **Micronaut** when the build declares `io.micronaut` plugins or dependencies, or `com.emporix:api-micronaut-haelper`.
- **Spring** when the build declares `org.springframework.boot`.

If both appear, ask which stack to treat as authoritative. If neither appears, stop and report that the service type is unknown. Do not guess.

**Spring path:** stop after detection. Report that the Spring performance path is not implemented yet. Do not apply Micronaut configuration or dependencies to a Spring service.

**Micronaut path:** continue below. Run each track only when its precondition matches. Skip the other track and say why.

## Workflow (Micronaut)

```
- [ ] Confirm service, issue key, and stack Micronaut
- [ ] Memory and autoscaling
- [ ] Pub/Sub publisher shutdown
- [ ] Tests and rendered Helm
- [ ] Report
```

1. **Memory and autoscaling.** Run when the build file from stack detection (`build.gradle` or `pom.xml`) already depends on `com.emporix:api-micronaut-haelper`, or the user asked for this track on a Micronaut service. Upgrade an existing helper dependency to `3.5.0`. Add `3.5.0` only on the Micronaut path.

   Configure heap-after-GC readiness at `90`, resume at `75`, and the Helm readiness probe. Add the managed-Prometheus recording rule and HPA metric at `75`, with scale-up stabilization `0` and scale-down stabilization `300`. Keep each environment's replica bounds and CPU target.

2. **Pub/Sub publisher shutdown.** Run when the service publishes with `DefaultPublisherFactory` or a replaced publisher factory. Add `publishing-executor` and make the publisher factory depend on it, using the pattern from schema pull request 158. Leave subscriber pulls on `subscription-executor`. Do not change Helm `preStop`, the shutdown grace period, event topics, payloads, or publisher interfaces.

3. **Verify.** Run the new focused tests, then the service's existing unit and integration test commands. Render develop, stage, and prod:

   ```bash
   helm template {service} dcp/{service} -f dcp/{service}/values.yaml -f dcp/{service}/values-{env}.yaml
   ```

   Check readiness, environment variables, HPA behavior, the heap metric, PodMonitoring, and the recording rule. When memory request equals limit, the HPA must not use a memory resource target.

4. **Report.** List changed files, commands and results, skipped tracks, and anything still service-specific. Rollout order is helper `3.5.0` available, then the service image, then the Helm chart. The readiness probe must not point at the new endpoint before that image is deployed.
