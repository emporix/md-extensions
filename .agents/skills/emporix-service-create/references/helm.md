# Helm chart and Argo CD

Repo: `infrastructure/services-helm-charts`.

## Chart

Copy `dcp/partner-library` to `dcp/{service}`. Then remove partner-library-only settings. Do not copy AI, automation, COP backend, IAM, media, schema, sales email, prohibited tenants, task inbox, Emporix MD, or OE event env.

`Chart.yaml`:

```yaml
apiVersion: v2
name: {service}
description: A Helm chart for {DisplayName} Service
type: application
version: 0.1.0
appVersion: 1.16.0
```

`values.yaml` image and ingress:

```yaml
image:
  repository: "europe-docker.pkg.dev/tech-306612/dcp/{service}"

ingress:
  tlsSecretName: k8s-cert-2
  internalHost: {service}.emporix.svc.cluster.local
```

`values.yaml` `containers.env` after the strip. Keep graceful shutdown and the starter resource sizes from the copy, then replace probes and autoscaling with the blocks below.

```yaml
containers:
  env:
    logLevel: info
    javaOpts: "-XX:+UseContainerSupport -XX:InitialRAMPercentage=20 -XX:MaxRAMPercentage=40 -XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=40 -XX:+UseStringDeduplication -XX:+ParallelRefProcEnabled -XX:G1PeriodicGCInterval=15000 -XX:NativeMemoryTracking=summary -XX:+ExitOnOutOfMemoryError"
```

`values.yaml` autoscaling. Leave `targetMemoryUtilizationPercentage` unset: memory request equals the limit, so a memory utilization target stays high and does not scale the service.

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 2
  targetCPUUtilizationPercentage: 70
  prometheusMetric:
    name: null
  behavior:
    scaleUpStabilizationSeconds: 0
    scaleDownStabilizationSeconds: 300
```

Replace `templates/hpa.yaml` with this template. Leave `prometheusMetric.name` null so the chart renders only the CPU metric.

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include ".helm-chart.fullname" . }}
  labels:
    {{- include ".helm-chart.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include ".helm-chart.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  {{- with .Values.autoscaling.behavior }}
  behavior:
    scaleUp:
      stabilizationWindowSeconds: {{ .scaleUpStabilizationSeconds }}
      selectPolicy: Max
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: {{ .scaleDownStabilizationSeconds }}
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
  {{- end }}
  metrics:
  {{- if .Values.autoscaling.prometheusMetric.name }}
    - type: Pods
      pods:
        metric:
          name: {{ .Values.autoscaling.prometheusMetric.name }}
        target:
          type: AverageValue
          averageValue: {{ .Values.autoscaling.prometheusMetric.targetAverageValue }}
  {{- end }}
  {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
  {{- end }}
  {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
  {{- end }}
{{- end }}
```

In `templates/deployment.yaml`, keep liveness on `/health/liveness`. Set readiness `failureThreshold: 2` and add a startup probe on `/health/readiness`:

```yaml
readinessProbe:
  httpGet:
    path: /health/readiness
    port: http
  initialDelaySeconds: {{ .Values.containers.probe.initialDelaySeconds }}
  periodSeconds: {{ .Values.containers.probe.periodSeconds }}
  failureThreshold: 2
startupProbe:
  httpGet:
    path: /health/readiness
    port: http
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 18
```

Leave out `configurationUrl`, `emailUrl`, and `featureToggleUrl`. Add a service URL only when the new service calls that dependency.

`templates/deployment.yaml` env block. Keep `MONGODB_URI` on secret `mongo-credentials` / key `MONGO_DB_URI`. Delete every other env var and secret ref.

```yaml
env:
  - name: APP_NAME
    value: {{ .Chart.Name }}
  - name: JAVA_TOOL_OPTIONS
    value: {{ .Values.containers.env.javaOpts | quote }}
  - name: MONGODB_DATABASE
    value: {{ .Chart.Name }}
  - name: MONGODB_URI
    valueFrom:
      secretKeyRef:
        key: MONGO_DB_URI
        name: mongo-credentials
  - name: LOG_LEVEL
    value: {{ .Values.containers.env.logLevel }}
```

Environment values files. Drop partner-library env overrides (`emporixTenant`, `prohibitedTenants`, `emporixMdUrl`, `emporixSalesEmail`, `enableTaskInboxNotifications`).

`values-develop.yaml` and `values-stage.yaml`:

```yaml
replicaCount: 1

ingress:
  enabled: true
  host: {service}.k8s-develop.emporix.io

resources:
  limits:
    memory: 2000Mi
  requests:
    cpu: 100m
    memory: 2000Mi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 2
  targetCPUUtilizationPercentage: 70
```

Use `k8s-stage` in `values-stage.yaml`, with `maxReplicas: 3`. Both files keep the base `javaOpts` (`InitialRAMPercentage=20`, `MaxRAMPercentage=40`). Memory request stays equal to the memory limit.

`values-prod.yaml`:

```yaml
replicaCount: 3

ingress:
  enabled: true
  host: {service}.k8s-prod.emporix.io

resources:
  limits:
    memory: 2400Mi
  requests:
    cpu: 400m
    memory: 2400Mi

containers:
  env:
    javaOpts: "-XX:+UseContainerSupport -XX:InitialRAMPercentage=40 -XX:MaxRAMPercentage=60 -XX:+UseG1GC -XX:InitiatingHeapOccupancyPercent=40 -XX:+UseStringDeduplication -XX:+ParallelRefProcEnabled -XX:G1PeriodicGCInterval=15000 -XX:NativeMemoryTracking=summary -XX:+ExitOnOutOfMemoryError"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 3
  targetCPUUtilizationPercentage: 70
```

`image-develop.yaml`, `image-stage.yaml`, and `image-prod.yaml`:

```yaml
image:
  tag: <initial commit SHA of emporix/{service}>
```

Search `dcp/{service}` for `partner-library` and remove any leftover.

## Argo CD

Add `argocd_apps/dcp/{develop,stage,prod}/{service}.yaml`, copied from `argocd_apps/dcp/develop/tenant-secret-manager.yaml` (automated sync). One file per environment. `valueFiles` use that environment's values and image file.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: {service}
  namespace: argocd
  annotations:
    argocd.argoproj.io/manifest-generate-paths: /dcp/{service}
spec:
  destination:
    namespace: emporix
    server: https://kubernetes.default.svc
  project: dcp
  source:
    helm:
      releaseName: {service}
      valueFiles:
      - values-develop.yaml
      - image-develop.yaml
    path: dcp/{service}
    repoURL: https://github.com/emporix/services-helm-charts.git
    targetRevision: HEAD
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

`stage` uses `values-stage.yaml` and `image-stage.yaml`. `prod` uses `values-prod.yaml` and `image-prod.yaml`.
