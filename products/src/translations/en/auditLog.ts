export default {
  entities: {
    employee: 'User',
    group: 'Group',
    'group-assignment': 'Group assignment',
    product: 'Product',
  },
  changeTypes: {
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
  },
  entityChangelog: {
    tab: 'Audit Log',
    empty: 'No audit log entries in the selected period',
    notSet: 'Not set',
    table: {
      field: 'Field',
      previousValue: 'Previous Value',
      updatedValue: 'Updated Value',
    },
  },
  loadError: 'The audit log could not be loaded.',
  retry: 'Try again',
  rowsPerPage: 'Rows per page',
  window: {
    label: 'Period',
    limitHint: 'The period is limited to 7 days.',
  },
}
