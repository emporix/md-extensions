# Styles Architecture

## Overview
This directory contains all styling for the application, organized using a modular approach with CSS variables and shared utilities.

## File Structure

```
styles/
├── _variables.css          # CSS custom properties (design tokens)
├── _shared.css             # Shared base styles and utilities
├── agents.css              # Main agents view entry point
├── components/             # Component-specific styles
│   ├── AgentCard.css
│   ├── AgentConfigPanel.css
│   ├── AddAgentDialog.css
│   ├── LogCard.css
│   └── ToolCard.css
└── README.md
```

## Design Tokens (_variables.css)

All colors, spacing, typography, and other design values are defined as CSS custom properties in `_variables.css`. This provides:
- **Consistency**: Single source of truth for design values
- **Maintainability**: Changes propagate automatically
- **Theming**: Easy to create theme variations

### Variable Categories:
- **Colors**: Grays, blues, greens, reds, semantic colors
- **Spacing**: Scale from xs (4px) to 3xl (48px)
- **Typography**: Font families, sizes, weights
- **Border Radius**: From sm (4px) to full (16px)
- **Shadows**: Standard shadow scale
- **Transitions**: Timing functions for animations
- **DataTable**: Column width constants

### Usage Example:
```css
.my-component {
  color: var(--text-primary);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
```

## Shared Styles (_shared.css)

Contains reusable base styles and utility classes to reduce duplication:

### Base Classes:
- `.base-card` - Standard card styling
- `.base-datatable` - DataTable styling
- `.base-icon` - Icon container styling
- `.base-badge` - Badge/chip styling

### Utility Classes:
- `.btn-text-*` - Text button variants
- `.state-*` - Loading, error, empty states
- `.text-*` - Text utilities (mono, muted, etc.)
- `.dt-col-*` - DataTable column width utilities

### Usage Example:
```css
/* Extend base styles */
.my-card {
  /* base-card styles are applied via class */
  /* Add specific overrides here */
}
```

## Component Styles

Each component has its own CSS file in the `components/` directory. These files:
- Import and use variables from `_variables.css`
- Extend base styles from `_shared.css`
- Contain only component-specific styling

### Import Order:
```css
@import './_variables.css';
@import './_shared.css';
@import './components/MyComponent.css';
```

## Best Practices

### 1. Use CSS Variables
✅ **DO**:
```css
.element {
  color: var(--text-primary);
  padding: var(--space-lg);
}
```

❌ **DON'T**:
```css
.element {
  color: #1f2937;
  padding: 1rem;
}
```

### 2. Extend Base Styles
✅ **DO**:
```css
.my-card {
  /* Extends .base-card via className */
  border-width: 2px; /* Specific override */
}
```

❌ **DON'T**:
```css
.my-card {
  max-width: 400px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  /* ...repeating all base styles */
}
```

### 3. Use Utility Classes
✅ **DO**:
```css
<button className="btn-text btn-text-primary">
```

❌ **DON'T**:
```css
.my-custom-button {
  background: transparent;
  border: none;
  color: #3b82f6;
  /* ...repeating utility styles */
}
```

### 4. Avoid Important Unless Necessary
- Only use `!important` for overriding third-party library styles (like PrimeReact)
- Document why `!important` is needed with a comment

### 5. Mobile-First Responsive Design
```css
/* Base styles (mobile) */
.element {
  padding: var(--space-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    padding: var(--space-lg);
  }
}
```

## DataTable Column Widths

Column widths for datatables are standardized using CSS utility classes that apply to both `headerClassName` and `bodyClassName` props in PrimeReact's `Column` component:

### Available Column Width Classes:

```css
/* Standard log/message columns */
.col-severity    /* 80px  - Severity/status tags */
.col-timestamp   /* 200px - Timestamp/datetime columns (alias: .col-datetime) */
.col-datetime    /* 200px - Alias for .col-timestamp */
.col-agent       /* 150px - Agent ID columns */
.col-message     /* auto  - Message content (min 400px) */

/* Size utilities */
.col-sm          /* 100px - Small columns */
.col-md          /* 150px - Medium columns */
.col-lg          /* 200px - Large columns */
.col-xl          /* 300px - Extra large columns */
.col-result      /* 80px - Result/status columns (alias: .col-status) */
.col-status      /* 80px - Alias for .col-result */

/* Compact variants for dense tables */
.col-severity-compact      /* 70px */
.col-timestamp-compact     /* 150px (alias: .col-datetime-compact) */
.col-datetime-compact      /* 150px - Alias for .col-timestamp-compact */
```

### Usage in Components:

```tsx
<Column 
  field="level" 
  header="Severity"
  headerClassName="col-severity"
  bodyClassName="col-severity"
/>
<Column 
  field="timestamp" 
  header="Timestamp"
  headerClassName="col-timestamp"
  bodyClassName="col-timestamp"
/>
```

### Why Not nth-child?

❌ **Avoid**: Brittle nth-child selectors that break when column order changes
```css
/* Bad - fragile and hard to maintain */
.datatable th:nth-child(1) { width: 80px !important; }
```

✅ **Use**: Semantic CSS classes applied directly to columns
```tsx
/* Good - explicit and maintainable */
<Column headerClassName="col-severity" bodyClassName="col-severity" />
```

### Why No `!important`?

The column width classes don't use `!important` because:

1. **PrimeReact Specificity**: PrimeReact's default column styles have reasonable specificity
2. **Cleaner CSS**: Avoids specificity wars and makes styles easier to override
3. **Better Maintainability**: Future developers can override these styles without needing `!important`
4. **CSS Best Practices**: Use specificity and source order instead of `!important` when possible

If you need to override these styles, you can use more specific selectors:
```css
/* Override column width when needed */
.my-custom-table .col-severity {
  width: 100px; /* This will work without !important */
}
```

## Refactoring Benefits

The refactoring reduced code by ~40%:
- **Before**: ~1,050 lines total
- **After**: ~620 lines total + shared files

### Improvements:
1. **Eliminated Duplication**: Card styles repeated 4x → now shared
2. **Consolidated DataTables**: Column widths repeated 6x → now shared
3. **Simplified Overrides**: Warning tags 8 selectors → 2 selectors
4. **CSS Variables**: Hardcoded values → reusable tokens
5. **Better Maintainability**: Single source of truth for styles

## Adding New Components

When creating a new component:

1. **Use existing variables**:
```css
.new-component {
  color: var(--text-primary);
  padding: var(--space-lg);
}
```

2. **Extend base styles where possible**:
```html
<div className="base-card new-component">
```

3. **Create component file only if needed**:
- If styles are minimal, use inline styles or utility classes
- If styles are substantial, create `components/NewComponent.css`

4. **Import in agents.css**:
```css
@import './components/NewComponent.css';
```

## Testing Styles

After making changes:
1. Check responsive behavior (mobile, tablet, desktop)
2. Test dark/light themes if applicable
3. Verify browser compatibility
4. Check print styles if relevant

## Performance

- CSS is loaded via imports, bundled by build tool
- Variables add minimal overhead (~1KB)
- Shared styles reduce overall bundle size
- No runtime JavaScript for styling

