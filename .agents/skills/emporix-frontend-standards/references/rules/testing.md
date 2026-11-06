---
name: testing
description: Unit test patterns and requirements
paths: ["**/*.test.ts", "**/*.test.tsx"]
always: false
---

# Testing

## Framework

**Vitest** with **@testing-library/react** for components. Test files are colocated next to source:

```
helper.helpers.ts
helper.helpers.test.ts
```

Use Vitest APIs only (`vi.mock`, `vi.fn`, `vi.spyOn`). Never use `jest.*` (`jest.mock`, `jest.requireActual`) — convert it when porting tests from Jest projects.

## When to Add Tests

- Helpers: always, in the same change as the helper
- Components: when behavior is non-trivial (interactions, conditional rendering, error states)
- Skip tests that only assert rendering without meaningful behavior

## Helper Tests

```typescript
describe('helperFunction', () => {
  it('returns expected result', () => {
    expect(helperFunction(input)).toEqual(expected)
  })

  it('does not mutate input', () => {
    const original = structuredClone(input)
    helperFunction(input)
    expect(input).toEqual(original)
  })
})
```

Cover: happy path, null/undefined properties, empty strings, boundary indices.

## Component Tests

- Mock context providers and external services
- Test user interactions (clicks, form input, keyboard)
- Test that menus/popovers do not trigger parent click handlers
- Use `data-testid` only when role/text queries are impractical
- Prefer accessible queries: `getByRole`, `getByLabelText`, `getByText`

## Run

```bash
npm run test                    # all
npx vitest run path/to/file     # single file
```

Check `package.json` for project-specific test scripts (e.g. `test:watch`, `test:coverage`).
