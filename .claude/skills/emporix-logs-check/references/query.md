# Log query

Read this before resolving services and before building the filter.

## What a log line is

Application logs are JSON with MDC in `jsonPayload`: `message`, `logger`, `application`, and `stack_trace`. `textPayload` is the plain line, such as startup stderr.

`resource.labels.container_name` is the Kubernetes container (`product-v2`). `jsonPayload.application` is a different string for the same service (`product-service`). A repo folder often matches the application name, not the container.

## Which services

Resolve every service they named. There is no cap. Do not keep a service catalog.

1. Names in the prompt. Container `product-v2` and application `product-service` are the same service. Use the container name in the filter. Several names mean several services.
2. Folders and files already open in the workspace. Treat those repo names as the candidate services. If a service repo is open, read the application container's `spec.template.spec.containers[].name` from its Deployment. When that name is a Helm template, resolve it from the chart templates and values. Use that value as the Cloud Logging label `resource.labels.container_name`. Do not look for a Kubernetes field named `container_name`.
3. If the prompt names nothing and exactly one service repo is open, use that repo. If they ask for the open services, check every open service repo. If more than one is open and they did not say which, ask and offer the open repos. They can pick any number. If a name does not match an open repo or a container, ask.

## Filter clause

Add one clause when they give a phrase, or when you can see one in the service code. Keep the container name and the time window.

| What you have | Clause |
| --- | --- |
| Message text | `(jsonPayload.message:"phrase" OR textPayload:"phrase")` |
| Logger class | `jsonPayload.logger="fully.qualified.Class"` |
| Application name | `jsonPayload.application="name"` |
| Any other MDC field | `jsonPayload.FIELD:"phrase"` or `jsonPayload.FIELD="value"` |

A message search covers both JSON application logs and plain `textPayload` lines. A logger, application, or other MDC search stays on `jsonPayload` only. Use `:` for a substring and `=` for an exact value.

## What to report

For JSON, use `message`, `logger`, `application`, and the first exception line in `stack_trace`. Group repeated errors by logger and exception. Quote the message and the exception line. Omit the New Relic linking suffix and the rest of the stack unless they ask for it.

If nothing matches, say so and retry **once** without the `severity>=ERROR` line, same window, container, and phrase. Keep the same phrase clause on that retry: both payloads for a message search, `jsonPayload` only for an MDC field.
