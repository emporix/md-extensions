---
description: >-
  Link to other pages in the right form: a file path inside the same space, a
  GitBook app path with the space ID across spaces, and a path-based URL for API
  reference endpoints.
icon: link
---

# Links

The form of a link depends on where the target page lives. Each documentation repository is published as one or more GitBook spaces, and every space has its own navigation (`SUMMARY.md`).

## Same space

When the target page is in the same space as the page containing the link, use the path to the file, relative to the current file.

* Include the `.md` extension.
* Use `README.md` for a section page and do not shorten it to the folder name.
* Add a section anchor after `#` when the link leads to a subsection.
* Do not use absolute URLs for pages in the same space.

Example:

```
[Streams](../import-tool-guides/streams.md)
[Titles](format-and-structure.md#titles)
```

## Another space

When the target page is in a different space, use the GitBook app path with the ID of the target space. The only exception is a link to an API reference endpoint, which has its own format (see [API reference endpoint links](#api-reference-endpoint-links)).

```
https://app.gitbook.com/s/<spaceId>/<path-to-page>
```

* Take the space ID from the registry below.
* Build `<path-to-page>` from the location of the page in the target space, without the `.md` extension. A section page (`README.md`) uses the path of its folder.
* Add a section anchor after `#` when the link leads to a subsection.
* A link to the start page of a space ends with the space ID and a trailing slash, for example `https://app.gitbook.com/s/<spaceId>/`.
* Do not use repository-relative paths, such as `content/user-guides/...`, for pages in another space. They do not resolve in the published documentation.
* Do not use legacy URLs, such as `developer.emporix.io/docs/content/...`.

Example:

```
[Customer segments](https://app.gitbook.com/s/d4POTWomuSS7d3dnh4Dg/api-guides/companies-and-customers/customer-segments/segments)
```

### Space ID registry

| Space | Repository folder | Space ID |
| ----- | ----------------- | -------- |
| Commerce Engine user guides | `emporix-documentation-portal/content/user-guides` | `bTY7EwZtYYQYC6GOcdTj` |
| Orchestration Engine user guides | `emporix-documentation-portal/content/oe-user-guides` | `8dAaH7DfB59pzZwLxmur` |
| Agentic Commerce Intelligence guides | `emporix-documentation-portal/content/aci-guides` | `8GgoeZEZYjZrpjOU6w52` |
| Value Stream Modeller guides | `emporix-documentation-portal/content/vsm-guides` | `rSc4haeKWrTrOPHzdrMO` |
| B2B Commerce Frontend guides | `emporix-documentation-portal/content/frontend-guides` | `OgeoK7nW6gEh0q1ceUZP` |
| Partner Library guides | `emporix-documentation-portal/content/partner-library-guides` | `aAxCFK0JJRlhIPufuXz8` |
| Import Tool guides | `emporix-documentation-portal/content/import-tool-guides` | `9VS91qn3Ylwd58YivX1A` |
| Order Intake Cockpit guides | `emporix-documentation-portal/content/order-intake-guides` | `NXembrzntBOyi7ynrVRB` |
| Document Intake Cockpit guides | `emporix-documentation-portal/content/document-intake-guides` | `PBaf05o2vgbdikMFDTyz` |
| Search Cockpit guides | `emporix-documentation-portal/content/search-cockpit-guides` | `ERIsr5d67LF0wtgPlnHs` |
| API Documentation (API guides and tutorials) | `api-references` | `d4POTWomuSS7d3dnh4Dg` |
| Changelog (API) | `api-references/changelog` | `T7xSS33IeCxcZw0eXU0D` |
| Product Features (release notes) | `emporix-documentation-portal/content/release-notes` | `9BZA5q5EbkPLw3JiAtOl` |
| Welcome | `emporix-documentation-portal/content/welcome` | `6GTRpjfleJymwcc6AX3v` |

* The IDs above are taken from links that already exist in the published documentation.
* When a target space is not in the registry, do not guess the ID. Copy it from an existing link to that space, or ask the maintainers, and add it to the registry.
* When a new space is created, add it to the registry in the same change.

## API reference endpoint links

Link an API reference endpoint with the path-based URL that GitBook generates from the OpenAPI path. Use this form in every space, including links from the same space and from the changelog. Do not use the GitBook app path with a space ID, and do not use `operationId` anchors.

```
https://developer.emporix.io/api-documentation/<path-to-api-reference-page>#<method>-<endpoint-path>
```

* Build `<path-to-api-reference-page>` from the location of the API reference page, for example `api-guides/configuration/configuration-service/api-reference/tenant-configurations`.
* Build the anchor from the HTTP method and the endpoint path defined in the `.yml` file. Write both in lowercase and replace each `/`, `{`, and `}` with a hyphen, without doubling hyphens.
* Keep the link text aligned with the endpoint title in the API reference, which uses the gerund form (for example, "Updating a brand").

Example: `GET /configuration/{tenant}/configurations/{propertyKey}` becomes:

```
[Retrieving a configuration](https://developer.emporix.io/api-documentation/api-guides/configuration/configuration-service/api-reference/tenant-configurations#get-configuration-tenant-configurations-propertykey)
```

Links to other API pages, such as tutorials, follow the rules for [Same space](#same-space) and [Another space](#another-space). For the changelog tables, see the [changelog template](../templates/changelog.md). For the naming rules, see [API Tutorials](api-tutorials.md#endpoint-links-and-naming).

## Link text

* Use the title of the target page, or a short phrase that describes where the link leads. Do not use "here" or "this page".
* Keep trademark marks in link text the same way as in plain text (see [Trademarks](word-choice.md#trademarks)).

## Check the links

Before submitting a page, check every new or changed link:

* The target page exists. For a same-space link, the file path resolves from the current file. For a link to another space, the path exists in that space.
* The form matches the location of the target: file path in the same space, app path with the space ID across spaces, path-based `developer.emporix.io/api-documentation/...` URL for an API reference endpoint.
* The anchor of an endpoint link is built from the method and path in the `.yml` file, not from the `operationId`.
* The space ID in the link matches the target space in the registry.
* The section anchor exists on the target page and matches the heading text (see [Titles](format-and-structure.md#titles)).
* A new page is linked from `SUMMARY.md` and is reachable from at least one related page.
