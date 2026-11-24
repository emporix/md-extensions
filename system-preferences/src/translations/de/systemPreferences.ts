export default {
  title: 'Systemeinstellungen',
  columns: {
    key: 'Key',
    name: 'Name',
    value: 'Wert',
    edit: 'Bearbeiten',
  },
  selectValue: 'Wert auswählen',
  commaSeparatedValues: 'Durch Komma getrennte Werte eingeben',
  clear: 'Wert löschen',
  clearConfirm: {
    title: 'Geheimnis löschen',
    message:
      'Der gespeicherte Wert wird gelöscht. Dies kann nicht rückgängig gemacht werden.',
  },
  toasts: {
    successCreate: 'Systemeinstellung erfolgreich erstellt',
    successUpdate: 'Systemeinstellung erfolgreich aktualisiert',
    successDelete: 'Systemeinstellung erfolgreich gelöscht',
    errorCreate: 'Fehler beim Erstellen der Systemeinstellung',
    errorUpdate: 'Fehler beim Aktualisieren der Systemeinstellung',
    errorDelete: 'Fehler beim Löschen der Systemeinstellung',
  },
  preferences: {
    openAiApiToken: {
      name: 'Open AI API-Token',
    },
    maxNumberOfCouponsPerCart: {
      name: 'Maximale Anzahl von Coupons pro Warenkorb',
    },
    couponPermanentDelete: {
      name: 'Permanentes Löschen von Coupons aktivieren',
    },
    signUpEnableAccountCreationEmailConfirmation: {
      name: 'E-Mail-Bestätigung bei der Registrierung aktivieren',
    },
    approvalDefaultExpiryDays: {
      name: 'Ablauftage der Genehmigungen',
    },
    approvalEnableQuoteApprovalProcess: {
      name: 'Genehmigungsprozess für Angebote aktivieren',
    },
    customerPasswordResetRedirectUrl: {
      name: 'Passwort-Zurücksetzen-URL',
    },
    cartItemValidationSkipEffectiveAmount: {
      name: 'Optionale effectiveAmount-Validierung im Warenkorb',
    },
    cartItemValidationSkipOriginalAmount: {
      name: 'Optionale originalAmount-Validierung im Warenkorb',
    },
    allowAnonymousCheckoutWithExistingCustomerEmail: {
      name: 'Anonymen Checkout mit E-Mail-Adresse eines bestehenden Kunden erlauben',
    },
    enableLegalEntityAddressFallbackInCart: {
      name: 'Fallback auf Adresse der juristischen Person im Warenkorb aktivieren, wenn keine Adresse angegeben ist',
    },
    cartItemValidationSkipCurrency: {
      name: 'Optionale Währungsvalidierung im Warenkorb',
    },
    cartItemValidationSkipExistingItemsValidationOnAddToCart: {
      name: 'Validierung bestehender Warenkorbartikel beim Hinzufügen überspringen',
    },
    indexingSiteAwareFieldsStrategy: {
      name: 'Indexierungsstrategie für standortbezogene Felder',
    },
    enableCouponCodeCaseSensitivity: {
      name: 'Coupon-Code kann in Groß- und Kleinschreibung gespeichert werden',
    },
    enableExternalPrices: {
      name: 'Externe Preise aktivieren',
    },
    enableOrderAddressPropagation: {
      name: 'Bestelladress-Weitergabe aktivieren. Wenn aktiviert, wird die Bestelladresse zu den Kundenadressen hinzugefügt',
    },
    populateProductDetailsOnAddToCart: {
      name: 'Produktinformationen beim Hinzufügen zum Warenkorb automatisch ausfüllen',
    },
    customerOnHoldOnCreation: {
      name: 'Kunden-onHold bei Erstellung immer auf angegebenen Wert setzen, andernfalls Standardwerte verwenden',
    },
    customerActiveOnCreation: {
      name: 'Kunden-Aktivstatus bei Erstellung immer auf angegebenen Wert setzen, andernfalls Standardwerte verwenden',
    },
    companyContactPropagation: {
      name: 'Unternehmenskontakte-Weitergabe mit Tochtergesellschaften',
    },
    enableSyncBetweenRestrictionsAndSiteCodes: {
      name: 'Synchronisierung zwischen Einschränkungen und Site Codes aktivieren',
      description:
        'Wenn die Synchronisierung zwischen Einschränkungen und Site Codes aktiviert ist, enthält die Einschränkungsliste Werte, die den Site Codes entsprechen.',
    },
    restrictions: {
      name: 'Liste der Einschränkungen',
      description:
        'Wenn die Synchronisierung zwischen Einschränkungen und Site Codes aktiviert ist, enthält die Einschränkungsliste Werte, die den Site Codes entsprechen, und die Einschränkungen sind unveränderlich.',
    },
    enableProductCategoryAssignmentValidation: {
      name: 'Produkt vor Zuweisung einer Kategorie auf Existenz prüfen',
    },
    allowToSkipRelatedProductsValidation: {
      name: 'Überspringen der Validierung verwandter Produkte erlauben',
    },
    ssoCustomerAutoprovisioningDisabled: {
      name: 'SSO-Kunden-Autoprovisioning deaktivieren',
      description:
        'Wenn die SSO-Kunden-Autoprovisioning deaktiviert ist, bedeutet das, dass wenn ein Kunde über SSO einloggt, der Kunde nicht automatisch im System erstellt wird.',
    },
    ssoCustomerIdentifierField: {
      name: 'SSO-Kunden-Identifier-Feld',
      description:
        'Wenn das SSO-Kunden-Identifier-Feld auf EMAIL gesetzt ist, wird die E-Mail-Adresse als Kunden-Identifier verwendet. Wenn es auf SUBJECT gesetzt ist, wird der Sub-Claim als Kunden-Identifier verwendet.',
    },
    predefinedLegalEntityGroupsCreationDisabled: {
      name: 'Vordefinierte Gruppen für juristische Personen deaktivieren',
      description:
        'Wenn die Erstellung vordefinierter Gruppen deaktiviert ist, werden beim Anlegen einer juristischen Person keine Standard-Kundengruppen automatisch erstellt.',
    },
    languageSchemaVersion: {
      name: 'Sprachschema-Version',
      description:
        'Steuert die Form lokalisierter TEXT-Felder in Mixin-Schemas. v1 speichert ein Array aus Sprache/Wert-Paaren. v2 speichert eine Objekt-Map mit Sprachcodes als Schlüssel. Ein Wechsel auf v2 und anschließendes Aktualisieren eines bestehenden Mixins regeneriert lokalisierte Felder. Beim Speichern einer Entität im Management Dashboard werden gespeicherte v1-Arrays in v2-Maps konvertiert.',
    },
    deleteAvailabilitiesOnSiteDeletion: {
      name: 'Verfügbarkeiten löschen, wenn eine Site gelöscht wird',
      description:
        'Wenn dies aktiv ist, entfernt das Löschen einer Site die Produktverfügbarkeiten dieser Site. Wenn dies aus ist, bleiben diese Verfügbarkeiten erhalten.',
    },
    webhookFailureThreshold: {
      name: 'Webhook-Fehlerschwelle',
      description:
        'Die Anzahl aufeinanderfolgender fehlgeschlagener Zustellungen, nach der ein Webhook-Ziel abgeschaltet wird. Der Standardwert ist 100.',
    },
    webhookNotificationEmails: {
      name: 'E-Mail-Adressen für Webhook-Benachrichtigungen',
      description:
        'Die E-Mail-Adressen, die benachrichtigt werden, wenn ein Webhook-Ziel abgeschaltet wird. Ist die Liste leer, geht die E-Mail an den Standardmitarbeiter.',
    },
  },
}
