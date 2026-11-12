// Keys kept from the Management Dashboard `units` namespace.
export default {
  title: 'Einheiten',
  singular: 'Einheit',
  plural: 'Einheiten',
  titleAdd: 'Neue Einheit hinzufügen',
  titleEdit: 'Einheit bearbeiten',
  table: {
    columns: {
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      type: 'Typ',
      factor: 'Faktor',
    },
  },
  form: {
    name: 'Name',
    code: {
      label: 'Code',
      placeholder: 'Code eingeben',
    },
    type: {
      label: 'Typ',
      placeholder: 'Typ selektieren oder eingeben',
    },
    symbol: {
      label: 'Symbol',
      placeholder: 'Symbol eingeben',
    },
    baseUnit: 'Basiseinheit',
    factor: 'Faktor',
  },
  toasts: {
    create: 'Einheit wurde erstellt!',
    edit: 'Einheit wurde bearbeitet!',
    noUnit: 'Einheit nicht gefunden. Bitte erstellen Sie eine Neue',
    error:
      'Ein Fehler ist aufgetreten. Überprüfen Sie die Formulardaten oder versuchen Sie es später.',
    errorFetch:
      'Fehler beim Laden der Einheiten. Bitte versuchen Sie es später erneut',
    errorDelete: 'Fehler beim Löschen der Einheit {{code}}',
  },
}
