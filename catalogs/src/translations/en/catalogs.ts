// Keys kept from the Management Dashboard `catalogs` namespace, plus the
// fetch-error title and toasts MD did not have.
export default {
  title: 'Catalogs',
  addNewCatalog: 'Add new catalog',
  singular: 'Catalog',
  plural: 'Catalogs',
  table: {
    publishedSites: '{{size}} site(s)',
    columns: {
      status: 'Visible',
      name: 'Catalog name',
      publishedTo: 'Published to',
      visibilityStart: 'Visibility start',
      visibilityEnd: 'Visibility end',
      lastPublished: 'Last published',
    },
  },
  edit: {
    title: 'Edit catalog',
    tab: {
      details: {
        title: 'Details',
        id: 'Id',
        name: 'Catalog name',
        description: 'Catalog description',
      },
      categories: {
        title: 'Categories',
        categoryIds: 'Categories in catalog (root only)',
        selectCategories: 'Select categories for catalog',
      },
      published: {
        title: 'Published',
        publishedTo: 'Sites',
      },
      visibility: {
        title: 'Visibility',
        from: 'Visibility start',
        to: 'Visibility End',
        visible: 'Visible',
      },
      tooltip: {
        id: 'Unique Id of the catalog. It will be generated if not provided.',
      },
    },
    errors: {
      fetching: {
        title: 'Catalog could not be loaded',
      },
    },
    toast: {
      update: {
        success: 'Successfully updated catalog.',
      },
      create: {
        success: 'Successfully created catalog.',
      },
    },
  },
  toasts: {
    error: 'Something went wrong. Check form data or try later.',
    errorFetch: 'Error while loading catalogs. Please try again later',
    errorDelete: 'Error while deleting catalog {{id}}',
  },
}
