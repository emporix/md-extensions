// Keys kept from the Management Dashboard `catalogs` namespace, plus the
// fetch-error title and toasts MD did not have.
export default {
  title: 'Kataloge',
  singular: 'Katalog',
  plural: 'Kataloge',
  addNewCatalog: 'Katalog hinzufügen',
  table: {
    publishedSites: '{{size}} Seite(n)',
    columns: {
      status: 'Status',
      name: 'Katalogname',
      publishedTo: 'Veröffentlicht am',
      visibilityStart: 'Sichtbar ab',
      visibilityEnd: 'Sichtbar bis',
      lastPublished: 'Letzte Veröffentlichung',
    },
  },
  edit: {
    title: 'Katalog bearbeiten',
    tab: {
      details: {
        title: 'Details',
        id: 'Id',
        name: 'Katalogname',
        description: 'Katalog Beschreibung',
      },
      categories: {
        title: 'Kategorien',
        categoryIds: 'Kategorien im Katalog',
        selectCategories: 'Kategorien für Katalog auswählen',
      },
      published: {
        title: 'Veröffentlicht',
        publishedTo: 'Seiten',
      },
      visibility: {
        title: 'Sichtbarkeit',
        from: 'Sichtbar ab',
        to: 'Sichtbar bis',
        visible: 'sichtbar',
      },
      tooltip: {
        id: 'Eindeutige Id des Katalogs. Sie wird generiert, wenn sie nicht vergeben wird.',
      },
    },
    errors: {
      fetching: {
        title: 'Katalog konnte nicht geladen werden',
      },
    },
    toast: {
      update: {
        success: 'Katalog erfolgreich aktualisiert.',
      },
      create: {
        success: 'Katalog erfolgreich erstellt.',
      },
    },
  },
  toasts: {
    error:
      'Etwas ist schiefgelaufen. Prüfen Sie die Eingaben oder versuchen Sie es später erneut.',
    errorFetch:
      'Fehler beim Laden der Kataloge. Bitte versuchen Sie es später erneut',
    errorDelete: 'Fehler beim Löschen des Katalogs {{id}}',
  },
}
