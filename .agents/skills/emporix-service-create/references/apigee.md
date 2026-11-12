# Apigee

## Proxy — `apigee-x-proxies`

Copy `templates/template-proxy` to `proxies/{service}`.

- Rename `apiproxy/template-proxy.xml` to `apiproxy/{service}.xml`.
- Replace `__proxy_name__` with `{service}` in `pom.xml`, `{service}.xml`, `proxies/default.xml`, and `targets/k8s-*.xml`.
- The template base path is `/__proxy_name___basepath`. A plain replace leaves `/{service}_basepath`. Set both `<Basepaths>` and `<BasePath>` to `/{service}`.
- Target URL in each env file: `https://{service}.k8s-{develop|stage|prod}.emporix.io`.

Add auth the way `proxies/partner-library` does. Copy `proxies/partner-library/apiproxy/policies/sharedAuthWithIdp.xml` unchanged (it only calls the shared flow).

In `{service}.xml`, inside `<Policies>`:

```xml
<Policy>sharedAuthWithIdp</Policy>
```

In `proxies/default.xml` PreFlow request:

```xml
<Request>
    <Step>
        <Name>sharedAuthWithIdp</Name>
    </Step>
</Request>
```

`pom.xml` `artifactId` and `name` are `{service}`. `relativePath` stays `../parent-proxies-pom.xml`.

Branch `{issue_key}-add-{service}` from `prod`. That repo's default branch is `prod`. Open two pull requests from that same branch:

| Base | Title suffix |
|---|---|
| `prod` | `[prod]` |
| `stage` | `[stage]` |

Example titles: `{issue_key} add {service} proxy [prod]` and `{issue_key} add {service} proxy [stage]`.

## Cloud Build trigger — `terraform-developers`

The proxy deploy triggers live in the `apigee-x/` root of `terraform-developers`. This edit goes on the same branch and PR as the Cloud Build triggers in [terraform.md](terraform.md).

Append to `apigee-x/proxies.tf`, copied from `module "proxy-partner-library"`:

```hcl
module "proxy-{service}" {
  source          = "./modules/cloud-build/proxy"
  proxy-name      = "{service}"
  project_id      = var.project_id
  github_token    = var.github_token
  service_account = local.apigee_cicd_sa_email
  log_bucket_name = local.deploy_logs_bucket_name
}
```

If the live partner-library module has extra arguments, copy that live block and change the module name and `proxy-name`. Do not edit `apigee-x/modules/`, `apigee-x/locals.tf`, or `environments/apigee.tfvars`.

The module creates `proxy-{service}-deploy-trigger-{env}` for `dev` (manual), `stage` and `prod` (push to the branch of the same name in `apigee-x-proxies` that changes `proxies/{service}/**`). A merge to `master` in `terraform-developers` creates them. Merge that PR before the `apigee-x-proxies` PRs, so the triggers exist when the proxy reaches `stage` and `prod`. State this in the `terraform-developers` PR and in both `apigee-x-proxies` PRs.

## API product — `apigee-x-configuration`

Append an object to `configuration/org/apiProducts.json`. `scopes` lists **standard** scopes only, in the order the user gave them. Omit internal scopes.

```json
{
  "apiResources": [],
  "approvalType": "auto",
  "attributes": [
    {
      "name": "access",
      "value": "private"
    }
  ],
  "description": "",
  "displayName": "{DisplayName}",
  "name": "{service}",
  "proxies": [
    "{service}"
  ],
  "scopes": [
    "library.component_read",
    "library.component_manage"
  ],
  "environments": [
    "dev",
    "stage",
    "prod"
  ]
}
```

The example scope order above is illustrative. Use the user's standard scopes. Keep the file valid JSON.

## Developer app — `tenant-automation`

In `src/apigee/api/apigee_x_api.py`, inside `create_app` for `AppType.DEVELOPER`, append `"{service}"` to the `apiProducts` list. That is the list that already contains `"partner-library"`. Do not add it to the storefront app.

This edit ships on the same branch and PR as the IAM changes in [scopes.md](scopes.md).
