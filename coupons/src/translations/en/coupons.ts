export default {
  title: 'Coupons',
  addNewCoupon: 'Add new coupon',
  singular: 'Coupon',
  plural: 'Coupons',
  table: {
    columns: {
      code: 'Code',
      name: 'Name',
      discountType: 'Discount type',
      discountPercentage: 'Discount percentage',
      discountAbsolute: 'Discount amount',
      redemptionCount: 'Redemption count',
      categoriesCoupon: 'Category coupon',
    },
  },
  type: {
    freeShipping: 'Free shipping',
    percent: 'Percent',
    absolute: 'Amount',
  },
  calculationType: {
    subtotal: 'Subtotal',
    total: 'Total',
  },
  toast: {
    fetchError: 'Error while loading coupons',
    deleteSuccess: 'Coupon deleted successfully',
    deleteError: 'Could not delete coupons: {{codes}}',
    deletedCodes: 'Deleted: {{codes}}',
  },
  edit: {
    title: 'Edit coupon',
    tab: {
      details: {
        title: 'General',
        name: 'Name',
        code: 'Code',
        description: 'Description',
      },
      type: {
        title: 'Type',
        discountType: 'Coupon type',
        percentage: 'Percentage discount',
        absolute: 'Absolute value discount',
        currency: 'Currency',
        calculationBase: 'Calculation base',
      },
      rules: {
        title: 'Rules',
        validityAndValue: 'Validity & Value',
        restriction: 'Restriction',
        minimumOrderTotal: 'Minimum order total',
        currency: 'Currency',
        validUntil: 'Valid until',
        validFrom: 'Valid from',
        validFor: 'Valid for customers',
        segments: 'Valid for segments',
        appliesTo: {
          title: 'Applies to',
          hint: 'Choose who can use this coupon.',
          allCustomers: 'All customers',
          allCustomersHint:
            'Allow anyone to use this coupon, including anonymous customers.',
          registeredCustomers: 'Registered customers',
          registeredCustomersHint:
            'Only customers signed in to a registered account.',
          specificCustomer: 'Specific customer(s)',
          specificCustomerHint:
            'Choose individual customer accounts that can use this coupon.',
          customerSegments: 'Customer segment(s)',
          customerSegmentsHint:
            'Make the coupon available to selected customer groups.',
          categories: 'Categories',
          categoriesHint:
            'Limit the coupon to products in selected categories.',
        },
        vendorRestricted: 'Vendor specific',
        vendorRestrictedHint:
          'Restrict this coupon to selected vendor(s) in addition to the customer restriction.',
        vendors: 'Valid for vendors',
      },
      categories: {
        title: 'Categories',
        categoryRestricted: 'Category restricted',
        includedCategories: 'Included categories',
        excludedCategories: 'Excluded categories',
        selectIncludedCategories: 'Select included categories',
        selectExcludedCategories: 'Select excluded categories',
      },
      coupons: {
        type: {
          freeShipping: 'Free shipping',
          percent: 'Percent',
          absolute: 'Amount',
        },
      },
    },
    errors: {
      fetching: {
        title: 'Error while loading coupon',
      },
    },
    validation: {
      required: 'This field is required',
      codeReserved: 'The code "add" is reserved. Choose another code.',
      percentageRange: 'Enter a percentage between 0 and 100',
      amountNonNegative: 'The amount cannot be negative',
      validityOrder: 'The end date must be after the start date',
      customersRequired: 'Select at least one customer',
      segmentsRequired: 'Select at least one segment',
      categoriesRequired: 'Select at least one included or excluded category',
      categoriesNotForFreeShipping:
        'Free shipping coupons cannot be limited to categories',
      categoriesOverlap: 'A category cannot be both included and excluded',
    },
    toast: {
      mixinSave: {
        error: 'Error while saving coupon mixin',
      },
      invalidForm: 'Please correct the highlighted fields',
      update: {
        success: 'Coupon was updated!',
        error: 'Error while updating coupon',
      },
      create: {
        success: 'Coupon was created!',
        error: {
          default: 'Error while creating coupon',
          duplicate:
            "Duplicate coupon '{{code}}' on tenant '{{tenant}}'. If the coupon existed before, saving may be blocked because of your System Preferences -> Enable Permanent Deletion Of Coupons",
        },
      },
      successBatchDelete: 'Coupons deleted successfully',
    },
  },
}
