export default {
  titles: {
    main: 'Benutzer und Gruppen',
    customerGroups: 'Gruppen',
  },
  buttons: {
    createUser: 'Neuen Benutzer hinzufügen',
    createGroup: 'Neue Gruppe hinzufügen',
  },
  warnings: {
    entraIdSyncEnabled:
      'Die Entra-ID-Gruppensynchronisierung ist für diesen Tenant aktiviert. Mitarbeiterzugriff wird in Entra ID verwaltet. Manuelles Anlegen von Benutzern sowie Zuweisen zu oder Entfernen aus Gruppen ist deaktiviert.',
  },
  tabs: {
    users: 'Benutzer',
    groups: 'Gruppen',
  },
  users: {
    singular: 'Benutzer',
    plural: 'Benutzer',
    tabs: {
      details: 'Details',
      access: 'Zugang',
    },
    tables: {
      users: {
        columns: {
          firstName: 'Vorname',
          lastName: 'Nachname',
          email: 'Benutzer Email',
          accessType: 'Tenant Rolle',
          status: 'Status',
          department: 'Abteilung',
        },
      },
    },
    forms: {
      user: {
        firstName: 'Virname',
        lastName: 'Nachname',
        contactEmail: 'Email Addresse',
        department: 'Abteilung',
        preferredSite: 'Präferierte Site',
        preferredLanguage: 'Präferierte Sprache',
        preferredCurrency: 'Präferierte Währung',
        status: 'Status',
        userGroups: 'Benutzergruppen',
        validFrom: 'Gültig vom',
      },
    },
    toasts: {
      createUser: {
        success: 'Benutzer erfolgreich hinzugefügt',
        generalError: 'Fehler beim Anlegen des Benutzers',
        conflictError:
          'Der Benutzer mit der angegebenen E-Mail-Adresse ist bereits vorhanden.',
      },
      editUser: {
        success: 'Benutzer erfolgreich geändert',
        error: 'Fehler beim Ändern des Benutzers',
      },
      deleteUser: {
        success: 'Benutzer {{name}} erfolgreich gelöscht',
        error: 'Fehler beim Löschen des Benutzers {{name}}',
      },
      fetchUsers: {
        error: 'Fehler beim Aufruf von Benutzern',
      },
      fetchUser: {
        error: 'Fehler beim Aufruf des Benutzers',
      },
      fetchGroups: {
        error: 'Fehler beim Aufruf von Gruppen',
      },
    },
  },
  groups: {
    plurals: {
      groups: {
        singular: 'Gruppe',
        plural: 'Gruppen',
      },
      accessControls: {
        singular: 'Zugriffssteuerung',
        plural: 'Zugriffssteuerungen',
      },
    },
    titles: {
      addMembers: 'Verfügbare nicht zugewiesene Mitglieder',
      general: 'Allgemein',
      settings: 'Management Dashboard Einstellungen',
      customerSettings: 'Kunden Einstellungen',
      accessControls: 'Zuweisung von Zugriffskontrollen',
      customerAccessControls: 'Zuweisung von Zugriffskontrollen für Kunden',
      availableAccessControls: 'Verfügbare Zugriffskontrollen',
    },
    labels: {
      dcp: 'Digital Commerce',
      oe: 'Orchestration Engine',
      customer: 'Kunde',
      access: 'Zugriff',
      permissions: 'Berechtigungen',
      restrictionAware: 'Beschränkungsensitiv',
    },
    buttons: {
      addMembers: 'Mitglied hinzufügen',
      assignAccessControls: 'Zugriffskontrolle zuweisen',
    },
    tabs: {
      details: 'Details',
      members: 'Mitglieder',
    },
    tables: {
      groups: {
        columns: {
          name: 'Gruppenname',
        },
        actions: {
          addMembers: 'Mitglieder hinzufügen',
        },
      },
      members: {
        emptyText: '{{name}} hat noch kein Mitglied.',
        actions: {
          removeMember: 'Mitglied entfernen',
        },
        singular: 'Mitglied',
        plural: 'Mitglieder',
      },
      accessControls: {
        emptyText: 'Keine Zugriffssteuerungen gefunden',
        name: 'Name',
      },
      permissions: {
        columns: {
          siteAware: 'Site aware',
          restrictionAware: 'Beschränkungsensitiv',
          viewer: 'Lesen',
          editor: 'Bearbeiter',
          manager: 'Manage',
          administrator: 'Verwalten',
          legalEntityViewer: 'Lesen',
          legalEntityManager: 'Verwalten',
        },
      },
    },
    forms: {
      group: {
        id: 'Id',
        tooltip: {
          id: 'Eindeutige Id der Benutzergruppe. Sie wird generiert, wenn sie nicht vergeben wird.',
          restrictionsEmpty:
            'Die Beschränkungsliste ist leer. Bitte konfigurieren Sie Beschränkungen im Konfigurationsdienst.',
        },
        name: 'Gruppenname',
        description: 'Gruppenbeschreibung',
        company: 'Firma',
        restrictions: 'Beschränkungen',
        sites: 'Sites',
        placeholder: {
          restrictions: 'Beschränkungen auswählen',
          sites: 'Sites auswählen',
        },
        role: {
          title: 'Rolle',
          labels: {
            standard: 'Standard',
            templates: 'Vorlagen',
            viewer: 'Leser',
            editor: 'Bearbeiter',
            manager: 'Manager',
            administrator: 'Administrator',
            legalEntityAdministrator: 'Administrator',
            legalEntitiesBuyer: 'Manager',
            vendor: 'Verkäufer',
          },
        },
        errors: {
          name: "Die Namen 'Admin', 'Buyer', 'Contact', 'Requester' und 'Customers' sind für vordefinierte Gruppen reserviert.",
        },
      },
    },
    toasts: {
      createGroup: {
        success: 'Gruppe erfolgreich hinzugefügt',
        error: 'Fehler beim Erstellen der Gruppe',
        conflictError: 'Gruppe mit der Id {{name}} existiert bereits.',
      },
      editGroup: {
        success: 'Grupper erfolgreich bearbeitet',
        error: 'Fehler beim Bearbeiten der Gruppe',
      },
      deleteGroup: {
        success: 'Gruppe {{name}} erfolgreich gelöscht',
        error: 'Fehler beim Löschen der Gruppe {{name}}',
      },
      fetchGroups: {
        error: 'Fehler beim Abrufen der Gruppen',
      },
      fetchGroup: {
        error: 'Fehler beim Abrufen der Gruppe',
      },
      fetchUsers: {
        error: 'Fehler beim Aufrufen der Benutzer',
      },
      fetchMembers: {
        error: 'Fehler beim Aufrufen der Mitglieder',
      },
      removeMember: {
        success: '{{name}} erfolgreich aus der Gruppe entfernt',
        error: 'Fehler beim Entfernen des Mitglieds',
      },
      addMember: {
        success: '{{name}} erfolgreich zur Gruppe hinzugefügt',
        error: 'Fehler beim Hinzufügen des Mitglieds',
      },
      fetchTemplates: {
        error: 'Fehler beim Abrufen der Vorlagen',
      },
      fetchAccessControls: {
        error: 'Fehler beim Abrufen der Zugriffssteuerungen',
      },
      removeAccessControl: {
        success: 'Zugriffssteuerung erfolgreich aus der Gruppe entfernt',
        error: 'Fehler beim Entfernen der Zugriffssteuerung',
      },
    },
    dialogs: {
      unassignDomain: {
        title: 'Zugriffskontrolle aufheben?',
        text: 'Möchten Sie die Zugriffskontrolle {{name}} wirklich aufheben?',
      },
      deleteGroupForce: {
        title:
          'GRUPPE ZWANGSWEISE LÖSCHEN - DIES KANN NICHT RÜCKGÄNGIG GEMACHT WERDEN!',
        text: 'Sind Sie sicher, dass Sie {{name}}, der Mitglieder hat, löschen wollen?',
      },
    },
    tooltips: {
      restrictionAware:
        'Zeigt an, welche Entitäten Restriction aware sind. Der Zugriff für diese Entitäten kann aufgrund der zugewiesenen Restriction(s) eingeschränkt werden.',
      siteAware:
        'Zeigt an, welche Entitäten Site aware sind. Der Zugriff für diese Entitäten kann aufgrund der zugewiesenen Site(s) eingeschränkt werden.',
      viewer: 'Viewer kann...',
      manager: 'Manager kann...',
      editor: 'Bearbeiter kann...',
      administrator: 'Administrator kann...',
      legalEntityViewer: {
        dcp: 'Die Benutzergruppe muss eine Leseberechtigung erhalten, um auf die Aufträge einer Firma zugreifen zu können.',
      },
      legalEntityManager: {
        dcp: 'Die Benutzergruppe muss eine Verwaltungsberechtigung erhalten, um auf die Benutzerverwaltung einer Firma zugreifen zu können.',
      },
      legalEntityAdministrator: {
        dcp: 'Die Benutzergruppe muss eine Verwaltungsberechtigung erhalten, um auf die Aufträge einer Firma ohne Limit zugreifen zu können.',
      },
      legalEntitiesBuyer: {
        dcp: 'Die Benutzergruppe muss eine Verwaltungsberechtigung erhalten, um auf die Aufträge einer Firma bis zu einem Limit zugreifen zu können.',
      },
    },
    warnings: {
      isPredefined:
        "Diese Gruppe ist vordefiniert und kann nicht geändert werden. Wenn Sie eine Gruppe mit leicht abweichenden Berechtigungen benötigen, erstellen Sie bitte eine neue Gruppe. Beachten Sie, dass die Namen 'Admin', 'Buyer', 'Contact', 'Requester' und 'Customers' für vordefinierte Gruppen reserviert sind.",
    },
  },
}
