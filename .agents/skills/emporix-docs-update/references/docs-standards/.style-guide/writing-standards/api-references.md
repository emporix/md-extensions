---
description: >-
  Use these instructions when authoring OpenAPI API reference specifications
  in the api-references repository.
icon: code
---

# API References

API documentation is published in the Emporix GitBook API Documentation space.

All API references, tutorials, and the changelog live in the public [emporix/api-references](https://github.com/emporix/api-references) repository.

API references follow the OpenAPI standard and are stored as `.yml` files.

For a copy-paste starter file, see [API Reference template](../templates/api-reference.md).

## Creating a new service

1. Create a new folder for the service in the `api-references` repository.
2. Add a `.yml` file in OpenAPI format.
3. Add the folder to the table of contents in `SUMMARY.md`.

Example:

```
* [SEPA Export Service](orders/sepa-export/README.md)
  * [API Reference](orders/sepa-export/api-reference/README.md)
```

## Required OpenAPI sections

Each API reference must include:

* `openapi` set to `3.0.0`
* `info`
* `servers`
* `paths`
* `components`
* `security`

### info

Basic information about the service: name, version, and description.

```yaml
info:
  title: Price Service
  version: ''
  description: 'The Emporix API Price Service allows you to manage your products'' prices.'
  contact:
    name: Emporix
    url: 'https://www.emporix.com/contact-us'
```

Leave `version` empty. Do not indicate versions in the API reference `info` block for now.

### servers

The service base URL:

```yaml
servers:
  - url: 'https://api.emporix.io'
```

Do not end the server URL with `/`. Path keys start with `/`, so a trailing slash on the server URL can produce `//` in combined URLs.

### paths

Path keys are appended to the server URL. Include the service prefix in the path (for example `price`), and always start the key with `/`.

```yaml
paths:
  '/price/{tenant}/prices':
    get: ...
    post: ...
  '/price/{tenant}/prices/{priceId}': ...
  '/price/{tenant}/priceModels': ...
  '/price/{tenant}/priceModels/{priceModelId}': ...
```

### securitySchemes

Authorization used across the service, including scopes and their descriptions:

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        clientCredentials:
          tokenUrl: 'https://api.emporix.io/oauth/token'
          scopes:
            price.price_manage: Needed to manage prices.
            price.pricemodel_manage: Needed to manage price models.
            price.pricemodel_read: Needed to retrieve price models.
```

Root-level authorization applicable to all services:

```yaml
security:
  - OAuth2: []
```

## Endpoint definitions

Each endpoint must include:

* `summary`
* `operationId`
* `description`
* `parameters`
* `security`
* `requestBody` (if applicable)
* `responses`

Optional: `tags` to group endpoints in complex services.

### summary

Write summaries in gerund form (verb ending in *-ing*):

```yaml
paths:
  '/price/{tenant}/prices':
    post:
      summary: Creating a new price
    get:
      summary: Retrieving all prices
    delete:
      summary: Deleting all prices
```

### description

Describe what the endpoint does in singular, third-person form.

Do **not** duplicate required scopes in the description. GitBook displays scopes from the `security` attribute.

```yaml
paths:
  '/price/{tenant}/prices':
    get:
      summary: Retrieving all prices
      description: |-
        Retrieves all prices assigned to the tenant. You can filter the results with query parameters.
      security:
        - OAuth2:
            - price.price_read
```

### parameters

List all path, header, and query parameters for the endpoint, with descriptions.

```yaml
paths:
  '/price/{tenant}/prices/{priceId}':
    get:
      parameters:
        - schema:
            type: boolean
            default: false
          in: query
          name: extendWithPriceModel
          description: |
            If set to `true`, the response will also include the price model's details.
        - $ref: '#/components/parameters/path_tenant'
```

### security

Declare the security method and required scopes on the endpoint.

If a scope is not required (or only required under certain conditions), do not list it under `security`. Explain conditional cases in the endpoint description instead.

When no specific scopes are required:

```yaml
security: []
```

When scopes are required:

```yaml
paths:
  '/price/{tenant}/prices':
    post:
      summary: Creating a new price
      security:
        - OAuth2:
            - price.price_manage
```

### requestBody

Provide schemas and meaningful examples. Use realistic values instead of placeholders like `test` or `1111`.

Describe every field in schemas. Mark required fields as such.

```yaml
paths:
  '/price/{tenant}/prices':
    post:
      summary: Creating a new price
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/createPriceV1'
                - $ref: '#/components/schemas/createPriceV2'
            examples:
              Request example (v1):
                $ref: '#/components/examples/createPriceV1'
              Tiered/volume price (v2):
                value:
                  id: 6245aa0a78a8576e338fa9c4
                  itemId:
                    itemType: PRODUCT
                    id: 5f5a3a365bac380024b93c45
                  currency: EUR
                  location:
                    countryCode: DE
                  priceModelId: 6245a8f578a8576e338fa9c3
                  tierValues:
                    - priceValue: '15.99'
                    - priceValue: '14.99'
```

Schemas and examples can also live under `components`.

### responses

Include examples of successful responses and errors. Error examples should describe what caused the failure so users can troubleshoot.

Reuse common `$ref` responses where possible (`401`, `403`, `500`).

```yaml
responses:
  '201':
    description: The request was successful. The price has been created.
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/resourceId'
        examples:
          Response example:
            value:
              id: 53ac81fd0cce8b26b36f3492
  '400':
    description: Bad Request
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/errorMessage'
        examples:
          Validation error:
            value:
              status: 400
              type: business_error
              message: The request should not contain both productId and itemYrn.
  '401':
    $ref: '#/components/responses/Unauthorized_401'
  '403':
    $ref: '#/components/responses/Forbidden_403'
  '500':
    $ref: '#/components/responses/InternalServiceError_500'
```

### tags

Optional. Use tags to group endpoints when a service is complex:

```yaml
'/price/{tenant}/matchPrice':
  post:
    summary: Matching prices for specific attributes
    tags:
      - Price matching
```

## Preview labeling

Use preview labeling when functionality is not fully operational yet. Choose the pattern based on **scope**:

| Scope | What to use |
|-------|-------------|
| Whole endpoint is in preview | Preview badge image **and** danger hint in the endpoint `description` |
| Only a field, property, or enum value is in preview | Preview **note only** in that field's `description` — do **not** use the badge image |
| Markdown API docs / tutorials | Danger hint on the page or section |

### Whole endpoint in preview

Add the preview badge and danger hint at the start of the endpoint `description`, before the endpoint summary text:

```yaml
description: |-
  ![Preview](https://res.cloudinary.com/saas-ag/image/upload/v1752824268/emporix/icons/preview_api1.png)

  {% hint style="danger" %}
  This functionality is in preview mode - some of the features may not be fully operational yet.
  {% endhint %}

  Retrieves agent conversations based on the provided query.
```

Preview badge image URL:

```text
https://res.cloudinary.com/saas-ag/image/upload/v1752824268/emporix/icons/preview_api1.png
```

### Field or value in preview

When only a field, property, or enum value is in preview, add a bold note in that field's description. Do **not** add the preview badge image to the endpoint.

```yaml
includesMarkup:
  type: boolean
  description: |
    Flag indicating whether prices assigned to the price model include markup.

    **The `includesMarkup` field is in preview mode** - some of the features may not be fully operational yet.
```

```yaml
description: |
  Item types for which prices should be retrieved. Possible values:
  * `PRODUCT`
  * `SKU`

    **The `SKU` value is in preview mode** - the system does not fully operate on the SKU concept yet.
```

### Preview note (API docs / tutorials)

In markdown API documentation pages, add this danger hint near the top of the page or section that covers preview functionality:

```
{% hint style="danger" %}
This functionality is in preview mode - some of the features may not be fully operational yet.
{% endhint %}
```

## Common parameters

### tenant path parameter

```yaml
name: tenant
in: path
required: true
description: |
  Your Emporix tenant's name.
  **Note**: The tenant should always be written in lowercase.
schema:
  pattern: '^[a-z][a-z0-9]+$'
  minLength: 3
  maxLength: 16
  type: string
```

### Accept-Language header

```yaml
name: Accept-Language
in: header
required: false
schema:
  type: string
description: |
  List of language codes acceptable for the response. You can specify factors that indicate which language should be retrieved if the one with a higher factor was not found in the localized fields.
  * If the header is set to a specific language or a list of languages, localized fields are retrieved as maps containing a single translation, where the key is a language code and the value is the field in the specified language.
  * If the header is set to `*`, localized fields are retrieved as maps of translations, where the keys are language codes and values are the fields in their respective languages.
  * If the header is empty, localized fields are retrieved as maps containing a single translation, where the key is a language code and the value is the field in the specified language. The endpoint will assume that localized fields should be retrieved in the tenant's default language defined in the Configuration Service.
```

### Content-Language header

```yaml
name: Content-Language
in: header
required: false
schema:
  type: string
description: |
  Language in which localized fields in the request body are provided.
  * If the header is set to a specific language, localized fields should be provided as maps containing a single translation, where the key is a language code and the value is the field in the specified language.
  * If the header is set to `*`, localized fields should be provided as maps of translations, where the keys are language codes and values are the fields in their respective languages.
  * If the header is empty, localized fields should be provided as maps containing a single translation, where the key is a language code and the value is the field in the specified language. The endpoint will assume that localized fields are provided in the tenant's default language defined in the Configuration Service.
  **Note**: You can provide the localized fields only in languages defined in the Configuration Service. In case the fields are provided in languages that are not defined in the Configuration Service, the request will be rejected.
```

### sort query parameter

```yaml
name: sort
in: query
description: |-
  List of properties used to sort the results, separated by commas. The order of properties indicates their priority in sorting.
  Possible values:
  * `{fieldName}`
  * `{fieldName}.asc`
  * `{fieldName}.desc`
  **Note:** If you want to sort the results by localized properties, the possible values are:
    * `{fieldName}.{language}`
    * `{fieldName}.{language}.asc`
    * `{fieldName}.{language}.desc`
  If the sorting direction is not specified, the fields are sorted in ascending order.
schema:
  type: string
```

### pageNumber query parameter

```yaml
name: pageNumber
in: query
description: |
  Page number to be retrieved. The number of the first page is 1.
  **Note:** If the `pageNumber` parameter is passed, size of the pages must be specified in the `pageSize` parameter.
schema:
  default: 1
  minimum: 1
  type: integer
```

### pageSize query parameter

```yaml
name: pageSize
in: query
description: |
  Number of items to be retrieved per page.
schema:
  default: 16
  minimum: 1
  type: integer
```

### X-Total-Count header

```yaml
name: X-Total-Count
in: header
required: false
description: Flag indicating whether the total count of retrieved items should be returned.
schema:
  default: false
  type: boolean
```

## IDs

Describing an ID created in the same API service:

```yaml
parameters:
  - name: priceId
    in: path
    required: true
    schema:
      type: string
    description: Price's unique identifier, generated when the price is created.
```

```yaml
properties:
  id:
    type: string
    description: Price model's unique identifier, generated when the price model is created.
```

Describing an ID created or defined in another API service:

```yaml
properties:
  productId:
    type: string
    description: Product's unique identifier, generated when the product is created through the Product Service.
```

```yaml
unitCode:
  description: Code of the measurement unit, as defined in the Unit Handling Service.
  type: string
```

## metadata

```yaml
metadata:
  type: object
  properties:
    createdAt:
      description: Date and time when the object was created.
      type: string
    modifiedAt:
      description: Date and time when the object was last modified.
      type: string
    version:
      minimum: 1
      type: integer
      description: Version of the object.
  required:
    - createdAt
    - modifiedAt
    - version
```

## Best practices

### Do not use allOf for a single reference

Wrong:

```yaml
provider:
  allOf:
    - $ref: '#/components/schemas/Provider'
  description: Indicates which provider should be used.
```

Correct:

```yaml
provider:
  $ref: '#/components/schemas/Provider'
  description: Indicates which provider should be used.
```

### Keep allOf siblings inside allOf

Wrong — `type` and `properties` sit beside `allOf`:

```yaml
SchemaResponse:
  allOf:
    - $ref: '#/components/schemas/AbstractSchemaResponse'
  type: object
  properties:
    attributes:
      type: array
      description: List of attributes related to the schema.
      items:
        $ref: '#/components/schemas/SchemaAttribute'
```

Correct — nest the object definition inside `allOf`:

```yaml
SchemaResponse:
  allOf:
    - $ref: '#/components/schemas/AbstractSchemaResponse'
    - type: object
      properties:
        attributes:
          type: array
          description: List of attributes related to the schema.
          items:
            $ref: '#/components/schemas/SchemaAttribute'
```

### Place required inside the object that owns the properties

GitBook does not show `required` when it is a bare sibling of `$ref` items in `allOf`.

Wrong:

```yaml
allOf:
  - type: object
    properties:
      id:
        $ref: '#/components/schemas/id'
  - $ref: '#/components/schemas/parentVariantProductUpdate'
  - required:
      - id
```

Correct:

```yaml
allOf:
  - $ref: '#/components/schemas/parentVariantProductUpdate'
  - type: object
    properties:
      id:
        $ref: '#/components/schemas/id'
    required:
      - id
```

## Mixin schemas

If you reference mixin schemas, host the JSON files in the Cloudinary `emporix-docs` folder:

```text
https://res.cloudinary.com/saas-ag/raw/upload/emporix-docs/orderGeneralAttributesMixIn.v9.json
```
