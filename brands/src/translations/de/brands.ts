export default {
  title: 'Marken',
  singular: 'Marke',
  plural: 'Marken',
  table: {
    columns: {
      name: 'Name',
      image: 'Bild',
      actions: 'Aktionen',
    },
    filters: {
      name: 'Nach Namen suchen',
    },
  },
  addBrand: 'Neue Marke hinzufügen',
  editBrand: 'Marke bearbeiten',
  dialog: {
    id: 'Id',
    titleAdd: 'Neue Marke hinzufügen',
    titleEdit: 'Marke bearbeiten',
    name: 'Name',
    desc: 'Beschreibung',
    image: 'Markenbild',
    submitAdd: 'Marke erstellen',
    submitEdit: 'Marke bearbeiten',
  },
  tabs: {
    details: 'Details',
    media: 'Medien',
  },
  toasts: {
    errorUpdate:
      'Fehler beim Aktualisieren des Marken. Überprüfe die Protokolle für weitere Details.',
    errorCreate:
      'Fehler beim Erstellen des Marken. Überprüfe die Protokolle für weitere Details.',
    errorFetch:
      'Fehler beim Abrufen des Marken. Überprüfe die Protokolle für weitere Details.',
    successUpdate: 'Marken erfolgreich aktualisiert',
    successCreate: 'Marken erfolgreich erstellt',
    errorDelete:
      'Fehler beim Löschen des Marken. Überprüfe die Protokolle für weitere Details.',
    successDelete: 'Marke {{name}} erfolgreich gelöscht',
  },
  noBrands: 'Es wurden noch keine Marken definiert',
  addFirstBrand: 'ERSTE MARKE ERSTELLEN',
  media: {
    choose: 'Auswählen',
    upload: 'Hochladen',
    clear: 'Zurücksetzen',
    dropImageHere: 'Bild hierher ziehen und ablegen',
    dropFileHere: 'Datei hierher ziehen und ablegen',
    toast: {
      uploadSuccess: '{{count}} Datei(en) hochgeladen',
      bulkDeleteSuccess: '{{itemsLength}} Bild(er) wurden gelöscht',
      deleteFailure: 'Bild konnte nicht gelöscht werden',
      downloadFailure: '{{filename}} konnte nicht heruntergeladen werden',
    },
    confirm: {
      singleDelete: 'Dieses Bild entfernen?',
      bulkDelete: '{{itemsLength}} Bilder entfernen?',
      deleteDescription: 'Diese Aktion kann nicht rückgängig gemacht werden.',
    },
  },
}
