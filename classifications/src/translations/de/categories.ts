// The `categories.*` keys the shared category tree uses, kept under MD's
// names: MD shows the same texts for classifications.
export default {
  title: 'Kategorien',
  addNewCategory: 'Neue erstellen',
  table: {
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
    move: {
      error: 'Fehler beim Ändern der Reihenfolge der Kategorie',
    },
    rebuild: {
      error: 'Der Kategoriebaum konnte nicht aktualisiert werden',
    },
  },
  edit: {
    toast: {
      update: {
        success: 'Kategorie aktualisiert!',
        error: 'Kategorie kann nicht gespeichert werden',
      },
      create: {
        success: 'Kategorie erstellt!',
      },
    },
    validation: {
      required: 'Pflichtfeld',
    },
    tab: {
      details: {
        id: 'Id',
        name: 'Name',
        description: 'Beschreibung',
        slug: 'Slug',
        code: 'Code',
        position: 'Position',
      },
      validity: {
        published: 'Veröffentlicht',
      },
      tooltip: {
        id: 'Eindeutige Id der Kategorie. Sie wird generiert, wenn sie nicht vergeben wird.',
      },
    },
  },
}
