export default {
  title: 'Gutschein',
  addNewCoupon: 'Gutschein hinzufügen',
  singular: 'Gutschein',
  plural: 'Gutscheine',
  table: {
    columns: {
      code: 'Code',
      name: 'Name',
      discountType: 'Rabatttyp',
      discountPercentage: 'Prozentualer Rabatt',
      discountAbsolute: 'Rabattbetrag',
      redemptionCount: 'Zahl der Einlösungen',
      categoriesCoupon: 'Kategorie-Rabatt',
    },
  },
  type: {
    freeShipping: 'Kostenloser Versand',
    percent: 'Prozentual',
    absolute: 'Betrag',
  },
  calculationType: {
    subtotal: 'Zwischensumme',
    total: 'Summe',
  },
  toast: {
    fetchError: 'Fehler beim Laden der Gutscheine',
    deleteSuccess: 'Gutschein erfolgreich gelöscht',
    deleteError: 'Gutscheine konnten nicht gelöscht werden: {{codes}}',
    deletedCodes: 'Gelöscht: {{codes}}',
  },
  edit: {
    title: 'Gutschein bearbeiten',
    tab: {
      details: {
        title: 'Generell',
        name: 'Name',
        code: 'Code',
        description: 'Beschreibung',
      },
      type: {
        title: 'Typ',
        discountType: 'Rabatttyp',
        percentage: 'Prozentualer Rabatt',
        absolute: 'Rabattbetrag',
        currency: 'Währung',
        calculationBase: 'Berechnungsgrundlage',
      },
      rules: {
        title: 'Regeln',
        validityAndValue: 'Gültigkeit & Wert',
        restriction: 'Einschränkung',
        minimumOrderTotal: 'Mindestbestellwert',
        currency: 'Währung',
        validFrom: 'Gültig von',
        validUntil: 'Gültig bis',
        validFor: 'Gültig für Kunden',
        segments: 'Gültig für Segmente',
        appliesTo: {
          title: 'Anwendbar auf',
          hint: 'Wählen Sie, wer diesen Gutschein verwenden kann.',
          allCustomers: 'Alle Kunden',
          allCustomersHint:
            'Jeder kann diesen Gutschein verwenden, auch anonyme Kunden.',
          registeredCustomers: 'Registrierte Kunden',
          registeredCustomersHint:
            'Nur Kunden, die mit einem registrierten Konto angemeldet sind.',
          specificCustomer: 'Bestimmte Kunden',
          specificCustomerHint:
            'Wählen Sie einzelne Kundenkonten, die diesen Gutschein verwenden können.',
          customerSegments: 'Kundensegmente',
          customerSegmentsHint:
            'Der Gutschein gilt für ausgewählte Kundengruppen.',
          categories: 'Kategorien',
          categoriesHint:
            'Der Gutschein gilt nur für Produkte in ausgewählten Kategorien.',
        },
        vendorRestricted: 'Lieferantenspezifisch',
        vendorRestrictedHint:
          'Schränken Sie diesen Gutschein zusätzlich zur Kundenbeschränkung auf ausgewählte Lieferanten ein.',
        vendors: 'Gültig für Lieferanten',
      },
      categories: {
        title: 'Kategorien',
        categoryRestricted: 'Kategorien eingeschränkt',
        includedCategories: 'Eingeschlossene Kategorien',
        excludedCategories: 'Ausgeschlossene Kategorien',
        selectIncludedCategories: 'Eingeschlossene Kategorien auswählen',
        selectExcludedCategories: 'Ausgeschlossene Kategorien auswählen',
      },
      coupons: {
        type: {
          freeShipping: 'Gratis Versand',
          percent: 'Prozentual',
          absolute: 'Betrag',
        },
      },
    },
    errors: {
      fetching: {
        title: 'Fehler beim Laden des Gutscheins',
      },
    },
    validation: {
      required: 'Dieses Feld ist erforderlich',
      codeReserved:
        'Der Code "add" ist reserviert. Wählen Sie einen anderen Code.',
      percentageRange: 'Geben Sie einen Prozentsatz zwischen 0 und 100 ein',
      amountNonNegative: 'Der Betrag darf nicht negativ sein',
      validityOrder: 'Das Enddatum muss nach dem Startdatum liegen',
      customersRequired: 'Wählen Sie mindestens einen Kunden aus',
      segmentsRequired: 'Wählen Sie mindestens ein Segment aus',
      categoriesRequired:
        'Wählen Sie mindestens eine eingeschlossene oder ausgeschlossene Kategorie aus',
      categoriesNotForFreeShipping:
        'Gutscheine für Gratis Versand können nicht auf Kategorien beschränkt werden',
      categoriesOverlap:
        'Eine Kategorie kann nicht gleichzeitig eingeschlossen und ausgeschlossen sein',
    },
    toast: {
      mixinSave: {
        error: 'Fehler beim Speichern der Mixins des Gutscheins',
      },
      invalidForm: 'Bitte korrigieren Sie die markierten Felder',
      update: {
        success: 'Gutschein wurde erfolgreich aktualisiert!',
        error: 'Fehler beim Aktualisieren des Gutscheins',
      },
      create: {
        success: 'Gutschein wurde erfolgreich erstellt!',
        error: {
          default: 'Fehler beim Erstellen des Gutscheins',
          duplicate:
            'Doppelter Gutschein "{{code}}" auf Tenant "{{tenant}}". Wenn der Gutschein zuvor existierte, kann das Speichern durch Ihre Systemeinstellungen blockiert sein (Systemeinstellungen -> Dauerhaftes Löschen von Gutscheinen).',
        },
      },
      successBatchDelete: 'Gutscheine erfolgreich gelöscht!',
    },
  },
}
