# Terraform

Two repos:

- `infrastructure/terraform-developers` — the service's Cloud Build triggers (`gcp/`), and the Apigee proxy's deploy triggers (`apigee-x/`, see [apigee.md](apigee.md)). Both in one PR.
- `infrastructure/terraform` — the certificates.

## `terraform-developers`: `gcp/dcp-cicd-triggers.tf`

Duplicate the `partner-library-cicd-triggers` module. Change only the module name (`{service}-cicd-triggers`, hyphens allowed) and `service_name`. If the live `partner-library-cicd-triggers` block has drifted from the one below, copy the live block.

One block, applied to develop, stage and prod.

```hcl
module "{service}-cicd-triggers" {
  source            = "./modules/cloud-build/cicd/gradle"
  service_name      = "{service}"
  emporix_product   = "dcp"
  stage_project_id  = local.cicd_stage_project_id
  environment       = var.environment
  gcp_region        = var.gcp_region
  argo_cluster_name = local.gke_cluster_name
  argocd_token      = var.argocd_token["dcp"]
  kms_key_name      = local.kms_crypto_key_id
  cache_bucket_name = local.cache_bucket_name
  registry_url      = var.docker_registry_urls["dcp"]
  gradle_image      = "8.9.0-jdk-21-and-22"
  build_args        = ["-Djib.from.image=gradle:8.9.0-jdk-21-and-22"]
  github_user       = var.github_user
  github_token      = var.github_token
  sonarqube_token   = var.sonarqube_token
  sonarqube_host    = var.sonarqube_host
  tests_config      = {
    report_bucket      = local.test_reports_bucket_name
    repository         = "automation-postman-CE"
    tenant             = "smoketeststage"
    credentials_secret = "projects/14413598334/secrets/tests_tenants_secrets/versions/latest"
  }
}
```

Omit `command`, even when a neighboring module sets one. The Cloud Build module then runs `./run_tests.sh`. Do not set `./run_all_tests.sh`.

Do not edit `gcp/modules/`, `environments/`, or `gcp/locals.tf`. A DCP service needs none of them, and `modules/` and `environments/` need DevOps review.

A merge to `master` in `terraform-developers` applies to develop, stage and prod at once. The trigger deploys through the Argo CD application `{service}`, so state in the PR description that the `services-helm-charts` PR must be merged first.

## `terraform`: certificates

Append one DNS name to each file:

- `kubernetes/cert-manager/certificate-develop-2.yaml` → `{service}.k8s-develop.emporix.io`
- `kubernetes/cert-manager/certificate-stage-2.yaml` → `{service}.k8s-stage.emporix.io`
- `kubernetes/cert-manager/certificate-prod-2.yaml` → `{service}.k8s-prod.emporix.io`

Add the line under `spec.dnsNames`, next to the other service hostnames. Do not edit `certificate-develop.yaml`, `certificate-stage.yaml`, or `certificate-prod.yaml`. Those certificates use secret `k8s-cert`. New hosts belong on the `-2` certificates (secret `k8s-cert-2`).
