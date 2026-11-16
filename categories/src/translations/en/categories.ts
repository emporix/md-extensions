export default {
  title: 'Categories',
  singular: 'Category',
  plural: 'Categories',
  addNewCategory: 'Add new category',
  table: {
    id: 'Id',
    position: 'Position',
    code: 'Code',
    slug: 'Slug',
    name: 'Category Name',
    published: 'Published',
    localizedName: 'Category Name',
    localizedSlug: 'Slug',
    select: 'Select',
    actions: 'Actions',
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
    batchDelete: {
      success: '{{numberOfCategories}} categories(s) deleted',
      failedSingle: 'Failed to delete category {{categoryName}}',
    },
    move: {
      error: "Error while changing category's order",
    },
    rebuild: {
      error: 'The category tree could not be refreshed',
    },
  },
  edit: {
    title: 'Category',
    toast: {
      update: {
        success: 'Updated category!',
        error: 'Cannot save category',
      },
      create: {
        success: 'Created category!',
      },
      fetch: {
        error: 'Cannot load category',
      },
    },
    validation: {
      required: 'Required',
    },
    tab: {
      details: {
        id: 'Id',
        title: 'Details',
        name: 'Name',
        description: 'Description',
        slug: 'Slug',
        code: 'Code',
        ecn: 'ECNs',
        position: 'Position',
        comma: 'Please press " , " or "Enter ↵" to separate elements',
      },
      path: {
        title: 'Path',
        parent: 'Parent',
      },
      validity: {
        title: 'Validity',
        type: 'Type',
        custom: 'Custom',
        always: 'Always',
        never: 'Never',
        from: 'Valid from',
        to: 'Valid to',
        index: 'Index',
        navigation: 'Navigation',
        published: 'Published',
      },
      tooltip: {
        id: 'Unique Id of the category. It will be generated if not provided.',
      },
      seo: {
        title: 'SEO',
      },
      media: {
        title: 'Media',
      },
    },
    save: 'Save',
  },
  media: {
    backToMedia: 'Media',
    editTitle: 'Edit Main Media Image',
    errors: { update: 'Error while updating' },
    success: { update: 'Image successfully updated' },
    form: { name: 'Name*' },
    toast: {
      singleDeleteSuccess: 'Image was deleted!',
      bulkDeleteSuccess: '{{itemsLength}} images were deleted',
      downloadFailure: 'Failed to download {{filename}}',
    },
    confirm: {
      singleDelete: 'Remove this image?',
      bulkDelete: 'Remove {{itemsLength}} images?',
      deleteDescription: 'This action cannot be undone.',
    },
    choose: 'Choose',
    upload: 'Upload',
    clear: 'Clear',
    dropImageHere: 'Drag & Drop Image Here',
    removeFile: 'Remove file',
    selectAsset: 'Select {{name}}',
    openAsset: 'Open {{name}}',
    fileUploaderTitle: 'Upload images',
  },
}
