# Experience first

**Applies when:** deciding scope, product or UX tradeoffs, or the shape of anything someone else will use: a screen, a public API, a library, an event, a configuration option, an error message.

**Rule.** When what is easiest to build conflicts with what is best for the person using it, choose the person. Fewer, finished capabilities beat more, rough ones.

- **Name the user first.** It is whoever consumes the work: the merchant or shopper in a UI; the developer who calls the API, imports the library, or consumes the event; the engineer who maintains the code next. Judge the change from their side, and explain its impact in their terms.
- **Everything earns its place.** Each feature, control, parameter, and configuration option needs a reason a user would recognise. "It was easy to add" or "someone might want it" is not one.
- **Ship less, ship it finished.** Cut scope before cutting quality. Three polished capabilities are worth more than ten half-done ones.
- **Serve the core flow.** Every addition makes the main thing the user came to do easier, or stays out of its way.
- **The details are the product.** Error, empty, and loading states, clear messages, sensible defaults, consistent names, feedback after an action, spacing and alignment in a UI. For an API: predictable names, errors that say what to fix, no surprises between similar endpoints.
- **Try it before building it.** Settle open design questions where change is cheap (a mockup, a throwaway prototype, the call sites written out) before production code makes them expensive.
- **Foundations serve the experience.** `foundational-thinking.md` decides the order of the work; this principle decides what the work is aiming at.
