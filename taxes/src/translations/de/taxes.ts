// Keys kept from the Management Dashboard `taxes` namespace, plus the
// validation, placeholder and error texts the remote added.
export default {
  title: 'Steuern',
  singular: 'Steuer',
  plural: 'Steuern',
  addTaxClass: 'Steuerklasse hinzufügen',
  editTaxClass: 'Steuerklasse bearbeiten',
  label: {
    countryCode: 'Ländercode',
    countryName: 'Ländername',
    taxCode: 'Steuercode',
    taxName: 'Steuername',
    taxRate: 'Steuerrate',
    taxDescription: 'Steuerbeschreibung',
  },
  placeholder: {
    country: 'Standort auswählen',
  },
  validation: {
    countryRequired: 'Land auswählen',
    codeRequired: 'Steuercode eingeben',
    codeDuplicate: 'Dieses Land hat bereits eine Steuerklasse mit diesem Code',
  },
  toast: {
    successTaxDelete: 'Steuer wurde gelöscht',
    successTaxClassDelete: 'Steuer wurde gelöscht',
    successTaxClassAdded: 'Steuerklasse wurde hinzugefügt!',
    successTaxClassEdited: 'Steuerklasse wurde bearbeitet!',
    errorFetch:
      'Fehler beim Laden der Steuern. Bitte versuchen Sie es später erneut',
    errorFetchCountries:
      'Fehler beim Laden der Länder. Bitte versuchen Sie es später erneut',
    errorNoTaxClass: 'Steuerklasse nicht gefunden',
    errorSave:
      'Etwas ist schiefgelaufen. Prüfen Sie die Formulardaten oder versuchen Sie es später erneut.',
    errorDelete: 'Fehler beim Löschen von {{code}}',
  },
}
