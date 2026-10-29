export default {
  title: 'Preismodelle',
  singular: 'Preismodell',
  plural: 'Preismodelle',
  addPriceModel: 'Neues Preismodell hinzufügen',
  table: {
    columns: {
      name: 'Name',
      type: 'Typ',
      units: 'Einheiten',
      product: 'Produkt',
    },
    filters: {
      name: 'Filtern nach Name',
      allTypes: 'Alle Typen',
      allUnits: 'Alle Einheiten',
    },
  },
  form: {
    addTitle: 'Neues Preismodell erstellen',
    editTitle: 'Bearbeiten [{{name}}]',
    details: 'Details',
    rules: 'Regeln',
    netPrice: 'Nettopreis',
    grossPrice: 'Bruttopreis',
    label: {
      id: 'Id',
      name: 'Name',
      description: 'Beschreibung',
      model: 'Modell',
      units: 'Einheiten',
      unitsQuantity: 'Menge der Einheiten',
      price: 'Preis',
      minQuantity: 'Min. Menge',
      default: 'Standard',
      tier: 'Staffel {{index}}',
    },
    tooltip: {
      id: 'Eindeutige Id des Preismodells. Sie wird generiert, wenn sie nicht vergeben wird.',
    },
    placeholder: {
      units: 'Alle Einheiten',
    },
  },
  tabs: {
    settings: 'Einstellungen',
    products: 'Produkte',
  },
  message: {
    success: {
      create: 'Neues Preismodell erstellt!',
      edit: 'Preismodell bearbeitet!',
      deleted: 'Preismodell gelöscht',
      productPrices: 'Produktpreis bearbeitet!',
    },
    error: {
      create: 'Fehler beim Erstellen des Preismodells',
      edit: 'Fehler beim Bearbeiten des Preismodells',
      deleted: 'Fehler beim Löschen des Preismodells',
      productPrices: 'Fehler beim Bearbeiten des Produktpreises',
    },
  },
  noUnitFound: 'Keine Einheit gefunden',
}
