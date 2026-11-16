export default {
  plurals: {
    singular: 'Klassifikation',
    plural: 'Klassifikationen',
  },
  buttons: {
    createClassification: 'Klassifikation hinzufügen',
  },
  titles: {
    general: 'Details',
    path: 'Pfad',
    validity: 'Gültigkeit',
    classification: 'Klassifikation',
  },
  tables: {
    classifications: {
      emptyText: 'Keine Klassifikation gefunden',
      name: 'Name',
      validFrom: 'Gültig von',
      validTo: 'Gültig bis',
    },
    mixinAttributes: {
      emptyText: 'Noch keine Felder in diesem Schemata',
      name: 'Name',
      readOnly: 'Schreibgeschützt',
      required: 'Erforderlich',
      nullable: 'Nullierbar',
      localized: 'Lokalisiert',
    },
  },
  toasts: {
    successCreateClassification: 'Klassifikation erfolgreich erstellt',
    successEditClassification: 'Klassifikation erfolgreich aktualisiert',
    successDeleteClassifications: 'Klassifikation erfolgreich gelöscht',
    errorFetchClassifications: 'Fehler beim Laden der Klassifizierungen.',
    errorFetchClassification: 'Fehler beim Laden der Klassifizierung.',
    errorDeleteClassification: 'Fehler beim Löschen von Klassifizierungen.',
    errorEditClassification:
      'Aktualisierung der Klassifizierung fehlgeschlagen',
    errorCreateClassification: 'Erstellen der Klassifizierung fehlgeschlagen',
    errorFetchSchemas:
      'Fehler beim Laden der Emporix-Klassifizierungsschemata.',
    errorConflict:
      'Die Klassifizierung mit dem bereitgestellten Code existiert bereits.',
  },
  labels: {
    custom: 'Benutzerdefiniert',
    always: 'Immer',
    newSchema: 'Neues Klassifikationsschemata',
    noSchema: 'Es wurde noch kein Klassifizierungsschemata definiert.',
    added: 'Hinzugefügt',
    deleted: 'Gelöscht',
    changed: 'Geändert',
    applyVersion: '{{version}} Version anwenden',
  },
  tabs: {
    details: 'Details',
    path: 'Pfad',
    validity: 'Gültigkeit',
    classification: 'Klassifikation',
  },
  forms: {
    general: {
      fields: {
        name: 'Name',
        code: 'Code',
        description: 'Beschreibung',
      },
    },
    path: {
      fields: {
        parent: 'Parent',
        position: 'Position',
      },
    },
    classification: {
      fields: {
        schemaType: 'Schematatyp',
        required: 'Erforderlich',
        schema: 'Mixins Schemata',
        key: 'Key',
        schemaUrl: 'Schemata URL',
      },
      labels: {
        emporixSchema: 'Emporix Mixins Schemata',
        ownSchema: 'Mein eigenes Mixins Schemata',
        required: 'Erforderlich',
      },
      errors: {
        invalidName:
          'Der Schlüssel muss einem einfachen, standardisierten Format folgen: nur Buchstaben und Zahlen sowie Unterstriche (_) und Bindestriche (-).',
      },
    },
    validity: {
      fields: {
        type: 'Gültigkeitstyp',
        validFrom: 'Gültig von',
        validTo: 'Gültig bis',
        published: 'Veröffentlicht',
      },
    },
  },
  tooltips: {
    required:
      'Das Feld gibt an, ob das Mixin für Produkte dieser Kategorie erforderlich ist.',
    key: 'Der Schlüssel darf nur Buchstaben, Zahlen, Unterstriche (_) und Bindestriche (-).',
    schemaUrl:
      'Die URL muss mit „http://" oder „https://" beginnen und auf ein gültiges JSON-Schema verweisen.',
  },
}
