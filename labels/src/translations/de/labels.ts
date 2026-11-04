export default {
  title: 'Labels',
  singular: 'Label',
  plural: 'Labels',
  table: {
    columns: {
      name: 'Name',
      image: 'Bild',
      actions: 'Aktionen',
    },
    filters: {
      name: 'Nach Namen filtern',
    },
  },
  addLabel: 'Label hinzufügen',
  editLabel: 'Label bearbeiten',
  dialog: {
    titleAdd: 'Neues Label erstellen',
    titleEdit: 'Label bearbeiten',
    name: 'Name',
    desc: 'Beschreibung',
    image: 'Bild',
    overlay: 'Als Überlagerung im Produktbild anzeigen',
    submitAdd: 'Label erstellen',
    submitSave: 'Label speichern',
    submitEdit: 'Label bearbeiten',
    overlayOptions: {
      none: 'Nicht als Produktbild-Überlagerung anzeigen',
      topLeft: 'Linke, obere Ecke',
      topRight: 'Rechte, obere Ecke',
      bottomLeft: 'Linke, untere Ecke',
      bottomRight: 'Rechte, untere Ecke',
    },
  },
  tabs: {
    details: 'Details',
    media: 'Medien',
  },
  toasts: {
    errorUpdate:
      'Fehler beim Aktualisieren des Labels. Überprüfe die Protokolle für weitere Details.',
    errorCreate:
      'Fehler beim Erstellen des Labels. Überprüfe die Protokolle für weitere Details.',
    errorFetch:
      'Fehler beim Abrufen des Labels. Überprüfe die Protokolle für weitere Details.',
    successUpdate: 'Label erfolgreich aktualisiert',
    successCreate: 'Label erfolgreich erstellt',
    errorDelete:
      'Fehler beim Löschen des Labels. Überprüfe die Protokolle für weitere Details.',
  },
  actions: {
    delete: 'Lösche Labels',
  },
  noLabels: 'Es wurden noch keine Labels erstellt',
  addFirstLabel: 'ERSTES LABEL ERSTELLEN',
  media: {
    choose: 'Auswählen',
    upload: 'Hochladen',
    clear: 'Zurücksetzen',
    dropImageHere: 'Bild hierher ziehen und ablegen',
    dropFileHere: 'Datei hierher ziehen und ablegen',
    selectAsset: '{{filename}} auswählen',
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
