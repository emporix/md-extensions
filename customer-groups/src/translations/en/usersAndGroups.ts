export default {
  titles: {
    main: 'Users And Groups',
    customerGroups: 'Groups',
  },
  buttons: {
    createUser: 'Create New User',
    createGroup: 'Create New Group',
  },
  tabs: {
    users: 'Users',
    groups: 'Groups',
  },
  users: {
    singular: 'User',
    plural: 'Users',
    tabs: {
      details: 'Details',
      access: 'Access',
    },
    tables: {
      users: {
        columns: {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'User Email',
          accessType: 'Tenant Role',
          status: 'Status',
          department: 'Department',
        },
      },
    },
    forms: {
      user: {
        firstName: 'First Name',
        lastName: 'Last Name',
        contactEmail: 'Email Address',
        department: 'Department',
        preferredSite: 'Preferred Site',
        preferredLanguage: 'Preferred Language',
        preferredCurrency: 'Preferred Currency',
        status: 'Status',
        userGroups: 'User Groups',
        validFrom: 'Valid From',
      },
    },
    toasts: {
      createUser: {
        success: 'User successfully added',
        generalError: 'Error while creating user',
        conflictError: 'User with given email already exists.',
      },
      editUser: {
        success: 'User successfully edited',
        error: 'Error while editing user',
      },
      deleteUser: {
        success: 'User {{name}} successfully deleted',
        error: 'Error while deleting user {{name}}',
      },
      fetchUsers: {
        error: 'Error while fetching users',
      },
      fetchUser: {
        error: 'Error while fetching user',
      },
      fetchGroups: {
        error: 'Error while fetching groups',
      },
    },
  },
  groups: {
    plurals: {
      groups: {
        singular: 'Group',
        plural: 'Groups',
      },
      accessControls: {
        singular: 'Access control',
        plural: 'Access controls',
      },
    },
    titles: {
      addMembers: 'Available Unassigned Members',
      general: 'General',
      settings: 'Management Dashboard Settings',
      customerSettings: 'Customer Settings',
      accessControls: 'Access Controls Assignment',
      customerAccessControls: 'Customer Access Controls Assignment',
      availableAccessControls: 'Available Access Controls',
    },
    labels: {
      dcp: 'Digital Commerce',
      oe: 'Orchestration Engine',
      customer: 'Customer',
      access: 'Access',
      permissions: 'Permissions',
      restrictionAware: 'Site Aware',
    },
    buttons: {
      addMembers: 'Add Members',
      assignAccessControls: 'Assign Access Controls',
    },
    tabs: {
      details: 'Details',
      members: 'Members',
    },
    tables: {
      groups: {
        columns: {
          name: 'Group Name',
        },
        actions: {
          addMembers: 'Add members',
        },
      },
      members: {
        emptyText: '{{name}} doesn’t have any member yet.',
        actions: {
          removeMember: 'Remove Member',
        },
        singular: 'Member',
        plural: 'Members',
      },
      accessControls: {
        emptyText: 'No access controls found',
        name: 'Name',
      },
      permissions: {
        columns: {
          siteAware: 'Site Aware',
          restrictionAware: 'Restriction Aware',
          viewer: 'Read',
          editor: 'Edit',
          manager: 'Manage',
          administrator: 'Administrate',
          legalEntityViewer: 'Read',
          legalEntityManager: 'Manage',
          legalEntityAdministrator: 'Administrate',
          legalEntitiesBuyer: 'Manage',
        },
      },
    },
    forms: {
      group: {
        id: 'Id',
        tooltip: {
          id: 'Unique Id of the user group. It will be generated if not provided.',
          restrictionsEmpty:
            'The restrictions list is empty. Please configure restrictions in the configuration service.',
        },
        name: 'Group Name',
        description: 'Group Description',
        company: 'Company',
        restrictions: 'Restrictions',
        sites: 'Sites',
        placeholder: {
          restrictions: 'Select restrictions',
          sites: 'Select sites',
        },
        role: {
          title: 'Role',
          labels: {
            standard: 'Standard',
            templates: 'Templates',
            viewer: 'Viewer',
            editor: 'Editor',
            manager: 'Manager',
            administrator: 'Administrator',
            vendor: 'Vendor',
          },
        },
        errors: {
          name: "Words 'Admin', 'Buyer', 'Contact', 'Requester' and 'Customers' are reserved for predefined groups.",
        },
      },
    },
    toasts: {
      createGroup: {
        success: 'Group successfully added',
        error: 'Error while creating group',
        conflictError: 'Group with id {{name}} already exists.',
      },
      editGroup: {
        success: 'Group successfully edited',
        error: 'Error while editing group',
      },
      deleteGroup: {
        success: 'Group {{name}} successfully deleted',
        error: 'Error while deleting group {{name}}',
      },
      fetchGroups: {
        error: 'Error while fetching groups',
      },
      fetchGroup: {
        error: 'Error while fetching group',
      },
      fetchUsers: {
        error: 'Error while fetching users',
      },
      fetchMembers: {
        error: 'Error while fetching members',
      },
      removeMember: {
        success: '{{name}} successfully removed from the group',
        error: 'Error while removing member',
      },
      addMember: {
        success: '{{name}} successfully added to the group',
        error: 'Error while adding member',
      },
      fetchTemplates: {
        error: 'Error while fetching templates',
      },
      fetchAccessControls: {
        error: 'Error while fetching access controls',
      },
      removeAccessControl: {
        success: 'Access control successfully removed from the group',
        error: 'Error while removing access control',
      },
    },
    dialogs: {
      unassignDomain: {
        title: 'Unassign access controls?',
        text: 'Are you sure you want to unassign access controls from {{name}}?',
      },
      deleteGroupForce: {
        title: 'FORCE DELETE GROUP - THIS CAN NOT BE UNDONE!',
        text: 'Are you sure you want to delete {{name}} that has members?',
      },
    },
    tooltips: {
      restrictionAware:
        'Indicates which entities are restriction-aware. These entities can limit user access based on assigned restrictions.',
      siteAware:
        'Indicates which entities are site-aware. These entities can limit user access based on assigned sites.',
      viewer: {
        dcp: 'The users with read permission can only read. They cannot modify anything.',
        oe: 'The users with read permission can...',
      },
      legalEntityViewer: {
        dcp: 'The user must obtain read permission to access orders from that company.',
      },
      legalEntityManager: {
        dcp: 'The user must obtain manage permission to access user management of that company.',
      },
      editor: {
        oe: 'The users with edit permission can...',
      },
      manager: {
        dcp: 'The users with manage permission can read, create, edit and delete.',
        oe: 'The users with manage permission can...',
      },
      administrator: {
        oe: 'The users with admin permission can...',
      },
      legalEntityAdministrator: {
        dcp: 'The users with legal entity administrator permission can do an order without limit.',
      },
      legalEntitiesBuyer: {
        dcp: 'The users with legal entities buyer permission can do an order up to limit.',
      },
    },
    warnings: {
      isPredefined:
        "This group is predefined and cannot be modified. If you need one with slightly different permissions, please create a new group. Remember that 'Admin', 'Buyer', 'Contact', 'Requester' and 'Customers' names are reserved for predefined groups.",
    },
  },
}
