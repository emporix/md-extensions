export default {
  title: 'Produkte',
  singular: 'Produkt',
  plural: 'Produkte',
  types: {
    BASIC: 'Basis',
    BUNDLE: 'Bündel',
    VARIANT: 'Variante',
    PARENT_VARIANT: 'Parent Variante',
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
      type: 'Filtern nach Produkttyp',
    },
    actions: 'Aktionen',
  },
  variant: {
    variantOf: 'Dieses Produkt ist Variante von',
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
        id: 'id',
        tooltip: {
          id: 'Eindeutige Id des Produkts. Sie wird generiert, wenn sie nicht vergeben wird.',
          weightDependent:
            'Markieren Sie das Produkt als gewichtsabhängig, wenn sich der Preis der Position nach der Verpackung ändern könnte, da dies erforderlich ist, um sicherzustellen, dass Kreditkartenzahlungen autorisiert werden können.',
        },
      },
      categories: {
        title: 'Kategorien',
      },
      suppliers: {
        tabTitle: 'Lieferanten',
        title: 'Lieferanten',
        suppliers: 'Lieferanten',
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
        toast: {
          bulkDeleteSuccess: '{{itemsLength}} Bild wurde gelöscht',
        },
        fileUploaderTitle: 'Bilder hochladen',
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
        },
        dialogTitle: 'Bündelprodukte hinzufügen',
      },
    },
    productsSearch: {
      searchPlaceholder: 'Produkt suchen ...',
      emptySelected: 'Sie haben noch kein Produkt selektiert...',
      selected: 'Produkte selektieren:',
      submitAdd: 'Produkte hinzufügen',
    },
  },
  attributes: {
    willProduceVariants: 'Erzeugt Varianten mit Attributen: ',
    withValues: ' mit Werten:',
  },
  mixins: {
    addNew: 'Neu hinzufügen',
    emptyArray:
      'Das Array vom Typ {{type}} ist leer. Keine Elemente zum Anzeigen.',
  },
  actions: {
    delete: {
      title: 'Löschen',
      message: 'Produkt löschen?',
    },
    batchDelete: 'Produkte löschen',
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
}
