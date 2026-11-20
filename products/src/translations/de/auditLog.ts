export default {
  entities: {
    employee: 'Benutzer',
    group: 'Gruppe',
    'group-assignment': 'Gruppenzuweisung',
    product: 'Produkt',
  },
  changeTypes: {
    created: 'Erstellt',
    updated: 'Aktualisiert',
    deleted: 'Gelöscht',
  },
  entityChangelog: {
    tab: 'Audit-Protokoll',
    empty: 'Keine Audit-Protokolleinträge im ausgewählten Zeitraum',
    notSet: 'Nicht gesetzt',
    table: {
      field: 'Feld',
      previousValue: 'Vorheriger Wert',
      updatedValue: 'Aktualisierter Wert',
    },
  },
  loadError: 'Das Audit-Protokoll konnte nicht geladen werden.',
  retry: 'Erneut versuchen',
  rowsPerPage: 'Zeilen pro Seite',
  window: {
    label: 'Zeitraum',
    limitHint: 'Der Zeitraum ist auf 7 Tage begrenzt.',
  },
}
