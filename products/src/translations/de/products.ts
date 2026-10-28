export default {
  title: 'Produkte',
  singular: 'Produkt',
  plural: 'Produkte',
  types: {
    BASIC: 'Basis',
    BUNDLE: 'Bündel',
    VARIANT: 'Variante',
    PARENT_VARIANT: 'Parent Variante',
    DYNAMIC_VARIANT: 'Variantenhierarchie',
  },
  createModal: {
    title: 'Neues Produkt anlegen',
    submit: '{{name}} erstellen',
    choose: 'Auswählen',
    basic: {
      title: 'Basis',
      desc1: 'Standard-Einzelprodukt anlegen',
    },
    bundle: {
      title: 'Bündel',
      desc1: 'Sets aus verschiedenen Produkten und Optionen',
    },
    parentVariant: {
      title: 'Variante',
      desc1: 'Gleiches Produkt mit verschiedenen Optionen (vorlagenbasiert)',
    },
    dynamicVariant: {
      title: 'Variantenhierarchie',
      desc1: 'Flexible mehrstufige Varianten ohne feste Vorlage',
    },
    subscription: {
      title: 'Abonnement',
      desc1: 'Abonnementprodukt mit wiederkehrenden Konditionen',
    },
  },
  recalculateVariants: {
    action: 'Variantenbäume neu berechnen',
    success:
      'Neuberechnung eingereiht: {{jobCount}} Job(s). Übersprungene IDs (aktiver Job): {{skipped}}.',
    error: 'Neuberechnung der Varianten konnte nicht gestartet werden.',
  },
  toasts: {
    successDeleteProducts: '{{count}} Produkt(e) gelöscht',
    successImportProducts: 'Produkte importiert',
  },
  dynamicVariant: {
    plurals: {
      singular: 'Attribut',
      plural: 'Attribute',
    },
    titles: {
      hierarchy: 'Produkthierarchie',
      addAttribute: 'Attribut hinzufügen',
      editAttribute: 'Attribut bearbeiten',
    },
    buttons: {
      add: 'Hinzufügen',
    },
    labels: {
      sellable: 'Verkäuflich',
      published: 'Veröffentlicht',
      product: 'Produkt',
      variant: 'Variante',
      local: 'Lokal',
      inherited: 'Vererbt',
      draftNewChild: 'Neue Variante (ungespeichert)',
      addChild: 'Untervariante hinzufügen',
      addSibling: 'Variante auf gleicher Ebene hinzufügen',
    },
    dialogs: {
      deleteTreeNode: {
        title: 'Dieses Produkt löschen?',
        text1: 'Möchten Sie das Produkt wirklich löschen?',
        text2: '{{count}} Variante(n) würden ebenfalls gelöscht.',
      },
      discardDraft: {
        title: 'Ungespeicherte Variante verwerfen?',
        text: 'Sie haben einen ungespeicherten Variantenentwurf. Beim Verlassen wird dieser verworfen.',
      },
      deleteAttribute: {
        title: 'Dieses Attribut entfernen?',
        text: 'Das Attribut wird beim Speichern des Produkts aus den lokalen Attributen entfernt.',
      },
    },
    tables: {
      attributes: {
        emptyText: 'Noch kein lokales Attribut hinzugefügt',
        localAttribute: 'Lokales Attribut',
        inheritedAttribute: 'Vererbte Attribut',
        value: 'Wert',
      },
    },
    forms: {
      attribute: {
        dynamicType: 'Variantenebenen-Typ',
        key: 'Schlüssel',
        name: 'Name',
        type: 'Typ',
        valueLabel: 'Anzeigewert',
        value: 'Wert',
        unit: 'Einheit',
      },
    },
    toasts: {
      successDeleteProduct: 'Produkt erfolgreich gelöscht',
      errorDeleteProduct: 'Fehler beim Löschen des Produkts',
    },
    warnings: {
      warningCycle:
        'In dieser Variantenhierarchie wurde ein Zirkelverweis erkannt.',
      warningMissingAncestor:
        'Fehlendes übergeordnetes Produkt in der Hierarchie (ID: {{id}}). Führen Sie nach der Datenkorrektur eine Neuberechnung durch.',
    },
    tooltips: {
      resetToInherited: 'Auf den vererbten Wert zurücksetzen',
      inherited: 'Vom Elternteil geerbt',
    },
  },
  table: {
    id: 'ID',
    name: 'Name',
    code: 'Code',
    image: 'Bild',
    imageUrl: 'Bild url',
    productType: 'Produkttyp',
    price: 'Preis',
    filters: {
      id: 'Filtern nach Produkt ID',
      name: 'Filtern nach Produktname',
      code: 'Filtern vach Code',
      productType: 'Filtern nach Produkttyp',
    },
    actions: 'Aktionen',
    missingProduct: 'Zugewiesenes Produkt nicht gefunden',
    vendor: 'Lieferant',
    vendorName: 'Lieferant',
  },
  variant: {
    variantOf: 'Variante von',
    openConfiguration: 'Konfiguration öffnen',
  },
  createNew: 'Neues Produkt hinzufügen',
  importCSV: 'Aus CSV importieren',
  import: {
    header: 'PRODUKTDATENIMPORT',
    label: 'CSV Datei für den Import wählen',
  },
  edit: {
    save: 'Produktdaten speichern',
    title: 'Produkt bearbeiten',
    create: 'Produkt erstellen',
    toast: {
      update: {
        success: 'Produkt erfolgreich aktualisiert!',
        error: 'Fehler beim Aktualisieren der Produktdaten',
      },
      create: {
        success: 'Produkt erfolgreich erstellt!',
      },
      parentVariantDoesNotExist: {
        title: 'Die übergeordnete Variante existiert nicht',
        message: 'Die übergeordnete Variante für die Variante existiert nicht.',
      },
    },
    tab: {
      general: {
        title: 'Allgemein',
        name: 'Name',
        image: 'Bild',
        code: 'Code',
        published: 'Veröffentlicht',
        description: 'Beschreibung',
        brand: 'Marke',
        brandPlaceholder: 'Marke selektieren',
        label: 'Label',
        labelPlaceholder: 'Label selektieren',
        weightDependent: 'Gewichtsabhängig',
        category: 'Kategorien',
        categoryAssignment: 'Kategorie zuweisen',
        information: 'Details',
        attributes: 'Attribute',
        brandAndLabel: 'Marke & Labels',
        productTemplate: 'Produkttemplate',
        productTemplateVersion: 'Version Produkttemplate',
        id: 'Id',
        vendor: 'Vendor',
        tooltip: {
          id: 'Eindeutige Id des Produkts. Sie wird generiert, wenn sie nicht vergeben wird.',
          weightDependent:
            'Markieren Sie das Produkt als gewichtsabhängig, wenn sich der Preis der Position nach der Verpackung ändern könnte, da dies erforderlich ist, um sicherzustellen, dass Kreditkartenzahlungen autorisiert werden können.',
        },
      },
      categories: {
        title: 'Kategorien',
      },
      custom: {
        title: 'EF Kundendaten',
        brandName: 'Markenname',
        material: 'Material',
      },
      prices: {
        title: 'Preis',
        taxTitle: 'Steuerkonfiguration',
        columns: {
          site: 'Site',
          price: 'Preis',
          country: 'Land',
          taxClass: 'Steuerklasse',
        },
        dialog: {
          titleAdd: 'Preis hinzufügen',
          titleEdit: 'Preis bearbeiten',
          submitEdit: 'Speichern',
          delete: 'Preis löschen',
        },
        form: {
          price: 'Preis',
          currency: 'Währung',
          site: 'Site',
          validFrom: 'Gültig von ',
          validTo: 'Gültig bis',
          addPrice: 'Preis hinzufügen',
          country: 'Land',
          selectTaxCountry: 'Steuerland selektieren',
          selectTaxClass: 'Steuerklasse selektieren',
          selectCountry: 'Land selektieren',
          countryEmptyMessage: 'Steuerkonfiguration ist leer',
          saveTaxClasses: 'Steuerklassen speichern',
          discountType: 'Rabatttyp',
          discountPercentage: 'Prozentualer Rabatt',
          discountAbsolute: 'Rabattbetrag',
        },
        toast: {
          editSuccess: 'Produktpresi aktualisiert!',
          addSuccess: 'Produktpreis hinzugefügt!',
          deleteSuccess: 'Produktpreis gelöscht!',
          taxClassEditSuccess: 'Steuerklassen aktualisiert!',
        },
      },
      availability: {
        title: 'Verfügbarkeit',
        columns: {
          site: 'Site',
          stockLevel: 'Lagerbestand',
          distributionChannel: 'Vertriebskanal',
        },
        record: {
          general: 'Allgemein',
        },
        toast: {
          saved: 'Verfügbarkeit gespeichert',
          error: 'Verfügbarkeit konnte nicht gespeichert werden',
        },
        confirm: {
          collapseUnsaved: {
            title: 'Nicht gespeicherte Änderungen verwerfen?',
            message:
              'Diese Verfügbarkeit hat nicht gespeicherte Änderungen. Verwerfen und schließen?',
          },
        },
        dialog: {
          titleAdd: 'Verfügbarkeit hinzufügen',
          titleEdit: 'Verfügbarkeit bearbeiten',
          submitEdit: 'Speichern',
          stockLevel: 'Lagerbestand',
          popularity: 'Bedeutung',
          distributionChannel: 'Vertriebskanal',
        },
      },
      media: {
        tabTitle: 'Medien',
        title: 'Bild',
        deleteBatch: 'Löschen',
        useAsMain: 'Als Hauptbild nutzen',
        deleteImage: 'Bild löschen',
        addImage: 'Bild hinzufügen',
      },
      demo: {
        tabTitle: 'Demo-Funktion',
      },
      images: {
        tabTitle: 'Bilder',
      },
      attributes: {
        title: 'Attribute & Varianten',
        addNewAttribute: 'Neues Attribut hinzufügen',
        attribute: 'Attribute',
        options: 'Attributwerte',
        save: 'Speichern',
        delete: 'Löschen',
        variants: {
          title: 'Varianten',
          columns: {
            productId: 'Produkt ID',
            isParent: 'Parent',
            variant: 'Variante',
            price: 'Preis',
            availability: 'Verfügbarkeit kombiniert',
          },
          actions: {
            create: 'Neue Variante erstellen',
            edit: 'Variante bearbeiten',
            createDialog: {
              title: 'Neue Variante erstellen',
              message: 'Möchten Sie eine neue Variante erstellen?',
            },
          },
        },
      },
      linked: {
        title: 'Verlinkte Produkte',
        add: 'Verlinkte Produkte hinzufügen',
        remove: 'Verknüpfung entfernen',
        table: {
          emptyText: 'Sie haben noch kein verlinktes Produkt',
          emptyLink: '+ Neues verlinktes Produkt hinzufügen',
        },
        columns: {
          name: 'Produktname',
          type: 'Typ',
          image: 'Bild',
          id: 'Produkt ID',
        },
        types: {
          consumable: 'Verbrauchsmaterial',
          accessory: 'Zubehör',
          'you-might-like-this': 'You might like this',
          'suggested-related-items': 'Suggested related items',
          'similar-items': 'Similar items',
        },
        dialogTitle: 'Verlinktes Produkt hinzufügen',
        productDoesNotExist: 'Produkt existiert nicht',
        selectedProducts: 'Produkte selektieren:',
        noProductSelected: 'Sie haben noch kein Produkt selektiert...',
      },
      bundle: {
        title: 'Bündel',
        add: 'Bündelprodukt hinzufügen',
        remove: 'Aus Bündel entfernen',
        table: {
          emptyText: 'Sie haben noch kein Bündelprodukt',
          emptyLink: '+ Neues Bündelprodukt hinzufügen',
        },
        columns: {
          name: 'Produktname',
          amount: 'Menge im Bündel',
          image: 'Bild',
          id: 'Produkt-ID',
        },
        dialogTitle: 'Bündelprodukte hinzufügen',
        selectedProducts: 'Produkte selektieren:',
        noProductSelected: 'Sie haben noch kein Produkt selektiert...',
      },
    },
    productsSearch: {
      searchPlaceholder: 'Produkt suchen ...',
      emptySelected: 'Sie haben noch kein Produkt selektiert...',
      selected: 'Produkte selektieren:',
      submitAdd: 'Produkte hinzufügen',
    },
    inheritedFromParent: 'Vom übergeordneten Produkt geerbt',
  },
  attributes: {
    willProduceVariants: 'Erzeugt Varianten mit Attributen: ',
    withValues: ' mit Werten:',
  },
  toast: {
    errorCreateValidation:
      'Produkt kann aufgrund eines Validierungsfehlers nicht erstellt werden. Weitere Informationen finden Sie in den Konsolenprotokollen.',
    errorCreateConflict:
      'Produkt kann nicht erstellt werden, da ein Produkt mit diesem Code oder dieser ID bereits im System vorhanden ist.',
    errorCreateInternal:
      'Produkt kann nicht erstellt werden. Weitere Informationen finden Sie in den Konsolenprotokollen.',
    errorUpdateValidation:
      'Produkt kann aufgrund eines Validierungsfehlers nicht aktualisiert werden. Weitere Informationen finden Sie in den Konsolenprotokollen.',
    errorUpdateConflict:
      'Produkt kann nicht aktualisiert werden, da ein Produkt mit diesem Code oder dieser ID bereits im System vorhanden ist.',
    errorUpdateInternal:
      'Produkt kann nicht aktualisiert werden. Weitere Informationen finden Sie in den Konsolenprotokollen.',
  },
  dialogs: {
    addProducts: {
      title: 'Produkte hinzufügen',
      submit: 'Produkte hinzufügen',
      selectedProducts: 'Ausgewählte Produkte:',
      noProductSelected: 'Es wurde noch kein Produkt ausgewählt...',
    },
  },
}
