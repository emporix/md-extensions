export default {
  plurals: {
    singular: 'Classification',
    plural: 'Classifications',
  },
  buttons: {
    createClassification: 'Add new Classification',
  },
  titles: {
    general: 'Details',
    path: 'Path',
    validity: 'Validity',
    classification: 'Classification',
  },
  tables: {
    classifications: {
      emptyText: 'No classification yet',
      name: 'Name',
      validFrom: 'Valid From',
      validTo: 'Valid To',
    },
    mixinAttributes: {
      emptyText: 'No fields in this schema yet',
      name: 'Name',
      readOnly: 'Read Only',
      required: 'Required',
      nullable: 'Nullable',
      localized: 'Localized',
    },
  },
  toasts: {
    successCreateClassification: 'Classification created successfully',
    successEditClassification: 'Classification updated successfully',
    successDeleteClassifications: 'Classifications deleted successfully',
    errorFetchClassifications: 'Error while loading classifications.',
    errorFetchClassification: 'Error while loading classification.',
    errorDeleteClassification: 'Error while deleting classifications.',
    errorEditClassification: 'Failed to update classification',
    errorCreateClassification: 'Failed to create classification',
    errorFetchSchemas: 'Error while loading Emporix classification schemas.',
    errorConflict: 'Classification with provided code already exists',
  },
  labels: {
    custom: 'Custom',
    always: 'Always',
    newSchema: 'New Classification Schema',
    noSchema: 'No classification schema has been defined yet.',
    added: 'Added',
    deleted: 'Deleted',
    changed: 'Changed',
    applyVersion: 'Apply Version {{version}}',
  },
  tabs: {
    details: 'Details',
    path: 'Path',
    validity: 'Validity',
    classification: 'Classification',
  },
  forms: {
    general: {
      fields: {
        name: 'Name',
        code: 'Code',
        description: 'Description',
      },
    },
    path: {
      fields: {
        parent: 'Parent',
        position: 'Position',
      },
    },
    classification: {
      fields: {
        schemaType: 'Schema Type',
        required: 'Required',
        schema: 'Mixins Schema',
        key: 'Key',
        schemaUrl: 'Schema URL',
      },
      labels: {
        emporixSchema: 'Emporix mixins schema',
        ownSchema: 'My own mixins schema',
        required: 'Required',
      },
      errors: {
        invalidName:
          'Key must use a simple, standardized format: only letters and numbers, plus underscores (_) and hyphens (-).',
      },
    },
    validity: {
      fields: {
        type: 'Validity Type',
        validFrom: 'Valid From',
        validTo: 'Valid To',
        published: 'Published',
      },
    },
  },
  tooltips: {
    required:
      'Field is indicating if the mixin is required for products in this category',
    key: 'Key must use a simple, standardized format: only letters and numbers, plus underscores (_) and hyphens (-).',
    schemaUrl:
      'Url needs to start with "http://" or "https://" and points to a valid JSON schema.',
  },
}
