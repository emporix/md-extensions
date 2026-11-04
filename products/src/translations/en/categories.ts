export default {
  title: 'Categories',
  actions: {
    move: {
      error: "Error while changing category's order",
    },
  },
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
  media: {
    choose: 'Choose',
    upload: 'Upload',
    clear: 'Clear',
    dropImageHere: 'Drag & Drop Image Here',
    dropFileHere: 'Drag & Drop File Here',
    toast: {
      singleDeleteSuccess: 'Image was deleted!',
      bulkDeleteSuccess: '{{itemsLength}} images were deleted',
      deleteFailure: 'Failed to delete image',
      downloadFailure: 'Failed to download {{filename}}',
    },
    confirm: {
      singleDelete: 'Remove this image?',
      bulkDelete: 'Remove {{itemsLength}} images?',
    },
  },
}
