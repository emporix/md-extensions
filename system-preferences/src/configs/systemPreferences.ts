export type SystemPreferenceType =
  | 'TEXT'
  | 'PASSWORD'
  | 'BOOLEAN'
  | 'NUMBER'
  | 'OBJECT'
  | 'ENUM'
  | 'LIST'

/** One configuration key the System Preferences screen lists. */
export interface SystemPreferenceDefinition {
  readonly key: string
  readonly nameKey: string
  readonly type: SystemPreferenceType
  readonly descriptionKey?: string
  /** Shown, and used as the editor's start value, while the tenant has no value. */
  readonly defaultValue?: string
  readonly options?: readonly string[]
  /** Saved as a secured configuration and never read back. */
  readonly secured?: boolean
}

/** The configuration keys of the Management Dashboard System Preferences screen, in its order. */
export const SYSTEM_PREFERENCES: readonly SystemPreferenceDefinition[] = [
  {
    key: 'openAiApiToken',
    nameKey: 'systemPreferences.preferences.openAiApiToken.name',
    type: 'PASSWORD',
    secured: true,
  },
  {
    key: 'maxNumberOfCouponsPerCart',
    nameKey: 'systemPreferences.preferences.maxNumberOfCouponsPerCart.name',
    type: 'NUMBER',
  },
  {
    key: 'couponPermanentDelete',
    nameKey: 'systemPreferences.preferences.couponPermanentDelete.name',
    type: 'BOOLEAN',
  },
  {
    key: 'signUp.enableAccountCreationEmailConfirmation',
    nameKey:
      'systemPreferences.preferences.signUpEnableAccountCreationEmailConfirmation.name',
    type: 'BOOLEAN',
  },
  {
    key: 'approval.default_expiryDays',
    nameKey: 'systemPreferences.preferences.approvalDefaultExpiryDays.name',
    type: 'NUMBER',
  },
  {
    key: 'approval.enableQuoteApprovalProcess',
    nameKey:
      'systemPreferences.preferences.approvalEnableQuoteApprovalProcess.name',
    type: 'BOOLEAN',
    defaultValue: 'false',
  },
  {
    key: 'customer.passwordreset.redirecturl',
    nameKey:
      'systemPreferences.preferences.customerPasswordResetRedirectUrl.name',
    type: 'TEXT',
  },
  {
    key: 'cartItemValidationSkipEffectiveAmount',
    nameKey:
      'systemPreferences.preferences.cartItemValidationSkipEffectiveAmount.name',
    type: 'BOOLEAN',
  },
  {
    key: 'cartItemValidationSkipOriginalAmount',
    nameKey:
      'systemPreferences.preferences.cartItemValidationSkipOriginalAmount.name',
    type: 'BOOLEAN',
  },
  {
    key: 'enableLegalEntityAddressFallbackInCart',
    nameKey:
      'systemPreferences.preferences.enableLegalEntityAddressFallbackInCart.name',
    type: 'BOOLEAN',
  },
  {
    key: 'cartItemValidationSkipCurrency',
    nameKey:
      'systemPreferences.preferences.cartItemValidationSkipCurrency.name',
    type: 'BOOLEAN',
  },
  {
    key: 'cartItemValidationSkipExistingItemsValidationOnAddToCart',
    nameKey:
      'systemPreferences.preferences.cartItemValidationSkipExistingItemsValidationOnAddToCart.name',
    type: 'BOOLEAN',
  },
  {
    key: 'indexing_siteAwareFieldsStrategy',
    nameKey:
      'systemPreferences.preferences.indexingSiteAwareFieldsStrategy.name',
    type: 'TEXT',
  },
  {
    key: 'enableCouponCodeCaseSensitivity',
    nameKey:
      'systemPreferences.preferences.enableCouponCodeCaseSensitivity.name',
    type: 'BOOLEAN',
  },
  {
    key: 'enableExternalPrices',
    nameKey: 'systemPreferences.preferences.enableExternalPrices.name',
    type: 'BOOLEAN',
    defaultValue: 'true',
  },
  {
    key: 'enableOrderAddressPropagation',
    nameKey: 'systemPreferences.preferences.enableOrderAddressPropagation.name',
    type: 'BOOLEAN',
    defaultValue: 'true',
  },
  {
    key: 'populateProductDetailsOnAddToCart',
    nameKey:
      'systemPreferences.preferences.populateProductDetailsOnAddToCart.name',
    type: 'BOOLEAN',
  },
  {
    key: 'customerOnHoldOnCreation',
    nameKey: 'systemPreferences.preferences.customerOnHoldOnCreation.name',
    type: 'BOOLEAN',
  },
  {
    key: 'customerActiveOnCreation',
    nameKey: 'systemPreferences.preferences.customerActiveOnCreation.name',
    type: 'BOOLEAN',
  },
  {
    key: 'companyContactPropagation',
    nameKey: 'systemPreferences.preferences.companyContactPropagation.name',
    type: 'ENUM',
    options: ['DOWNWARD', 'UPWARD', 'DISABLED'],
    defaultValue: 'UPWARD',
  },
  {
    key: 'enableSyncBetweenRestrictionsAndSiteCodes',
    nameKey:
      'systemPreferences.preferences.enableSyncBetweenRestrictionsAndSiteCodes.name',
    type: 'BOOLEAN',
    descriptionKey:
      'systemPreferences.preferences.enableSyncBetweenRestrictionsAndSiteCodes.description',
  },
  {
    key: 'restrictions',
    nameKey: 'systemPreferences.preferences.restrictions.name',
    type: 'LIST',
    descriptionKey: 'systemPreferences.preferences.restrictions.description',
  },
  {
    key: 'allowAnonymousCheckoutWithExistingCustomerEmail',
    nameKey:
      'systemPreferences.preferences.allowAnonymousCheckoutWithExistingCustomerEmail.name',
    type: 'BOOLEAN',
  },
  {
    key: 'enableProductCategoryAssignmentValidation',
    nameKey:
      'systemPreferences.preferences.enableProductCategoryAssignmentValidation.name',
    type: 'BOOLEAN',
  },
  {
    key: 'allowToSkipRelatedProductsValidation',
    nameKey:
      'systemPreferences.preferences.allowToSkipRelatedProductsValidation.name',
    type: 'BOOLEAN',
  },
  {
    key: 'ssoCustomerAutoprovisioningDisabled',
    nameKey:
      'systemPreferences.preferences.ssoCustomerAutoprovisioningDisabled.name',
    type: 'BOOLEAN',
    descriptionKey:
      'systemPreferences.preferences.ssoCustomerAutoprovisioningDisabled.description',
  },
  {
    key: 'ssoCustomerIdentifierField',
    nameKey: 'systemPreferences.preferences.ssoCustomerIdentifierField.name',
    type: 'ENUM',
    options: ['EMAIL', 'SUBJECT'],
    defaultValue: 'EMAIL',
  },
  {
    key: 'predefinedLegalEntityGroupsCreationDisabled',
    nameKey:
      'systemPreferences.preferences.predefinedLegalEntityGroupsCreationDisabled.name',
    type: 'BOOLEAN',
    defaultValue: 'false',
    descriptionKey:
      'systemPreferences.preferences.predefinedLegalEntityGroupsCreationDisabled.description',
  },
  {
    key: 'languageSchemaVersion',
    nameKey: 'systemPreferences.preferences.languageSchemaVersion.name',
    type: 'ENUM',
    options: ['v1', 'v2'],
    defaultValue: 'v1',
    descriptionKey:
      'systemPreferences.preferences.languageSchemaVersion.description',
  },
  {
    key: 'deleteAvailabilitiesOnSiteDeletion',
    nameKey:
      'systemPreferences.preferences.deleteAvailabilitiesOnSiteDeletion.name',
    type: 'BOOLEAN',
    defaultValue: 'false',
    descriptionKey:
      'systemPreferences.preferences.deleteAvailabilitiesOnSiteDeletion.description',
  },
  {
    key: 'webhookFailureThreshold',
    nameKey: 'systemPreferences.preferences.webhookFailureThreshold.name',
    type: 'NUMBER',
    defaultValue: '100',
    descriptionKey:
      'systemPreferences.preferences.webhookFailureThreshold.description',
  },
  {
    key: 'webhookNotificationEmails',
    nameKey: 'systemPreferences.preferences.webhookNotificationEmails.name',
    type: 'LIST',
    descriptionKey:
      'systemPreferences.preferences.webhookNotificationEmails.description',
  },
]
