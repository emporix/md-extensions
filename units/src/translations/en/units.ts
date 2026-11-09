// Keys kept from the Management Dashboard `units` namespace.
export default {
  title: 'Units',
  singular: 'Unit',
  plural: 'Units',
  titleAdd: 'Add New Unit',
  titleEdit: 'Edit Unit',
  table: {
    columns: {
      code: 'Code',
      name: 'Name',
      symbol: 'Symbol',
      type: 'Type',
      factor: 'Factor',
    },
  },
  form: {
    name: 'Name',
    code: {
      label: 'Code',
      placeholder: 'Enter code',
    },
    type: {
      label: 'Type',
      placeholder: 'Select or enter type',
    },
    symbol: {
      label: 'Symbol',
      placeholder: 'Enter symbol',
    },
    baseUnit: 'Base Unit',
    factor: 'factor',
  },
  toasts: {
    create: 'Unit was created!',
    edit: 'Unit was edited!',
    noUnit: 'Unit not found. Please create a new one',
    error: 'Something went wrong. Check form data or try later.',
    errorFetch: 'Error while loading units. Please try again later',
    errorDelete: 'Error while deleting unit {{code}}',
  },
}
