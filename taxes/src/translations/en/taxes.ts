// Keys kept from the Management Dashboard `taxes` namespace, plus the
// validation, placeholder and error texts the remote added.
export default {
  title: 'Taxes',
  singular: 'Tax',
  plural: 'Taxes',
  addTaxClass: 'Add tax class',
  editTaxClass: 'Edit tax class',
  label: {
    countryCode: 'Country code',
    countryName: 'Country name',
    taxCode: 'Tax code',
    taxName: 'Tax name',
    taxRate: 'Tax rate',
    taxDescription: 'Tax description',
  },
  placeholder: {
    country: 'Select location',
  },
  validation: {
    countryRequired: 'Select a country',
    codeRequired: 'Enter a tax code',
    codeDuplicate: 'This country already has a tax class with this code',
  },
  toast: {
    successTaxDelete: 'Tax was deleted',
    successTaxClassDelete: 'Tax was deleted',
    successTaxClassAdded: 'Tax Class was added!',
    successTaxClassEdited: 'Tax Class was edited!',
    errorFetch: 'Error while loading taxes. Please try again later',
    errorFetchCountries:
      'Error while loading countries. Please try again later',
    errorNoTaxClass: 'Tax class not found',
    errorSave: 'Something went wrong. Check form data or try later.',
    errorDelete: 'Error while deleting {{code}}',
  },
}
