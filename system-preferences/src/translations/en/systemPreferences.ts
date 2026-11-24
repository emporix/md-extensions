export default {
  title: 'System Preferences',
  columns: {
    key: 'Key',
    name: 'Name',
    value: 'Value',
    edit: 'Edit',
  },
  selectValue: 'Select value',
  commaSeparatedValues: 'Enter comma-separated values',
  clear: 'Clear value',
  clearConfirm: {
    title: 'Clear secret',
    message: 'The stored value will be deleted. This cannot be undone.',
  },
  toasts: {
    successCreate: 'System preference created successfully',
    successUpdate: 'System preference updated successfully',
    successDelete: 'System preference deleted successfully',
    errorCreate: 'Failed to create system preference',
    errorUpdate: 'Failed to update system preference',
    errorDelete: 'Failed to delete system preference',
  },
  preferences: {
    openAiApiToken: {
      name: 'Open AI API token',
    },
    maxNumberOfCouponsPerCart: {
      name: 'Maximum number of coupons per cart',
    },
    couponPermanentDelete: {
      name: 'Enable permanent deletion of coupons',
    },
    signUpEnableAccountCreationEmailConfirmation: {
      name: 'Enable email confirmation during signing up',
    },
    approvalDefaultExpiryDays: {
      name: 'Expiration days of the approvals',
    },
    approvalEnableQuoteApprovalProcess: {
      name: 'Enable quote approval process',
    },
    customerPasswordResetRedirectUrl: {
      name: 'Reset Password URL',
    },
    cartItemValidationSkipEffectiveAmount: {
      name: 'Optional effectiveAmount validation in cart',
    },
    cartItemValidationSkipOriginalAmount: {
      name: 'Optional originalAmount validation in cart',
    },
    enableLegalEntityAddressFallbackInCart: {
      name: 'Enable legal entity address fallback in cart, when address is not provided in the request',
    },
    cartItemValidationSkipCurrency: {
      name: 'Optional currency validation in cart',
    },
    cartItemValidationSkipExistingItemsValidationOnAddToCart: {
      name: 'Skip existing cart items validation on adding new item to cart',
    },
    allowAnonymousCheckoutWithExistingCustomerEmail: {
      name: 'Allow anonymous checkout with existing customer email',
    },
    indexingSiteAwareFieldsStrategy: {
      name: 'Indexing strategy for site aware fields',
    },
    enableCouponCodeCaseSensitivity: {
      name: 'Coupon code can be saved both in upper and lower case',
    },
    enableExternalPrices: {
      name: 'Enable external prices',
    },
    enableOrderAddressPropagation: {
      name: 'Enable order address propagation. If true, the order address is added to the customer addresses',
    },
    populateProductDetailsOnAddToCart: {
      name: 'Auto-populate product information during add-to-cart operation',
    },
    customerOnHoldOnCreation: {
      name: 'Always set customer onHold to provided value on creation, otherwise use default values',
    },
    customerActiveOnCreation: {
      name: 'Always set customer active status to provided value on creation, otherwise use default values',
    },
    companyContactPropagation: {
      name: 'Company contacts propagation with subsidiaries',
    },
    enableSyncBetweenRestrictionsAndSiteCodes: {
      name: 'Enable sync between restrictions and site codes',
      description:
        'If sync between restrictions and site codes is enabled, the restrictions list contains values equal to the site codes.',
    },
    restrictions: {
      name: 'List of restrictions',
      description:
        'If sync between restrictions and site codes is enabled, the restrictions list contains values equal to the site codes, then the restrictions are immutable.',
    },
    enableProductCategoryAssignmentValidation: {
      name: 'Validate product existence before assigning a category',
    },
    allowToSkipRelatedProductsValidation: {
      name: 'Allow to skip related products validation',
    },
    ssoCustomerAutoprovisioningDisabled: {
      name: 'Disable SSO customer autoprovisioning',
      description:
        'If SSO customer autoprovisioning is disabled, it means that when a customer logs in via SSO, the customer is not automatically created in the system.',
    },
    ssoCustomerIdentifierField: {
      name: 'SSO customer identifier field',
      description:
        'If SSO customer identifier field is set to EMAIL, the email address is used as the customer identifier. If it is set to SUBJECT, the sub claim is used as the customer identifier.',
    },
    predefinedLegalEntityGroupsCreationDisabled: {
      name: 'Disable predefined legal entity group creation',
      description:
        'If predefined legal entity group creation is disabled, default customer groups are not created automatically when a legal entity is created.',
    },
    languageSchemaVersion: {
      name: 'Language schema version',
      description:
        'Controls the shape of localized TEXT fields in mixin schemas. v1 stores an array of language/value pairs. v2 stores an object map keyed by language code. Switching to v2 and then updating an existing mixin regenerates localized fields. Saving an entity in Management Dashboard converts stored v1 arrays to v2 maps.',
    },
    deleteAvailabilitiesOnSiteDeletion: {
      name: 'Delete availabilities when a site is deleted',
      description:
        "When this is on, deleting a site removes that site's product availabilities. When this is off, those availabilities stay.",
    },
    webhookFailureThreshold: {
      name: 'Webhook failure threshold',
      description:
        'The number of consecutive failed deliveries after which a webhook target is switched off. The default is 100.',
    },
    webhookNotificationEmails: {
      name: 'Webhook notification emails',
      description:
        'The email addresses that are told when a webhook target is switched off. When the list is empty, the email goes to the default employee.',
    },
  },
}
