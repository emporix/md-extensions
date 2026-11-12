# Area: B2B Commerce Frontend (storefront)

The storefront design system. Files (aliases; see `registry.json`):

- **MAIN - B2B New Showcase** — role `release`: the published library and
  primary prior art. Generated designs are **integrated into** its design
  equivalent below.
- **DESIGN - B2B New Showcase** — role `design`: the work-in-progress pair of
  MAIN and the integration target. Pages (observed 2026-10-29): storefront
  pages, then the group `2. PAGES - MY ACCOUNT` (Dashboard, Approval
  Dashboard, Quotes, Company, User Management, Returns & Claim, Wishlists,
  Order History), Mails, Flows; plus pages `Documentations & Rules` (empty when
  read) and `Demo findings`. A new My Account feature gets its own page in that
  group, with sections per G-1. Not yet checked for the Button and header sets
  that MAIN does not publish.
- A working copy of MAIN seen in ticket COP-4827 (unconfirmed)

## Rules (confirmed by the user)

| ID | Rule | Source |
|---|---|---|
| BCF-1 | Success and failure messages use the library **Notification** (desktop: full content width, 16px below the header, overlays content; closes after 4 s or with X), not Toast Notice or tooltip-like components. The 4-second timeout and the overlay are reported as WCAG issues, not changed, unless the user decides otherwise. | user, 2026-10-29 |
| BCF-2 | A page scoped to a company shows the selected company in the header: building icon plus plain-text name after the currency, same name in breadcrumb, title and data. The company switcher (dropdown) is designed only when the brief is about the switcher. | user, 2026-10-29 |
| BCF-3 | Forms: the submit button stays enabled; submitting with required or invalid fields blocks the save, shows the library Input error state with its error text, and moves focus to the first invalid field. Differs from the product's disabled Save: flag as `[DEVIATION]`. | user, 2026-10-29 |
| BCF-4 | Heading levels default to WCAG-correct (page title h1, section/card title h2, deeper levels continue) and are flagged `[DEVIATION]` against prior art (which uses h3/h4). Prior-art headings are used only when a story asks for it, with a `WCAG-REPORTED` entry. | user, 2026-10-29 (COP-4827 chose prior art for itself) |
| BCF-5 | Breadcrumbs of My Account pages: Home > Account Details > {page} (> {item} for detail pages), last item plain text. The label is Account Details even though the library sample and some tickets say My Account. | user, 2026-10-29 |
| BCF-6 | Every design gets one more section after Error Handling: `{KEY} - {Feature} - German`, the happy-path screens in German, to check that labels, buttons and menu entries are clear and fit. Translate content, breadcrumb, menu and header; the footer may stay English. Translations are a first proposal for review. Record fit problems (wrapping, truncation) in the Notes. | user, 2026-10-29 |
| BCF-7 | All list views under My Account share the structure of Order History: a quick search box (library Input with the label hidden, placeholder `Search..`, search icon) above the table; the standard table (header row with sort icon on sortable columns, alternating row fill, divider lines, text style h6 headers and body/m cells); an action column where rows have actions (for example Return, and a View arrow); and the pager below, right-aligned (`Page n / N`, Previous, Next). Deviations need the user's say-so. | user, 2026-10-29 |
| BCF-8 | Lists show 10 items by default (a full first page), not 3 or 5; the pager then implies more pages (for example Page 1 / 3). | user, 2026-10-29 |
| BCF-9 | Action and context buttons carry an icon next to their text by default, as most buttons in MAIN do (library Button: Icon left / Icon right). Use a **semantically matching icon from the library's icon collection** (Edit pencil, Previous/Next chevrons, Delete trash, Download download, ...). If no clearly matching icon exists, **ask the user**; do not guess. **Save and Cancel are exceptions: never give them an icon** unless the user asks. Local `proposal/Button` components keep an optional icon slot, off by default for primary/secondary (Save/Cancel). | user, 2026-10-29 |
| BCF-10 | Standard viewports (as in MAIN): Desktop max 1920, Desktop min 1024, Tablet min 768, Mobile 360. Responsive behavior to follow: 1024 keeps the full header and the account menu beside the content; 768 shows the compact header (top row, then toolbar row with menu button) and a narrower account menu with wrapping labels; 360 shows the minimal header (close, login, cart), the outlined `ACCOUNT MENU` button instead of the menu, stacked content and the mobile footer. Tables stay tables: they scroll horizontally with a fade at the edge and the first columns visible; the pager keeps Previous/Next with the page text below. Tab Bar and Notification have Mobile variants. | user (G-13) + MAIN, 2026-10-29 |
| BCF-11 | Mobile (360) sub-navigation with three or more tabs does not fit the Tab Bar (Amount=3 is 489px, content is 328px): stack the entries vertically at full width, as MAIN's Approval Dashboard does with stacked full-width small buttons, but style them as **tab rows, not buttons** (selected row: blue text, left bar, thicker underline; others: dark text, thin divider) so it reads as a different control. Report the missing library pattern as a gap. Tables keep scrolling with the edge fade. | user, 2026-10-29 |

Global rules (`../guidelines.md`) also apply; BCF rules override where noted.

## Known facts about the design system (observed 2026-10-29; re-verify)

- Library page structure: Atoms, Molecules, Organisms, Pages (including
  "My Account": Company Management, User Management). Pages hold sections per
  screen set with 1920, 1024, 768 and 360px variants.
- Fonts: Open Sans (body), Ubuntu Bold (headings, logo). Viewports 1920 / 1024
  / 768 / 360.
- Not published in the library file, so not importable elsewhere: the `Button`
  set, the `header` set, variable `border/border radius/M`. Published parts of
  the header (Top Banner, Top Bar, Middle Bar, Navbar) can be assembled.
- Input: Status default/hover/focus/error/success/disabled, State
  filled/not filled; no read-only status; error text is drawn outside the
  component height; optional fields are marked with "(optional)".
- The page called "Toast Notification" documents a tooltip; the feedback
  component is "Molecules / Notification".
- MAIN mobile references (observed 2026-10-29): the Approval Dashboard at 360 stacks three full-width small secondary buttons (red, green, blue) as status controls and uses a `Table Swipe Icon` (chevron-right, 20px) for scrolling tables; the Tab Bar documentation has no mobile guidance beyond the smaller style; Pills are for filters and search suggestions only; there is no accordion.
- MAIN layout containers have `clipsContent = false`; only the root screen frames clip (observed node `Frame 1000003677` vs `User Management - Desktop max.`). Cards use the effect style `Drop Shadows/shadow-sm (2dp)`.
- Top Bar is an instance: add context items (selected company) as separate
  items placed after the currency group.
- Breadcrumb component ships with placeholders (`Link`, `Current page`).
- Pager (Order History): `Page n / N` text plus Previous and Next buttons built from the unpublished Button set (secondary small neutral, icon left/right). The library also has a published numeric `Pagination` component, a different pattern. Quick search in Order History is the library Input with a search icon on the right.
- Order History table: header row on `colors/surface/primary` with bottom stroke `colors/border/primary`; rows padded 16/8, gap 24, even rows filled `color/grey/25`, top stroke `colors/border/primary`; sort icon is the `chevrons-up-down` icon; link cells use the link text style.

## Pending questions

- (none)
