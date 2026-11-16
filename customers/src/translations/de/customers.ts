// Keys of MD `translations/de/customers.ts` used by the ported screens, plus
// the values MD lacked (`table.columns.contactEmail`) and the keys added in
// `en/customers.ts`. `details.title` is the salutation field ("Anrede"); MD
// had "Kunde bearbeiten".
export default {
  singular: 'Kunde',
  plural: 'Kunden',
  createCustomer: 'Neuen Kunden hinzufügen',
  addAddress: 'Neue Adresse hinzufügen',
  details: {
    subtitle: 'Details',
    id: 'ID',
    customerNumber: 'Kundenummer',
    firstName: 'Vorname',
    lastName: 'Nachname',
    preferredSite: 'Präferierte Site',
    title: 'Anrede',
    preferredCurrency: 'Präferierte Währung',
    onHold: 'Pausiert',
    active: 'Aktiv',
    contactPhone: 'Telefonischer Ansprechpartner',
    contactEmail: 'Email Ansprechpartner',
    password: 'Initialpasswort',
    autogenerate: 'Automatisch generieren',
    bonusPoints: 'Bonuspunkte',
    referralCouponCode: 'Empfehlungs-Gutscheincode',
    registered: 'Registriert',
    unregistered: 'Unregistriert',
    lastDeliveryDate: 'Letztes Lieferdatum',
    lastOrderDate: 'Letztes Bestelldatum',
    creationDate: 'Erstellungsdatum',
    lastLogin: 'Letzte Anmeldung',
    assignedSegments: 'Zugeordnete Segmente',
    assignedCompanies: 'Zugeordnete(s) Unternehmen',
    groups: 'Gruppen',
    restriction: 'Restriktion',
    tooltip: {
      id: 'Eindeutige Id des Kunden. Sie wird generiert, wenn sie nicht vergeben wird.',
      autogenerate:
        'Erstellt ein zufälliges 12-stelliges Initialpasswort mit gemischten Groß-/Kleinschreibung, Zahlen und Sonderzeichen.',
      password: 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    },
    passwordToggle: {
      show: 'Passwort anzeigen',
      hide: 'Passwort verbergen',
    },
    noSegments: 'Kein Segment zugewiesen',
    noCompanies: 'Keine Unternehmen zugewiesen',
    noGroups: 'Keine Gruppen zugewiesen',
  },
  marketing: {
    subtitle: 'Marketinginformation',
  },
  table: {
    columns: {
      id: 'ID',
      firstName: 'Vorname',
      lastName: 'Nachname',
      contactEmail: 'Email Ansprechpartner',
      preferredSite: 'Präferierte Site',
    },
  },
  tabs: {
    first: 'Details',
    second: 'Adressen',
  },
  address: {
    general: 'Allgemein',
    id: 'ID',
    tooltip: {
      id: 'Eindeutige Id der Kundenadresse. Sie wird generiert, wenn sie nicht vergeben wird.',
    },
    contactName: 'Name Ansprechpartner',
    companyName: 'Name des Unternehmens',
    street: 'Straße',
    streetAppendix: 'Straßenanhang',
    streetNumber: 'Straßennummer',
    city: 'Stadt',
    zipCode: 'Postleitzahl',
    country: 'Land',
    tags: 'Tags',
    isDefault: 'Ist Standard',
    contactPhone: 'Telefonischer Ansprechpartner',
  },
  actions: {
    deleteMessage:
      'Möchten Sie diesen Kunden wirklich löschen? Dies kann nicht rückgängig gemacht werden.',
  },
  toasts: {
    successCreate: 'Kunde erfolgreich erstellt',
    successUpdate: 'Kunde erfolgreich aktualisiert',
    successDelete: 'Kunde erfolgreich gelöscht',
    errorDelete: 'Fehler beim Löschen des Kunden',
    errorSave: 'Der Kunde kann nicht gespeichert werden',
  },
  assistedBuying: {
    button: 'Assistent beim Einkauf',
  },
}
