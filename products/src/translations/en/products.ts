export default {
  title: 'Products',
  singular: 'Product',
  plural: 'Products',
  types: {
    BASIC: 'Basic',
    BUNDLE: 'Bundle',
    VARIANT: 'Variant',
    PARENT_VARIANT: 'Parent Variant',
  },
  table: {
    id: 'Id',
    name: 'Name',
    code: 'Code',
    image: 'Image',
    imageUrl: 'Image url',
    productType: 'Product type',
    price: 'Price',
    filters: {
      id: 'Filter by product id',
      name: 'Filter by product name',
      code: 'Filter by code',
      productType: 'Filter by product type',
    },
    actions: 'Actions',
  },
  variant: {
    variantOf: 'This product is a variant of',
    openConfiguration: 'Open configuration',
  },
  createNew: 'Add new product',
  importCSV: 'Import from CSV',
  import: {
    header: 'PRODUCTS DATA IMPORT',
    label: 'Choose CSV File to import',
  },
  edit: {
    save: 'Save product data',
    title: 'Edit product',
    create: 'Create product',
    toast: {
      update: {
        success: 'Successfully updated product!',
      },
      create: {
        success: 'Successfully created product!',
      },
      parentVariantDoesNotExist: {
        title: 'Parent variant does not exist',
        message: 'Parent variant for the variant does not exist.',
      },
    },
    tab: {
      general: {
        title: 'General',
        name: 'Name',
        image: 'Image',
        code: 'Code',
        published: 'Published',
        description: 'Description',
        brand: 'Brand',
        brandPlaceholder: 'Select brand',
        label: 'Label',
        labelPlaceholder: 'Select label',
        weightDependent: 'Weight Dependent',
        category: 'Categories',
        categoryAssignment: 'Category assignment',
        information: 'Details',
        attributes: 'Attributes',
        brandAndLabel: 'Brand & Labels',
        productTemplate: 'Product template',
        productTemplateVersion: 'Product template version',
        id: 'id',
        tooltip: {
          id: 'Unique Id of the product. It will be generated if not provided.',
          weightDependent:
            'Mark the product as weight-dependent if the line item price could change after packaging, as this is necessary to ensure that credit card payments can be authorized.',
        },
      },
      categories: {
        title: 'Categories',
      },
      suppliers: {
        tabTitle: 'Suppliers',
        title: 'Suppliers',
        suppliers: 'Suppliers',
      },
      custom: {
        title: 'EF custom data',
        brandName: 'Brand name',
        material: 'Material',
      },
      prices: {
        title: 'Prices',
        taxTitle: 'Tax configuration',
        columns: {
          site: 'Site',
          price: 'Price',
          country: 'Country',
          taxClass: 'Tax class',
        },
        dialog: {
          titleAdd: 'Add price',
          titleEdit: 'Edit price',
          submitEdit: 'Save',
          delete: 'Delete price',
        },
        form: {
          price: 'Price',
          currency: 'Currency',
          site: 'Site',
          validFrom: 'Valid From',
          validTo: 'Valid To',
          addPrice: 'Add price',
          country: 'Country',
          selectTaxCountry: 'Select tax country',
          selectTaxClass: 'Select tax class',
          selectCountry: 'Select country',
          countryEmptyMessage: 'Tax configuration is empty',
          saveTaxClasses: 'Save tax classes',
          discountType: 'Discount type',
          discountPercentage: 'Discount percentage',
          discountAbsolute: 'Discount amount',
        },
        toast: {
          editSuccess: 'Product price was updated!',
          addSuccess: 'Product price was added!',
          deleteSuccess: 'Product price was deleted!',
          taxClassEditSuccess: 'Tax classes was updated!',
        },
      },
      availability: {
        title: 'Availability',
        columns: {
          site: 'Site',
          stockLevel: 'Stock level',
          distributionChannel: 'Distribution channel',
        },
        dialog: {
          titleAdd: 'Add availability',
          titleEdit: 'Edit availability',
          submitEdit: 'Save',
          stockLevel: 'Stock level',
          popularity: 'Popularity',
          distributionChannel: 'Distribution channel',
        },
      },
      media: {
        tabTitle: 'Media',
        title: 'Image',
        deleteBatch: 'Delete',
        useAsMain: 'Use as main image',
        deleteImage: 'Delete image',
        addImage: 'Add image',
      },
      demo: {
        tabTitle: 'Demo feature',
      },
      images: {
        tabTitle: 'Images',
      },
      attributes: {
        title: 'Attributes & Variants',
        addNewAttribute: 'Add new attribute',
        attribute: 'Attribute',
        options: 'Attribute values',
        save: 'Save',
        delete: 'Delete',
        variants: {
          title: 'Variants',
          columns: {
            productId: 'Product ID',
            isParent: 'Parent',
            variant: 'Variant',
            price: 'Price',
            availability: 'Combined availability',
          },
          actions: {
            create: 'Create new variant',
            edit: 'Edit variant',
            createDialog: {
              title: 'Creating new variant',
              message: 'Do you want to create new variant?',
            },
          },
        },
      },
      linked: {
        title: 'Linked Products',
        add: 'Add Linked Product',
        remove: 'Remove From Linked',
        table: {
          emptyText: 'You don’t have any linked product yet',
          emptyLink: '+ Add new linked product',
        },
        columns: {
          name: 'Product Name',
          type: 'Type',
          image: 'Image',
          id: 'Product Id',
        },
        types: {
          consumable: 'Consumable',
          accessory: 'Accessory',
          'you-might-like-this': 'You might like this',
          'suggested-related-items': 'Suggested related items',
          'similar-items': 'Similar items',
        },
        dialogTitle: 'Add Linked Products',
      },
      bundle: {
        title: 'Bundle',
        add: 'Add Bundle Products',
        remove: 'Remove From Bundle',
        table: {
          emptyText: 'You don’t have any bundle product yet',
          emptyLink: '+ Add new bundle product',
        },
        columns: {
          name: 'Product Name',
          amount: 'Quantity In Bundle',
          image: 'Image',
        },
        dialogTitle: 'Add Bundle Products',
      },
    },
    productsSearch: {
      searchPlaceholder: 'Search product...',
      emptySelected: "You haven't selected any product yet...",
      selected: 'Selected Products:',
      submitAdd: 'Add Products',
    },
  },
  attributes: {
    willProduceVariants: 'Will produce variants with attributes: ',
    withValues: ' with values:',
  },
  actions: {
    delete: {
      title: 'Delete',
      message: 'Delete product?',
    },
    batchDelete: 'Deleting products',
    assistant: {
      title: 'Assistant',
    },
  },
  toast: {
    errorCreateValidation:
      'Cannot create product due to validation error. Check console logs for more information.',
    errorCreateConflict:
      'Cannot create product, because product with such code or id already exists in the system',
    errorCreateInternal:
      'Cannot create product. Check console logs for more information.',
    errorUpdateValidation:
      'Cannot update product due to validation error. Check console logs for more information.',
    errorUpdateConflict:
      'Cannot update product, because product with such code or id already exists in the system',
    errorUpdateInternal:
      'Cannot update product. Check console logs for more information.',
  },
}
