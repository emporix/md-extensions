# Patterns

## Memory and autoscaling

Service `application.yml`:

```yaml
micronaut:
  security:
    tenant-validator:
      excluded-paths:
        - "/memory-health/liveness"
        - "/memory-health/readiness"
        - "/memory-health/debug"
emporix:
  memory-health:
    enabled: true
    threshold: ${HEAP_OVERLOAD_THRESHOLD:90}
    pubsub-pause-enabled: ${PUBSUB_PAUSE_ENABLED:true}
    pubsub-resume-threshold: ${PUBSUB_RESUME_THRESHOLD:75}
    debug-enabled: ${MEMORY_HEALTH_DEBUG:false}
```

`pubsub-resume-threshold` must stay below `threshold`.

Helm base values:

```yaml
autoscaling:
  prometheusMetric:
    name: "prometheus.googleapis.com|jvm_memory_heap_after_gc_usage_percent_broadcast_max|gauge"
    targetAverageValue: 75
  behavior:
    scaleUpStabilizationSeconds: 0
    scaleDownStabilizationSeconds: 300
gkeManagedPrometheus:
  monitoring:
    enabled: true
containers:
  readinessProbe:
    path: /memory-health/readiness
    failureThreshold: 2
  env:
    heapOverloadThreshold: "90"
    memoryHealthDebug: false
```

Keep the existing liveness path and startup probe path. Wire the env vars only when set:

```yaml
- name: HEAP_OVERLOAD_THRESHOLD
  value: {{ .Values.containers.env.heapOverloadThreshold | quote }}
- name: MEMORY_HEALTH_DEBUG
  value: "true"
```

`MEMORY_HEALTH_DEBUG` is conditional. Leave it false outside develop.

Replace `templates/hpa.yaml` so it renders `behavior` and the optional Prometheus Pods metric before the CPU metric. Leave `targetMemoryUtilizationPercentage` unset.

PodMonitoring selector uses `.helm-chart.selectorLabels`, not the full name.

`templates/rules.yaml`, gated by `gkeManagedPrometheus.monitoring.enabled`:

```yaml
- record: jvm_memory_heap_after_gc_usage_percent_broadcast_max
  expr: |
    max by (namespace, application) (
      jvm_memory_heap_after_gc_usage_percent{application="{service}"}
    )
    * on (namespace, application) group_right()
    group by (namespace, application, pod) (
      jvm_memory_heap_after_gc_usage_percent{application="{service}"}
    )
```

Keep environment replica bounds and CPU targets. Do not copy another service's memory limit or Java options.

## Publisher shutdown

`application.yml`:

```yaml
micronaut:
  executors:
    publishing-executor:
      type: scheduled
      core-pool-size: 4
gcp:
  pubsub:
    publishing-executor: publishing-executor
```

Replace the default executor so graceful shutdown does not stop it early, and replace `DefaultPublisherFactory` with a constructor dependency on `@Named("publishing-executor")`. The factory still delegates creation to `new DefaultPublisherFactory(channelProvider, credentialsProvider, beanContext)`. Micronaut closes that factory before destroying the executor because the executor is a constructor argument. Do not drop the argument.

Leave `subscription-executor` and subscriber factories unchanged.

Tests must show:

- the publishing executor is not `GracefulShutdownCapable` and can run a task until bean destruction
- the replaced `DefaultPublisherFactory` constructor requires `ScheduledExecutorService` named `publishing-executor`
- during graceful shutdown, a task submitted to `publishing-executor` still completes
- `PubSubClientIntroductionAdvice` and `DefaultPublisherFactory` are destroyed while that executor is still running
- the executor is shut down after the application context stops

Adapt the assertions to the service's existing shutdown test. Do not import another service's probe or publisher types.
