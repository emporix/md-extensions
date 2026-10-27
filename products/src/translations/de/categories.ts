export default {
  actions: {
    move: {
      error: 'Fehler beim Ändern der Reihenfolge der Kategorie',
    },
  },
  table: {
    id: 'Id',
    position: 'Position',
    code: 'Code',
    slug: 'Slug',
    name: 'Kategoriename',
    published: 'Veröffentlicht',
    localizedName: 'Kategoriename',
    localizedSlug: 'Slug',
    select: 'Auswählen',
    actions: 'Aktionen',
    validity: {
      from: 'Gültig von',
      to: 'Gültig bis',
    },
  },
  media: {
    choose: 'Auswählen',
    upload: 'Hochladen',
    clear: 'Zurücksetzen',
    dropImageHere: 'Bild hierher ziehen und ablegen',
    dropFileHere: 'Datei hierher ziehen und ablegen',
    toast: {
      singleDeleteSuccess: 'Bild wurde gelöscht!',
      bulkDeleteSuccess: '{{itemsLength}} Bild wurde gelöscht',
      deleteFailure: 'Bild konnte nicht gelöscht werden',
      downloadFailure: 'Fehler beim Herunterladen von {{filename}}',
    },
    confirm: {
      singleDelete: 'Bild löschen?',
      bulkDelete: '{{itemsLength}} Bilder löschen?',
    },
  },
}
