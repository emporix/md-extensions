---
name: e2e-test-ids
description: Stable data-testid on every actionable UI control for bugbug.io end-to-end tests
paths: ["src/**/*.tsx"]
always: false
---

# E2E test ids (`data-testid`)

QA records end-to-end tests in [bugbug.io](https://docs.bugbug.io/preventing-failed-tests/selectors). bugbug's preferred locator is a product-owned test attribute (project setting *Include custom attributes*, default `data-testid, data-test`). Without one, recorded steps fall back to copy, CSS classes, generated ids or DOM position, and break on the next restyle, translation or reorder.

This is a coding convention applied while you write the component. It is not a CI or pre-push gate; do not add a repo-local selector checker.

## Never rename or remove an existing id

Existing bugbug tests depend on every `data-testid` already in the code.

- Keep the value exactly as it is, even when it does not follow the naming below. Do not "fix" old names.
- When you move, split or rewrite a component, carry its ids over to the element that now does the same job.
- When a control is deleted on purpose, say so in the PR description so QA can update the tests.

## Must have a `data-testid`

Every actionable or asserted control you add or change:

- buttons, and links used as actions
- inputs, textareas, checkboxes, switches, radios
- selects and dropdowns: the trigger and each option/item
- menu and dropdown items
- dialogs and their close control
- tabs (each tab header)
- collapsible, accordion and popover triggers
- clickable table rows and list items, and row actions
- messages QA asserts on: validation errors, toasts, empty states, status badges

Add the id even when a unit test can find the element by role or label. bugbug still needs the attribute (unit tests keep their own query rules in `testing`).

No clickable `<div>` or `<span>`: use `<button type="button">` (or the real control) **and** a `data-testid` (`ui-components`).

## Naming

`{flow}-{control}`: the flow or component in camelCase, a hyphen, then the control in camelCase. Many repositories already use it:

```tsx
<Button data-testid="quote-sendButton">…</Button>
<Input data-testid="quoteShipping-zipCode" />
<DialogContent data-testid="addressSelector-dialog" closeTestId="addressSelector-closeButton">
<button type="button" data-testid={`addressSelector-item-${address.id}`}>
<button type="button" data-testid={`shipping-item-${address.id}`} data-country={address.country}>
```

- **Follow the repository first.** Before naming, search the screen and its neighbours for existing `data-testid` values and reuse their prefix and style.
- **Repeated items** add a stable business key: `orders-row-${order.id}`, `orders-rowEditButton-${order.id}`. Never an array index, generated id or translated text.
- **Same form mounted twice** gets its own prefix: `quoteShipping-*` vs `quoteBilling-*`.
- **Tabs and sections** with the same controls get the tab in the prefix: `productPrices-saveButton` vs `productMedia-saveButton`. Hidden or inactive panels still count, because a duplicate hidden element breaks bugbug selectors.
- Extra `data-*` attributes for assertions are fine next to the id (`data-country`, `data-status`). They never replace it.
- Unique on the rendered page.

## Do not

- Change or delete existing ids (see above).
- Use `data-bugbug-*`, `data-qa`, `id`, generated ids (PrimeReact, Radix, React Aria `useId`) or translated text as the locator.
- Build the value from translated text or `t(…)`.
- Put the id on a wrapper `<div>` around the control instead of the control itself.

## Reaching the real DOM element

The attribute only helps if it lands on the element the user clicks or types into. After adding one, check the rendered DOM (browser devtools, `agent-browser`, or a component test) when the component wraps a library widget.

**Own components** accept the id and forward it to the actionable element:

```tsx
type SaveBarProps = { 'data-testid'?: string; onSave: () => void }

const SaveBar = ({ 'data-testid': testId, onSave }: SaveBarProps) => (
  <div className={styles.bar}>
    <button type="button" data-testid={testId} onClick={onSave}>…</button>
  </div>
)
```

For components with several controls, take one prefix and derive the rest: `testIdPrefix="addressSelector"` → `addressSelector-dialog`, `addressSelector-closeButton`.

**PrimeReact** spreads `data-*` onto the root element of most widgets. For inner elements (a `Dialog` close button, a `TabPanel` header), use the pass-through `pt` prop; for list options, a template:

```tsx
<Dropdown
  data-testid="orderFilter-statusSelect"
  itemTemplate={(option) => <span data-testid={`orderFilter-statusOption-${option.value}`}>{option.label}</span>}
/>
<Dialog data-testid="addressSelector-dialog" pt={{ closeButton: { 'data-testid': 'addressSelector-closeButton' } }} />
<TabPanel header={t('prices')} pt={{ headerAction: { 'data-testid': 'product-pricesTab' } }} />
```

`pt` needs PrimeReact 9.4 or later; check the section names against the installed version.

**Radix / shadcn-style** primitives forward `data-*` to the rendered element. Put the id on the part that is clicked (`SelectTrigger`, `SelectItem`, `DialogContent`, `TabsTrigger`), not on `Root`.

**`@emporix/component-library`**: if a component drops `data-testid`, do not wrap it in an extra element. Tell the user, and add forwarding in the library (`$RULES_ROOT/../library/workflow.md`).
