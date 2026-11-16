export default {
  title: 'Kategorien',
  singular: 'Kategorie',
  plural: 'Kategorien',
  addNewCategory: 'Neue erstellen',
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
  displayType: {
    list: 'Liste',
    tree: 'Baum',
  },
  tree: {
    addAbove: 'Darüber hinzufügen',
    addChild: 'Unterkategorie hinzufügen',
    addBelow: 'Darunter hinzufügen',
    details: {
      empty:
        'Wählen Sie eine Kategorie aus, um ihre Details zu sehen und zu bearbeiten.',
      openFullEdit: 'Vollständig bearbeiten',
      positionTaken:
        'Gleiche Position wie {{names}}. Ihre Reihenfolge ist nicht festgelegt.',
      positionTakenMore:
        'Gleiche Position wie {{names}} und {{more}} weitere. Ihre Reihenfolge ist nicht festgelegt.',
    },
    newCategory: {
      title: 'Neue Kategorie',
      above: 'Oberhalb von {{name}}',
      below: 'Unterhalb von {{name}}',
      child: 'Unterkategorie von {{name}}',
      topLevel: 'Oberste Ebene',
    },
  },
  actions: {
    batchDelete: {
      success: '{{numberOfCategories}} Kategorie(n) gelöscht',
      failedSingle: 'Kategorie {{categoryName}} konnte nicht gelöscht werden',
    },
    move: {
      error: 'Fehler beim Ändern der Reihenfolge der Kategorie',
    },
    rebuild: {
      error: 'Der Kategoriebaum konnte nicht aktualisiert werden',
    },
  },
  edit: {
    title: 'Kategorie',
    toast: {
      update: {
        success: 'Kategorie aktualisiert!',
        error: 'Kategorie kann nicht gespeichert werden',
      },
      create: {
        success: 'Kategorie erstellt!',
      },
      fetch: {
        error: 'Kategorie kann nicht geladen werden',
      },
    },
    validation: {
      required: 'Pflichtfeld',
    },
    tab: {
      details: {
        id: 'Id',
        title: 'Details',
        name: 'Name',
        description: 'Beschreibung',
        slug: 'Slug',
        code: 'Code',
        ecn: 'ECNs',
        position: 'Position',
        comma: 'Please press " , " or "Enter ↵" to separate elements',
      },
      path: {
        title: 'Pfad',
        parent: 'Parent',
      },
      validity: {
        title: 'Gültigkeit',
        type: 'Typ',
        custom: 'Custom',
        always: 'Immer',
        never: 'Nie',
        from: 'Gültig von',
        to: 'Gültig bis',
        index: 'Indizierung',
        navigation: 'Navigation',
        published: 'Veröffentlicht',
      },
      tooltip: {
        id: 'Eindeutige Id der Kategorie. Sie wird generiert, wenn sie nicht vergeben wird.',
      },
      seo: {
        title: 'SEO',
      },
      media: {
        title: 'Medien',
      },
    },
    save: 'Speichern',
  },
  media: {
    backToMedia: 'Media',
    editTitle: 'Bearbeiten Media Image',
    errors: { update: 'Feheler während der Aktualisierung' },
    success: { update: 'Bild erfolgreich aktualisiert' },
    form: { name: 'Name*' },
    toast: {
      singleDeleteSuccess: 'Bild wurde gelöscht!',
      bulkDeleteSuccess: '{{itemsLength}} Bild wurde gelöscht',
      downloadFailure: 'Fehler beim Herunterladen von {{filename}}',
    },
    confirm: {
      singleDelete: 'Bild löschen?',
      bulkDelete: '{{itemsLength}} Bilder löschen?',
      deleteDescription: 'Diese Aktion kann nicht rückgängig gemacht werden.',
    },
    choose: 'Auswählen',
    upload: 'Hochladen',
    clear: 'Zurücksetzen',
    dropImageHere: 'Bild hierher ziehen und ablegen',
    removeFile: 'Datei entfernen',
    selectAsset: '{{name}} auswählen',
    openAsset: '{{name}} öffnen',
    fileUploaderTitle: 'Bilder hochladen',
  },
}
