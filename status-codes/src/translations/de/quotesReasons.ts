// Keys kept from the Management Dashboard `quotesReasons` namespace.
export default {
  title: 'Statuscodes',
  singular: 'Statuscode',
  plural: 'Statuscodes',
  editTitle: 'Statuscode {{quoteReasonId}} bearbeiten',
  addTitle: 'Neuen Statuscode erstellen',
  createButton: 'Statuscode erstellen',
  table: {
    Id: 'ID',
    code: 'Code',
    type: 'Typ',
    filters: {
      id: 'Filtern nach ID',
      code: 'Filtern nach Code',
      type: 'Filtern nach Typ',
    },
  },
  toasts: {
    successCreate: 'Statuscode erstellt!',
    successDelete: 'Statuscode {{code}} gelöscht',
    successUpdate: 'Statuscode aktualisiert',
    errorFetch:
      'Fehler beim Laden von Statuscodes. Bitte versuchen Sie es später erneut',
    errorDelete: 'Fehler beim Löschen des Statuscodes {{code}}',
    errorSave: 'Fehler beim Speichern des Statuscodes',
  },
  form: {
    details: 'Details',
    labels: {
      code: 'Code',
      type: 'Typ',
      message: 'Kommentar',
    },
  },
}
