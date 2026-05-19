export default {
  id: 'Assignment Id',
  title: 'Contacts',
  singular: 'Contact',
  plural: 'Contacts',
  name: 'Name',
  company: 'Company',
  back: 'contacts',
  saveAndAddAsApproval: 'Save as approval contact',
  contactType: 'Type',
  emailAddress: 'Email',
  link: 'Link Customer',
  linkOther: 'Change Customer',
  unlink: 'Unlink Customer',
  customers: 'Customers',
  blankCustomer: 'Customer name (ID)',
  tooltip: {
    id: 'Unique Id of the assignment. It will be generated if not provided.',
    alreadyAssigned:
      'This customer is already assigned to this company as a contact.',
  },
  edit: {
    title: 'Edit contact',
  },
  assignment: {
    customer: 'Assign Customer',
    userType: 'User type',
    customerType: 'Customer',
    contactType: 'Contact',
  },
  newTitle: 'Add new contact',
  primary: 'Primary',
  legalEntity: 'Legal entity',
  firstName: 'First name',
  surname: 'Last name',
  emails: 'Emails',
  phones: 'Phones',
  address1: 'Address line 1',
  address2: 'Address line 2',
  city: 'City',
  state: 'State',
  postcode: 'Postcode',
  country: 'Country',
  type: {
    logistics: 'Logistics',
    billing: 'Billing',
    primary: 'Primary',
    contact: 'Contact',
  },
  backToCompany: 'company',
  changeTypeToCustomer: 'Convert Contact to Customer',
  toast: {
    add: {
      success: {
        title: 'Contact added!',
      },
    },
    edit: {
      success: {
        title: 'Contact edited!',
      },
    },
    save: {
      error: {
        title: 'Cannot save the contact',
      },
      success: {
        title: 'Contact saved!',
      },
    },
    convert: {
      success: {
        title: 'Contact converted to customer!',
      },
    },
  },
  toasts: {
    errorLoad: 'Failed to load contacts',
    errorSave: 'Failed to save contact',
    errorDelete: 'Failed to delete contact',
    errorLoadCustomers: 'Failed to load customers',
    errorConvert: 'Failed to convert contact to customer',
    deleteSuccess: 'Successfully deleted contacts',
    unassignSuccess: 'Successfully unassigned customer',
  },
  table: {
    filters: {
      name: 'Filter by name',
      surname: 'Filter by surname',
    },
  },
}
