# How to Create and Register a New Widget

This guide explains how to add a new dashboard widget: implement the component, register it, optionally add it to the default layout, and add translations.

---

## 1. Create the widget component

### Folder and file

- Create a folder under `src/dashboard/widgets/` named after the widget (PascalCase), e.g. `MyMetricWidget`.
- Add the main component file: `MyMetricWidget.tsx` (same name as the folder).

Example structure:

```
src/dashboard/widgets/
  MyMetricWidget/
    MyMetricWidget.tsx
```

### Component requirements

- The component is **renderless**: it receives **no props**. All data comes from hooks and context.
- Use `useDashboardContext()` to access:
  - `appState` (tenant, token, language, currency, permissions)
  - `site` (selected site: code, name, currency)
  - `timeRange` (from, to, preset)
- Use `useTranslation(appState?.language ?? 'en')` for labels and messages; use the same key as the widget id for the title (e.g. `t('widgets.myMetricWidget')`).
- The widget is rendered inside `WidgetCard` and `WidgetErrorBoundary` by the grid; you only implement the inner content.

### KPI-style widgets

- If the widget is a single metric (number + optional comparison), use the shared **`KpiMetricWidget`** component (see `GrossRevenueKpiWidget`).
- Name the widget id so it **ends with `Kpi`** (e.g. `myMetricKpi`). The grid uses this to apply KPI-specific styling (compact card). The check is `widgetId.toLowerCase().endsWith('kpi')`.

### Example: minimal KPI widget

```tsx
// src/dashboard/widgets/MyMetricWidget/MyMetricWidget.tsx
import { useDashboardContext } from '../../context/DashboardContext'
import { useTranslation } from '../../../shared/i18n'
import { KpiMetricWidget } from '../../components/KpiMetricWidget'

export const MyMetricWidget = () => {
  const { appState, site, timeRange } = useDashboardContext()
  const { t } = useTranslation(appState?.language ?? 'en')
  // Fetch data with a hook (e.g. useOrderStats, custom hook), then:
  return (
    <KpiMetricWidget
      icon={<i className="pi pi-chart-line" />}
      title={t('widgets.myMetricKpi')}
      loading={loading}
      error={error}
      isAvailable={true}
      unavailableMessage=""
      value={formattedValue}
      comparison={comparison} // optional: { percent, periodKey }
    />
  )
}
```

### Example: custom content widget

For charts, tables, or custom UI, implement a normal React component that uses `useDashboardContext()` and your data hooks. No special wrapper is required.

---

## 2. Register the widget

Edit **`src/dashboard/data/widgetRegistry.tsx`**:

1. **Import** the new component at the top:

   ```ts
   import { MyMetricWidget } from '../widgets/MyMetricWidget/MyMetricWidget'
   ```

2. **Add an entry** to the `WIDGET_REGISTRY` object. Use a **unique id** (camelCase, e.g. `myMetricKpi`). This id is used in the layout, translations, and “Add widget” dropdown.

   ```ts
   export const WIDGET_REGISTRY: Record<string, RegisteredWidget> = {
     // ... existing widgets ...
     myMetricKpi: {
       id: 'myMetricKpi',
       label: 'My Metric',
       defaultColSpan: 6,
       defaultRowSpan: 2,
       component: MyMetricWidget,
     },
   }
   ```

### Sizing (grid)

- The dashboard grid has **24 columns** and a **40px row height**.
- **defaultColSpan** / **defaultRowSpan** define the widget’s size when it is added via “Add widget” (and can be used for default layout).
- Typical values:
  - **KPI**: `defaultColSpan: 6`, `defaultRowSpan: 2` (or 3)
  - **Charts**: `defaultColSpan: 8`, `defaultRowSpan: 3`
  - **Tables**: `defaultColSpan: 8` or `12`, `defaultRowSpan: 4`–`6`
  - **Full-width**: `defaultColSpan: 12`, `defaultRowSpan: 4` or more

---

## 3. (Optional) Add to default layout

If the widget should appear on the dashboard for first-time users or when “Reset to defaults” is used, add it to **`src/dashboard/data/defaultLayout.ts`**.

- Import type: `GridLayoutItem` (already imported there).
- Add an object to the `DEFAULT_GRID_LAYOUT` array:

  ```ts
  { i: 'myMetricKpi', x: 0, y: 20, w: 6, h: 2, minW: 1, minH: 1 }
  ```

- **`i`**: must match the widget id in `WIDGET_REGISTRY`.
- **`x`, `y`**: position in the grid (x: 0–23, y: any non-negative).
- **`w`, `h`**: width and height in grid units; typically match `defaultColSpan` and `defaultRowSpan`.
- **`minW`, `minH`**: usually `1` to allow shrinking when resizing.

Place the widget where it doesn’t overlap others. Users can still add/remove/move widgets and save a custom layout.

---

## 4. Add translations

Widget labels are shown in the “Add widget” dropdown and in the widget card toolbar. Add a key under `widgets` for each language.

- **`src/shared/i18n/translations.en.ts`** (under `widgets`):

  ```ts
  widgets: {
    // ...
    myMetricKpi: 'My Metric',
  }
  ```

- **`src/shared/i18n/translations.de.ts`** (and any other locales):

  ```ts
  widgets: {
    // ...
    myMetricKpi: 'Meine Metrik',
  }
  ```

The key must be **`widgets.<widgetId>`** (e.g. `widgets.myMetricKpi`). The dashboard uses `t(\`widgets.${widgetId}\`)` with the registry label as fallback.

---

## Checklist

- [ ] Widget component in `src/dashboard/widgets/<WidgetName>/<WidgetName>.tsx`
- [ ] Component uses `useDashboardContext()` (and optionally `useTranslation`) and receives no props
- [ ] Import and entry in `src/dashboard/data/widgetRegistry.tsx` (id, label, defaultColSpan, defaultRowSpan, component)
- [ ] (Optional) Entry in `src/dashboard/data/defaultLayout.ts` if the widget should be in the default layout
- [ ] Translation keys under `widgets.<widgetId>` in `translations.en.ts` and other locale files

After that, the widget appears in the “Add widget” dropdown in customize mode and can be placed, resized, and removed like the existing widgets.
