---
name: api-data
description: REST API layer patterns under src/api
paths: ["src/api/**", "**/*.api.ts"]
always: false
---

# API Layer

Skip this rule if the project uses only GraphQL or another data layer — adapt patterns to that stack instead.

## Structure & Location

- Place API logic in `src/api/` only (e.g. `products.api.ts`, `auth.api.ts`). Do not use `src/services/` for API calls.
- Do not put raw `fetch` / request logic inside UI components.
- Use a shared HTTP client or fetch wrapper (base URL, headers, interceptors).

## Configuration

- Use environment variables for base URLs and keys (e.g. `import.meta.env.VITE_API_BASE_URL`).
- Never hardcode secrets or environment-specific URLs.
- Document required env vars in `.env.example` or README.

## Types

- Define request and response types for each endpoint in `src/models/`, `src/types/`, or next to the API module.
- Type API function return values (e.g. `Promise<Product>`). Avoid untyped responses.

## Error Handling

- Use try/catch for all API calls.
- Handle HTTP 4xx/5xx and network failures; throw or return typed errors for the UI layer.
- Handle empty response bodies (e.g. `204 No Content`, empty error bodies) before `res.json()` / `JSON.parse` — read `res.text()` and parse only when it is non-empty.
- Do not swallow errors — log with `console.error` and let the caller show user feedback.

## Patterns

- Prefer `async`/`await` over raw promise chains in API modules.
- Keep API functions deterministic for a given input — side effects like token refresh belong in the shared client.
- When using React Query, SWR, or similar, put data-fetching hooks next to the API module (or under `src/api/`); keep components thin.
- Before adding or changing a custom API request, first check whether the endpoint is already implemented in `@emporix/api-calls`. Step 1 of the library workflow (`$RULES_ROOT/../library/workflow.md`) shows where to look.
- New code imports calls and their types from `@emporix/api-calls/next` (version 1.6.0 and later), and operations that combine several requests from `@emporix/api-calls/platform`. How they take the tenant, request options, and list parameters: the library [README](https://github.com/emporix/api-calls/blob/master/README.md) § `./next` entry point.
- Root methods are the deprecated 1.x API, which 2.0 removes, so a root method is not a match for new code. Its `@deprecated` note names the replacement, or says why there is none. Root imports the project already has can stay until it moves that domain to the new entry points, by hand and one domain at a time ([`migration/README.md`](https://github.com/emporix/api-calls/blob/master/migration/README.md)).
- If `package.json` already lists `@emporix/api-calls` and a matching method exists, use the library method by default — do not ask. Write a custom call only when the user asks for one or the library method cannot cover the request.
- If the project does not depend on `@emporix/api-calls` yet and a matching method exists, ask the user whether to add the library and use that method instead of a custom call. If the user declines, continue with the custom API call.
- If no matching `@emporix/api-calls` method exists, follow **Endpoint missing from `@emporix/api-calls`** below before writing a custom call.

```typescript
// src/api/products.api.ts
import type { Product } from '../models/Product.model'

const getBaseUrl = () => import.meta.env.VITE_API_BASE_URL as string

export type ApiError = Error & { status: number; body: string }

export const createApiError = (status: number, body: string): ApiError =>
  Object.assign(new Error(`API error ${status}`), { status, body })

// Empty body (e.g. 204) resolves to null instead of throwing in JSON.parse
export const fetchProduct = async (id: string): Promise<Product | null> => {
  try {
    const res = await fetch(`${getBaseUrl()}/products/${id}`)
    const body = await res.text()
    if (!res.ok) {
      throw createApiError(res.status, body)
    }
    return body.trim() ? (JSON.parse(body) as Product) : null
  } catch (err) {
    // Network, HTTP, and parse failures: log here, let the caller show feedback
    console.error(`fetchProduct(${id}) failed`, err)
    throw err
  }
}
```

```typescript
// In component — call API module, handle loading/error in UI (the API module already logged)
const [product, setProduct] = useState<Product | null>(null)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
  fetchProduct(id).then(setProduct).catch(setError)
}, [id])
```

## Endpoint missing from `@emporix/api-calls`

Follow the library contribution workflow (`$RULES_ROOT/../library/workflow.md`) with `api-calls`. It interviews the user (add the method to the library — recommended — or write a custom call here), implements it in the library, offers to release right away, and moves this project onto the released version.

Decide this while planning, not mid-implementation. When the work is planned first (for example with `emporix-feature`), ask the workflow's first question — add the method to the library (recommended) or write a custom call — during exploration, and plan a library change as its own seam with a todo that runs that workflow; the change in this project waits for the library release.
