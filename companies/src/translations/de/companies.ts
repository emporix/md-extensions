export default {
  title: "Unternehmen",
  singular: "Unternehmung",
  plural: "Unternehmen",
  subsidiary: "Tochtergesellschaft",
  backButton: "Unternehmen",
  addNewCompany: "Neues Unternehmen hinzufügen",
  name: "Name des Unternehmens",
  type: "Unternehmenstyp",
  countryOfRegistration: "Registrierungsland",
  primaryContact: "Hauptansprechpartner",
  blockedTab: "Bitte erst Daten speichern",
  customerGroups: {
    tableName: "Gruppenname",
  },
  taxRegistrationNumber: "Steuerregistrieungsnummer",
  table: {
    filters: {
      name: "Suche bei Name",
      surname: "Suche bei Nachname",
    },
  },
  toast: {
    create: {
      title: "Unternehmen erstellt!",
    },
    update: {
      title: "Unternehmen aktualisiert!",
    },
    delete: {
      title: "Gelöschte Unternehmen!",
    },
  },
  toasts: {
    errorSave: "Unternehmen konnte nicht gespeichert werden",
    errorLoad: "Unternehmen konnte nicht geladen werden",
    errorDelete: "Unternehmen konnte nicht gelöscht werden",
  },
  edit: {
    tabs: {
      companyDetails: "Unternehmensdetails",
      legalEntity: "Rechtliche Einheit",
      locations: "Standorte",
      subsidiaries: "Tochtergesellschaften",
      policies: "Richtlinien",
      customerGroups: "Kundengruppen",
      contacts: "Ansprechpartner",
      emailAddress: "Email Adresse",
    },
    form: {
      details: {
        id: "Id",
        title: "Details",
        name: "Name des Unternehmens",
        restriction: "Restriktion",
        restrictionPlaceholder: "Restriktion auswählen...",
      },
      primaryContacts: {
        title: "Hauptansprechpartner",
        add: "Ansprechpartner hinzufügen",
        columns: {
          name: "Name",
          email: "Email",
          phoneNumber: "Telefonnummer",
        },
      },
      legalEntity: {
        title: "Rechtliche Einheit",
        legalName: "Rechtlicher Name",
        taxRegistrationNumber: "Steuerregistrieungsnummer",
        countryOfRegistration: "Registrierungsland",
        countryOfRegistrationPlaceholder: "Land auswählen...",
        registrationAgency: "Registrierungsagentur",
        registrationDate: "Registrierungsdatum",
        registrationId: "Registrierungs ID",
      },
      locations: {
        title: "Standorte",
        addNew: "Neuen Standort hinzufügen",
      },
      subsidiaries: {
        title: "Tochtergesellschaften",
        addNew: "Neue Tochtergesellschaft hinzufügen",
      },
      policies: {
        purchasingLimits: {
          subtitle: "Beschaffunglimits",
        },
        accountLimit: "Kundenlimit",
        priceLists: {
          subtitle: "Preislisten",
        },
        approvalGroup: {
          subtitle: "Genehmigungsgruppe",
          columns: {
            name: "Vorname",
            surname: "Nachname",
            email: "Email",
          },
        },
      },
      contacts: {
        addNew: "Neuen Kontakt hinzufügen",
        title: "Kontakte",
      },
      customerGroups: {
        title: "Kundengruppen",
      },
      tooltip: {
        id: "Eindeutige Id des Unternehmens. Sie wird generiert, wenn sie nicht vergeben wird.",
      },
    },
  },
  locations: {
    back: "Unternehmung",
    title: "Standorte{{name}}",
    newTitle: "Neuer Standort",
    locationType: {
      office: "Büro",
      warehouse: "Lager",
      headquarter: "Hauptsitz",
    },
    list: {
      name: "Name",
      locationType: "Standortnamen",
      address: "Adresse",
      tags: "Tags",
    },
    toast: {
      success: {
        title: "Standort erfolgreich hinzugefügt/aktualisiert",
      },
      delete: {
        success: {
          title: "Standort erfolgreich gelöscht",
        },
        error: "Standort konnte nicht gelöscht werden",
      },
    },
    actions: {
      delete: "Standort löschen",
    },
    form: {
      id: "Id",
      locationType: "Typ",
      country: "Land",
      name: "Name",
      address1: "Adresszeile 1",
      address2: "Adresszeile 2",
      city: "Stadt",
      state: "Staat",
      postcode: "Postleitzahl",
      tags: "Tags",
      tooltip: {
        id: "Eindeutige Id des Standorts. Sie wird generiert, wenn sie nicht vergeben wird.",
      },
    },
  },
  approvalGroup: {
    add: {
      existing: {
        label: "Genehmigungskontakt hinzufügen",
      },
      new: {
        label: "Neuen Genehmigungskontakt erstellen",
      },
    },
    toast: {
      add: {
        success: "Genehmigungskontakt erfolgreich hinzugefügt",
      },
      delete: {
        success: "Genehmigungskontakt erfolgreich gelöscht",
      },
    },
  },
};
