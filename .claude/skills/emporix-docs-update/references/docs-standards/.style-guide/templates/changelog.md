---
description: Use these instructions when creating a new changelog.
icon: hourglass-clock
---

# Changelog

* Changelogs are created and kept in the `api-references` repository in the `changelog/README.md` file.
 * Add a new `{% update date="RELEASE_DATE" ... %}…{% endupdate %}` block at the top of `changelog/README.md`, just under the opening `{% updates format="full" %}`. Do not modify existing entries. Do not create separate changelog files or update `changelog/SUMMARY.md`.
 * Use `date="RELEASE_DATE"` in the `{% update %}` tag (never a hard-coded date).

{% hint style="info" %}
The date placeholder `RELEASE_DATE` is transformed into an actual date of release upon the PR merge.
{% endhint %}

* Add relevant tag or tags relevant to the type of introduced changes:
  * new feature: new-feature
  * improvement: improvement
  * major change: major-change
  * minor change: minor-change
  * deprecated: deprecated

Examples:

```
{% update date="RELEASE_DATE" tags="improvement" %}

```

```
{% update date="RELEASE_DATE" tags="improvement, deprecated" %}
```

```
{% update date="RELEASE_DATE" tags="major-change" %}
```

* Add the relevant changelog content, use the template:

```
## Title

#### Overview
General description of introduced changes, one or a few sentences.

#### New endpoints

| Endpoint | Description |
| --- | --- |
| [Retrieving list of coupons by criteria](/openapi/coupon/#operation/GET-coupon-list-specified-coupons) | New property `referralCoupon` added to the response. |
| [Retrieving information about particular coupon by code](/openapi/coupon/#operation/GET-coupon-retrieve-coupon) | New property `referralCoupon` added to the response. |

#### Updated endpoints

| Endpoint | Description |
| --- | --- |
| [Retrieving list of coupons by criteria](/openapi/coupon/#operation/GET-coupon-list-specified-coupons) | New property `referralCoupon` added to the response. |
| [Retrieving information about particular coupon by code](/openapi/coupon/#operation/GET-coupon-retrieve-coupon) | New property `referralCoupon` added to the response. |

#### Removed endpoints

| Endpoint | Description |
| --- | --- |
| Retrieving all locations for a site | Endpoint removed. The `GET /availability/{tenant}/locations/{site}` operation is no longer available. Use [Retrieving all availability information for a site](https://developer.emporix.io/api-documentation/api-guides/orders/availability/api-reference/availabilities#get-availability-tenant-availability-site-site) instead. |

#### Deprecated endpoints

| Endpoint | Description |
| --- | --- |
| [Retrieving list of coupons by criteria](/openapi/coupon/#operation/GET-coupon-list-specified-coupons) | New property `referralCoupon` added to the response. |
| [Retrieving information about particular coupon by code](/openapi/coupon/#operation/GET-coupon-retrieve-coupon) | New property `referralCoupon` added to the response. |

#### Known problems

There are no known problems.
```
* `Title` - h2 marker with the title of the changelog entry according to the following convention: `## Service Name - {main change description}`
  * keep the description short and simple
  * use noun phrases only (no verbs in titles)
  * for code-phrases, use backticks (\`\`), do not use quotation marks etc.
  * keep it quite general, details come in Overview

Examples:

```
## Product Service - deprecations
```
```
## Cart Service - support for external discounts
```

* `Overview` h4 section:
  * Provide a short description with details of what has been changed and what effect it brings - one or a few sentences.
  * Use full sentences, try to use active voice, present or past simple tense.
  * For names of settings, code-phrases etc. use backticks (\`\`).
* `New/Updated/Deprecated endpoints` h4 sections:
  * Use the table format.
  * Provide links to the changed endpoints in the Endpoint column.
  * For displayed link names, use the verb in gerund form (updating, deleting etc) - this should be consistent with the endpoint title in API reference.
  * Base the link URLs on the endpoints paths (not operationIDs) - Gitbook takes the paths defined in `yml` files to create URLs, for example: `patch/schema/{tenant}/custom-entities/{type}/instances/{id}` → `https://developer.emporix.io/api-documentation/api-guides/utilities/schema/api-reference/custom-instance#patch-schema-tenant-custom-entities-type-instances-id`
  * Provide a description for each changed endpoint:
    * Keep it brief and simple.
    * Use present simple tense if possible.
    * Try to use active voice, avoid passive if possible.
    * Use full sentences with a full stop at the end.
    * Focus on explaining the outcomes or the purpose of the change.
    * For code-phrases, use backticks (\`\`).
* `Removed endpoints` h4 section:
  * Use the table format.
  * Do not link removed endpoints in the Endpoint column - the API reference page is gone.
  * In the Description, name the removed operation as `` `OPERATION /path` `` and state that it is no longer available.
  * If a substitute endpoint exists, link to it in the Description. For full rules and examples, see [Removal of deprecated items](#removal-of-deprecated-items).
* `Known problems` h4 section:
  * Indicate if there are any problems at the time of release.

* If you want to highlight any content with a note, use the hint element. You can use warning, info, success and danger styles.

Example:

```
{% hint style="warning" %}

This functionality is now fully operational.
{% endhint %}
```

## Removal of deprecated items

When previously deprecated endpoints or fields are removed, add a changelog entry in `changelog/README.md`. Do not create a separate changelog file.

* Use the `major-change` tag. Do not use `deprecated` - that tag is for announcing deprecation, not completing it.
* Title convention: `## {Service Name} - removal of deprecated {endpoints|fields|endpoints and fields}`
* Overview: state that previously deprecated items are now removed, and link to the original deprecation changelog entry.
* Table heading: `#### Removed endpoints & fields` when both apply. Use `#### Removed endpoints` or `#### Removed fields` if only one type is removed.
* Fully removed endpoints:
  * Put the gerund endpoint name in the Endpoint column as plain text. Do not link to the API reference - the page is gone.
  * In the Description, reference the removed endpoint by path, not by link. Use the format `` `OPERATION /path` `` (for example, `` `GET /availability/{tenant}/locations/{site}` ``).
  * Write: ``Endpoint removed. The `OPERATION /path` operation is no longer available.``
  * If a substitute endpoint exists, add: `Use [{gerund name}]({new-url}) instead.`
  * If no substitute exists, stop after the first sentence.
* Fields removed from surviving endpoints:
  * Keep a live gerund link to the current path-based API reference.
  * Name the removed fields in backticks.

Example:

```
{% update date="RELEASE_DATE" tags="major-change" %}
## Brand Service - removal of deprecated endpoints and fields

#### Overview

All previously deprecated endpoints and fields are now removed ([Brand Service - deprecations](https://developer.emporix.io/changelog/archive/changelog-2025/2025-03-04-brand)).

#### Removed endpoints & fields

| Endpoint | Description |
| --- | --- |
| Creating a media | Endpoint removed. The `POST /media/{tenant}/assets` operation is no longer available. |
| Deleting a media | Endpoint removed. The `DELETE /media/{tenant}/assets/{assetId}` operation is no longer available. |
| [Creating a brand](https://developer.emporix.io/api-documentation/api-guides/products-labels-and-brands/brand-service/api-reference/brands#post-brands) | The `image` and `cloudinaryUrl` fields are removed from the request body. |
| [Updating a brand](https://developer.emporix.io/api-documentation/api-guides/products-labels-and-brands/brand-service/api-reference/brands#put-brands-brandid) | The `image` and `cloudinaryUrl` fields are removed from the request body. |
| [Partially updating a brand](https://developer.emporix.io/api-documentation/api-guides/products-labels-and-brands/brand-service/api-reference/brands#patch-brands-brandid) | The `image` and `cloudinaryUrl` fields are removed from the request body. |

#### Known problems

There are no known problems.
{% endupdate %}
```

Removed-endpoint examples:

With a substitute:

```
| Endpoint | Description |
| --- | --- |
| Retrieving all locations for a site | Endpoint removed. The `GET /availability/{tenant}/locations/{site}` operation is no longer available. Use [Retrieving all availability information for a site](https://developer.emporix.io/api-documentation/api-guides/orders/availability/api-reference/availabilities#get-availability-tenant-availability-site-site) instead. |
```

Without a substitute:

```
| Endpoint | Description |
| --- | --- |
| Retrieving all locations for a site | Endpoint removed. The `GET /availability/{tenant}/locations/{site}` operation is no longer available. |
```