// Keys kept from the Management Dashboard `quotesReasons` namespace.
export default {
  title: 'Status codes',
  singular: 'Status code',
  plural: 'Status codes',
  editTitle: 'Edit status code {{quoteReasonId}}',
  addTitle: 'Create new status code',
  createButton: 'Create status code',
  table: {
    Id: 'Id',
    code: 'Code',
    type: 'Type',
    filters: {
      id: 'Filter by id',
      code: 'Filter by code',
      type: 'Filter by type',
    },
  },
  toasts: {
    successCreate: 'Status code created!',
    successDelete: 'Status code {{code}} deleted',
    successUpdate: 'Status code updated',
    errorFetch: 'Error while loading status codes. Please try again later',
    errorDelete: 'Error while deleting status code {{code}}',
    errorSave: 'Error while saving status code',
  },
  form: {
    details: 'Details',
    labels: {
      code: 'Code',
      type: 'Type',
      message: 'Comment',
    },
  },
}
