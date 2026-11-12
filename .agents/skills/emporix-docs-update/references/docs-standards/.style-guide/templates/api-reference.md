---
description: >-
  Use this OpenAPI starter when creating a new API reference in the
  api-references repository.
icon: file-code
---

# API Reference

Use this template when adding a new service API reference (OpenAPI `.yml`) in the [emporix/api-references](https://github.com/emporix/api-references) repository.

* Authoring rules: [API References](../writing-standards/api-references.md)
* Starter file: [api.yml](api.yml)

Copy `api.yml` into your service's `api-reference/` folder, and replace the Product Service placeholders with the real service name, paths, schemas, scopes, and examples.

{% hint style="info" %}
Leave `info.version` empty. Declare scopes on `security` / `securitySchemes` only — do not duplicate them in endpoint descriptions.
{% endhint %}
