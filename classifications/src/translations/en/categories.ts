// The `categories.*` keys the shared category tree uses, kept under MD's
// names: MD shows the same texts for classifications.
export default {
  title: 'Categories',
  addNewCategory: 'Add new category',
  table: {
    validity: {
      to: 'Valid to',
      from: 'Valid from',
    },
  },
  displayType: {
    list: 'List',
    tree: 'Tree',
  },
  tree: {
    addAbove: 'Add above',
    addChild: 'Add child',
    addBelow: 'Add below',
    details: {
      empty: 'Select a category to see and edit its details.',
      openFullEdit: 'Open full edit',
      positionTaken: 'Same position as {{names}}. Their order is not defined.',
      positionTakenMore:
        'Same position as {{names}} and {{more}} more. Their order is not defined.',
    },
    newCategory: {
      title: 'New category',
      above: 'Above {{name}}',
      below: 'Below {{name}}',
      child: 'Subcategory of {{name}}',
      topLevel: 'Top level',
    },
  },
  actions: {
    move: {
      error: "Error while changing category's order",
    },
    rebuild: {
      error: 'The category tree could not be refreshed',
    },
  },
  edit: {
    toast: {
      update: {
        success: 'Updated category!',
        error: 'Cannot save category',
      },
      create: {
        success: 'Created category!',
      },
    },
    validation: {
      required: 'Required',
    },
    tab: {
      details: {
        id: 'Id',
        name: 'Name',
        description: 'Description',
        slug: 'Slug',
        code: 'Code',
        position: 'Position',
      },
      validity: {
        published: 'Published',
      },
      tooltip: {
        id: 'Unique Id of the category. It will be generated if not provided.',
      },
    },
  },
}
