# Type system discipline

**Applies when:** designing types, writing or reviewing a function signature, or writing code in a statically typed language.

**Rule.** Make the compiler do the checking: impossible states, swapped values, and unhandled cases should fail to compile, not fail in production. Where possible, remove an error or special case by changing the type instead of adding another handler.

- **Illegal states do not type-check.** If two fields are only valid together, or one excludes the other, use a type where the bad combination cannot be built (a union of the valid cases, a value object built through one constructor), not nullable fields plus a comment.
- **Give meaning its own type.** Values that share a primitive but mean different things (a tenant, a product id, an order id, an amount in cents) get distinct types: a newtype, value class, or record in Java and Kotlin, a branded type in TypeScript. Check the value once where it is created, and trust the type after that. Two parameters of the same primitive type with different meanings are a swap waiting to happen.
- **Outside data has no type until parsed.** HTTP bodies, events, JSON, configuration, environment variables, CLI arguments, and database documents get parsed into the typed model at the boundary. `boundary-discipline.md` says where that happens. Behind it, no `any`, raw `Object`, `Map<String, Object>`, or unchecked cast.
- **Handle every variant.** Model a closed set as a sealed type, enum, or discriminated union, and match it exhaustively, so a new variant breaks the build at every place that must handle it. A `default` branch that silently absorbs unknown cases throws that away.
- **One source of truth for a shape.** When an OpenAPI spec, a schema, a shared API client (such as `@emporix/api-calls`), or a shared DTO library already defines a shape, use or generate from it. Do not hand-write a parallel type that will drift.
- **Define errors out of existence.** Before adding a check and an error path, ask whether a different type, default, or signature makes the failure impossible (a non-empty collection type, an operation that is a no-op when there is nothing to do).
- **Do not silence the compiler.** Widening a type, adding a cast, or using `any` / `@SuppressWarnings` to get a green build hides the defect the type found. Fix the shape instead.
