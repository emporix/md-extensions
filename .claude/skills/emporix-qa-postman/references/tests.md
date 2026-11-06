# Tests and assertions

Script shape for a **draft** in the `{KEY}-api-tests` worktree. Read the
Postman repo rules first (`references/draft.md`). When they are stricter,
they win.

Match the collection you are extending. Open two or three sibling requests
and copy their script style (quotes, `var` vs `let`, CRLF is fine — do not
reformat the whole file). Add requests. Leave existing tests in place.

## Auth (first requests in a flow)

**Service token** — `POST {{api-url}}/{{oauth}}/token` or `{{api-url}}/oauth/token`,
`auth: noauth`, body `urlencoded`:

- `grant_type` = `{{grant_type}}` or `client_credentials`
- `client_id` / `client_secret`
- `scope` = `tenant={{tenant}}` plus the service scopes already used in that
  collection (do not invent scopes)

Test script:

```javascript
var data = pm.response.json()
pm.environment.set("access_token", data.access_token)
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

**Anonymous / customer** (cart and storefront flows):
`GET {{api-url}}/customerlogin/auth/anonymous/login?client_id={{client_id_storefront}}&tenant={{tenant}}`.
Set `anonymous_token` and `sessionId`. Later customer calls use bearer
`{{anonymous_token}}`; management calls use `{{access_token}}`.

Later requests: `"auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{access_token}}", "type": "string" }] }`.

## Happy path

Every request that is part of the contract gets at least a status test.

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});
pm.test("Response includes an id", function () {
    pm.expect(pm.response.text()).to.include("id");
});
var data = pm.response.json()
pm.environment.set("cartId", data.id)
```

Use the real field name (`id`, `code`, `yrn`). Prefer
`pm.expect(responseData).to.have.property('code')` and
`pm.expect(responseData.code).to.include('…')` when the sibling tests do.

## Errors

Name the request after the case (`Getting 400 when …`). Assert status **and**
the message the API actually returns (from OpenAPI or a live response — do not
invent copy).

```javascript
pm.test("Status code is 400", function () {
    pm.response.to.have.status(400);
});
pm.test("The error message is correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("…");
});
```

## Prerequest

Random input via Postman dynamics, then env:

```javascript
let email = pm.variables.replaceIn("{{$randomEmail}}")
pm.environment.set('email', email)
```

Do not hard-code unique emails or ids that will collide on re-run.

## Cleanup

If the folder creates resources, end with the same delete/teardown requests
siblings use (`204` is common). Do not leave a new create without a matching
cleanup when the rest of the folder cleans up.

## What not to do

- Do not add `pm.test("Your test name", …)` placeholders.
- Do not assert a field that the response does not have.
- Do not widen scope past the ticket / `--folder`.
- Do not drop or rewrite existing tests to make Newman green.
- Do not edit the primary `postman-collections` checkout. Write in the worktree.
- Give every `pm.expect` a second-argument message that says what is wrong.
- Unknown contract → blocking question, not a guessed path.
