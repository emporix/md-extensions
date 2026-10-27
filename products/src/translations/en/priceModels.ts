export default {
  title: 'Price Models',
  singular: 'Price Model',
  plural: 'Price Models',
  addPriceModel: 'Add new price model',
  table: {
    columns: {
      name: 'Name',
      type: 'Type',
      units: 'Units',
      product: 'Product',
    },
    filters: {
      name: 'Filter by name',
      allTypes: 'All types',
      allUnits: 'All units',
    },
  },
  form: {
    addTitle: 'Create a new price model',
    editTitle: 'Edit [{{name}}]',
    details: 'Details',
    rules: 'Rules',
    netPrice: 'Net Price',
    grossPrice: 'Gross Price',
    label: {
      id: 'Id',
      name: 'Name',
      description: 'Description',
      model: 'Model',
      units: 'Unit of measurement',
      unitsQuantity: 'Quantity of unit measurement',
      price: 'Price',
      minQuantity: 'Min. Quantity',
      default: 'Default',
      tier: 'tier {{index}}',
    },
    tooltip: {
      id: 'Unique Id of the price model. It will be generated if not provided.',
    },
    placeholder: {
      units: 'All units',
    },
  },
  tabs: {
    settings: 'Settings',
    products: 'Products',
  },
  message: {
    success: {
      create: 'New Price model created!',
      edit: 'Price model edited!',
      deleted: 'Price model was deleted',
      productPrices: 'Product prices was edited!',
    },
    error: {
      create: 'Error while creating price model',
      edit: 'Error while editing price model',
      deleted: 'Error while deleting price model',
      productPrices: 'Error while editing product prices',
    },
  },
  noUnitFound: 'No unit found',
}
