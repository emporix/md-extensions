export default {
  title: "Companies",
  singular: "Company",
  plural: "Companies",
  subsidiary: "Subsidiary",
  backButton: "companies",
  addNewCompany: "Add new company",
  name: "Company name",
  type: "Company type",
  countryOfRegistration: "Country of registration",
  primaryContact: "Primary contact",
  blockedTab: "Please save data first",
  customerGroups: {
    tableName: "Group name",
  },
  taxRegistrationNumber: "Tax registration number",
  table: {
    filters: {
      name: "Search by name",
    },
  },
  toast: {
    create: {
      title: "Created company!",
    },
    update: {
      title: "Updated company!",
    },
    delete: {
      title: "Deleted company!",
    },
  },
  toasts: {
    errorSave: "Failed to save company",
    errorLoad: "Failed to load company",
    errorDelete: "Failed to delete company",
  },
  edit: {
    tabs: {
      companyDetails: "Company details",
      legalEntity: "Legal entity",
      locations: "Locations",
      subsidiaries: "Subsidiaries",
      policies: "Policies",
      customerGroups: "Customer groups",
      contacts: "Contacts",
      emailAddress: "Email Address",
    },
    form: {
      details: {
        id: "Id",
        title: "Details",
        name: "Company name",
        restriction: "Restriction",
        restrictionPlaceholder: "Select restriction...",
      },
      primaryContacts: {
        title: "Primary contacts",
        add: "Add contact",
        columns: {
          name: "Name",
          email: "Email",
          phoneNumber: "Phone Number",
        },
      },
      legalEntity: {
        title: "Legal Entity",
        legalName: "Legal name",
        taxRegistrationNumber: "Tax registration no",
        countryOfRegistration: "Country of registration",
        countryOfRegistrationPlaceholder: "Select country...",
        registrationAgency: "Registration agency",
        registrationDate: "Registration date",
        registrationId: "Registration id",
      },
      locations: {
        title: "Locations",
        addNew: "Add new location",
      },
      subsidiaries: {
        title: "Subsidiaries",
        addNew: "Add new subsidiary",
      },
      policies: {
        purchasingLimits: {
          subtitle: "Purchasing limits",
        },
        accountLimit: "Account limit",
        priceLists: {
          subtitle: "Price lists",
        },
        approvalGroup: {
          subtitle: "Approval group",
          columns: {
            name: "Name",
            surname: "Surname",
            email: "Email",
          },
        },
      },
      contacts: {
        assignCustomer: "Assign Customer",
        addNew: "Add new contact",
        title: "Contacts",
      },
      customerGroups: {
        title: "Customers groups",
      },
      tooltip: {
        id: "Unique Id of the company. It will be generated if not provided.",
      },
    },
  },
  locations: {
    back: "company",
    title: "Location {{name}}",
    newTitle: "New Location",
    locationType: {
      office: "Office",
      warehouse: "Warehouse",
      headquarter: "Headquarter",
    },
    list: {
      name: "Name",
      locationType: "Location Type",
      address: "Address",
      tags: "Tags",
    },
    toast: {
      success: {
        title: "Successfully added/updated location",
      },
      delete: {
        success: {
          title: "Successfully deleted location",
        },
        error: "Failed to delete location",
      },
    },
    actions: {
      delete: "Deleting location",
    },
    form: {
      id: "Id",
      locationType: "Type",
      country: "Country",
      name: "Name",
      address1: "Address line 1",
      address2: "Address line 2",
      city: "City",
      state: "State",
      postcode: "Postcode",
      tags: "Tags",
      tooltip: {
        id: "Unique Id of the location. It will be generated if not provided.",
      },
    },
  },
  approvalGroup: {
    add: {
      existing: {
        label: "Add approval contact",
      },
      new: {
        label: "Create new approval contact",
      },
    },
    toast: {
      add: {
        success: "Successfully added approval contact",
      },
      delete: {
        success: "Successfully deleted approval contact",
      },
    },
  },
};
