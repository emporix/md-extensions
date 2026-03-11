# Dashboard Styles

Global styles for the Emporix Dashboard. All rules are scoped to `.dashboard-app` so they do not affect the host application when used as a federated module.

## Structure

| File | Purpose |
|------|--------|
| `index.scss` | Entry point; imports tokens, base, and PrimeReact overrides. |
| `tokens.scss` | Design tokens (CSS custom properties): colors, spacing, typography, shadows, radius, transitions, z-index. Used by dashboard module SCSS and ErrorBoundary. |
| `base.scss` | Reset (box-sizing), typography (headings, paragraphs, links), form elements, focus, scrollbar. |
| `primereact-overrides.scss` | Theming for PrimeReact components (Card, Button, Dropdown, inputs, etc.) used by the dashboard and App. |

## Usage

- **Tokens**: Use `var(--token-name)` in component SCSS (e.g. `var(--spacing-md)`, `var(--font-size-lg)`, `var(--text-secondary)`).
- **Dashboard** components use their own `.module.scss` files and reference these tokens; they do not use global utility or layout classes.
