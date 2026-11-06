# Users and groups

Last scanned: 05d8d1d (2026-11-06)
Sources: `users-and-groups/vite.config.ts`, `users-and-groups/src/RemoteComponent.tsx`, `users-and-groups/src/constants/paths.ts`, `users-and-groups/src/pages/UsersAndGroups.page.tsx`, `users-and-groups/src/pages/User.page.tsx`, `users-and-groups/src/pages/Group.page.tsx`, `users-and-groups/src/models/User.model.ts`, `users-and-groups/src/models/Groups.model.ts`, `users-and-groups/src/models/Permissions.model.ts`, `users-and-groups/src/models/AccessControl.model.ts`, `users-and-groups/src/models/Changelog.model.ts`, `users-and-groups/src/models/Site.model.ts`, `users-and-groups/src/models/Vendor.model.ts`, `users-and-groups/src/models/AppState.model.ts`, `users-and-groups/src/hooks/api/iam.ts`, `users-and-groups/src/hooks/api/changelog.ts`, `users-and-groups/src/hooks/api/configuration.ts`, `users-and-groups/src/hooks/api/featureToggles.ts`, `users-and-groups/src/hooks/api/vendors.ts`, `users-and-groups/src/api/bootstrap.ts`, `users-and-groups/src/api/sites.ts`, `users-and-groups/src/context/PermissionsProvider.tsx`, `users-and-groups/src/context/Group.provider.tsx`, `users-and-groups/src/context/GroupRole.provider.tsx`, `users-and-groups/src/context/FeatureTogglesProvider.tsx`, `users-and-groups/src/context/ConfigurationProvider.tsx`, `users-and-groups/src/context/SitesProvider.tsx`, `users-and-groups/src/configs/accessControls.ts`, `users-and-groups/src/configs/accessControlsTemplates.tsx`, `users-and-groups/src/configs/entraId.config.ts`, `users-and-groups/src/configs/entityLinkConfig.ts`, `users-and-groups/src/helpers/accessControls.ts`, `users-and-groups/src/helpers/users/users.helpers.tsx`, `users-and-groups/src/helpers/groups/groupForm.helpers.tsx`, `users-and-groups/src/helpers/groups/accessControls.helpers.ts`, `users-and-groups/src/helpers/auditLog/changelog.helpers.ts`, `users-and-groups/src/helpers/auditLog/entityChangelog.helpers.ts`, `users-and-groups/src/helpers/paginationUtils.ts`, `users-and-groups/src/helpers/utils.ts`, `users-and-groups/src/hooks/useEntraIdGroupsSync.ts`, `users-and-groups/src/hooks/useUsersTableColumns.tsx`, `users-and-groups/src/components/user/UserDetailsForm.tsx`, `users-and-groups/src/components/user/UserAccessForm.tsx`, `users-and-groups/src/components/usersAndGroups/UsersTable.tsx`, `users-and-groups/src/components/usersAndGroups/GroupsTable.tsx`, `users-and-groups/src/components/group/GroupDetails.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralForm.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralFormRoles.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralFormRolesStandard.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralFormRolesTemplates.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralFormRolesVendor.tsx`, `users-and-groups/src/components/group/GroupDetailsGeneralFormRolesServicePicker.tsx`, `users-and-groups/src/components/group/GroupPageActions.tsx`, `users-and-groups/src/components/group/GroupMembers.tsx`, `users-and-groups/src/components/group/GroupAddMembersDialog.tsx`, `users-and-groups/src/components/group/AccessControlsTable.tsx`, `users-and-groups/src/components/auditLog/EntityChangelogTab.tsx`, `users-and-groups/src/helpers/groups/accessControls.helpers.test.ts`, `users-and-groups/src/helpers/groups/accessControlsSaveDirty.test.tsx`, `users-and-groups/src/helpers/auditLog/changelog.helpers.test.ts`, `users-and-groups/src/helpers/auditLog/entityChangelog.helpers.test.ts`, `users-and-groups/src/configs/entityLinkConfig.test.ts`, `customer-groups/vite.config.ts`, `customer-groups/src/RemoteComponent.tsx`, `customer-groups/src/pages/CustomerGroups.page.tsx`, `users-and-groups/src/helpers/groups/systemGroupDelete.ts`, `users-and-groups/src/components/usersAndGroups/GroupsTable.delete.test.tsx`

Federated remote `usersAndGroups` (`users-and-groups/vite.config.ts` exposes `./RemoteComponent`). It manages tenant **employees** and their IAM groups. Customer groups are a different remote; see the last section. README text was not used.

Host `appState` supplies `tenant`, `token`, and `language` (`users-and-groups/src/models/AppState.model.ts`). `useApiCredentials` copies tenant and token into the shared API client (`users-and-groups/src/api/bootstrap.ts`). `VITE_API_URL` must be set or client init throws. IAM calls reject with the string `no tenant` when tenant is missing (`users-and-groups/src/hooks/api/iam.ts`). Session `user` on app state is not what `hasPermission` reads.

## Access

`hasPermission(domain)` is true only when that domain lists at least one access control and the caller holds every one of them (`users-and-groups/src/context/PermissionsProvider.tsx`, `users-and-groups/src/helpers/accessControls.ts`). Holdings are expanded until stable: for the same base name, Administrator implies Manager, Manager implies Editor, Editor implies Viewer. There is no route guard on `USERS_AND_GROUPS_VIEWER`. Lists still load; create, save, delete, and member actions stay disabled without `USERS_AND_GROUPS_MANAGER` (`users-and-groups/src/pages/UsersAndGroups.page.tsx`, `users-and-groups/src/components/usersAndGroups/UsersTable.tsx`, `users-and-groups/src/components/usersAndGroups/GroupsTable.tsx`).

`USERS_AND_GROUPS_MANAGER` requires IAM groups manager, templates manager, assignments manager, users manager, and access-controls manager. `USERS_AND_GROUPS_VIEWER` requires IAM groups, templates, and users viewer (`users-and-groups/src/configs/accessControls.ts`). Audit tab needs `AUDIT_LOG_VIEWER`. Assigning access controls needs `ACCESS_CONTROLS_VIEWER`. Tenant access controls are fetched only after that viewer check (`PermissionsProvider.tsx`). Language and currency dropdowns need `LANGUAGES_VIEWER` and `CURRENCIES_VIEWER` (`users-and-groups/src/components/user/UserDetailsForm.tsx`). Vendor search placeholder uses `VENDORS_VIEWER`; the vendor call itself is not gated in this remote (`users-and-groups/src/components/group/GroupDetailsGeneralFormRolesVendor.tsx`).

Predefined access controls have their domains replaced from the local domain map. Non-predefined controls keep API domains and are included in the employee picker (`PermissionsProvider.tsx`). Caller scopes are the space-separated `scopes` string from `getScopesForUser`, plus optional `vendorId` (`users-and-groups/src/hooks/api/iam.ts`).

## Routes

Hash routes (`users-and-groups/src/RemoteComponent.tsx`, `users-and-groups/src/constants/paths.ts`):

| Path | What it does |
|---|---|
| `/` and `/?tab=users\|groups` | Employee user list and employee group list |
| `/users/add`, `/users/:userId` | Create or edit one employee |
| `/groups/add`, `/groups/:groupId` | Create or edit one group inside `GroupDataProvider` |
| anything else | Redirect to `/` |

Unknown user or group load returns to the matching list tab (`users-and-groups/src/pages/User.page.tsx`, `users-and-groups/src/context/Group.provider.tsx`). `GroupDataProvider` defaults `groupType` to `EMPLOYEE`. This remote never passes `CUSTOMER`.

## Users

A user has name, `contactEmail`, `department`, preferred site, language, and currency, `groupIds`, `status`, `validFrom`, `active`, `login`, `oktaID`, and optional lock flag (`users-and-groups/src/models/User.model.ts`). `UserStatus` is `ACTIVE`, `INACTIVE`, or `PROVISIONED`. The employee table treats `ACTIVE` as the active dot and offers `PROVISIONED` as the inactive filter value, not `INACTIVE` (`users-and-groups/src/hooks/useUsersTableColumns.tsx`). The detail status dot treats lowercase `active` as on (`UserDetailsForm.tsx`). How those three spellings relate on the server is unknown.

List loads every employee page of 500 and paginates in the browser (`UsersTable.tsx`, `iam.ts`, `users-and-groups/src/helpers/paginationUtils.ts`). `fetchAllRecords` retries a failed page up to 3 times (`paginationUtils.test.ts`).

Create and edit require first name, last name, email, department, preferred site, language, and currency (`UserDetailsForm.tsx`). Sites come from `getSites` (`users-and-groups/src/api/sites.ts`, `users-and-groups/src/context/SitesProvider.tsx`). Languages and currencies come from basic configuration (`users-and-groups/src/context/ConfigurationProvider.tsx`). Without language or currency view permission the control is read-only and still required, so save can stay invalid. Status and `validFrom` show only for an existing user and are not editable. `validFrom` is display-only (`users-and-groups/src/components/user/UserAccessForm.tsx`).

Create posts the form after dropping `''`, `null`, and `undefined` (`users-and-groups/src/helpers/utils.ts`). HTTP 409 shows a conflict toast and stays on the form. Other errors show server details. Success navigates to `/users/{returned value}` (`User.page.tsx`). The response shape of `postUserCall` was not read.

Edit sends the loaded user with form name, email, department, preferences, and `groupIds` overwritten (`users-and-groups/src/helpers/users/users.helpers.tsx`). Status and `validFrom` stay as loaded. Then the caller’s access controls are refreshed. The groups dropdown lists all employee groups (`getAllGroups` defaults to `EMPLOYEE`, page size 100).

Delete is one `deleteUser` per row or selection, with no force flag, then the list reloads (`UsersTable.tsx`). It is not blocked by Entra sync.

## Groups

A group has `id`, localized `name` and `description`, `accessControls`, `templates`, `userType` (`CUSTOMER` or `EMPLOYEE`), optional `vendorId`, `restrictions`, and optional `b2b.legalEntityId` (`users-and-groups/src/models/Groups.model.ts`). Role codes are `viewer`, `editor`, `manager`, `administrator`. The employee form has no legal-entity field. Empty `b2b.legalEntityId` is stripped before save, so the body omits `b2b` (`groupForm.helpers.tsx`, `utils.ts`). Update spreads the loaded group first, so `code` and `userType` from the server are kept. Create does not set them in the form mapper; `userType` is the second argument to `postGroupCall` / `putGroupCall` (`iam.ts`).

The list is server-paginated for `GroupUserTypes.EMPLOYEE` and passes page, sort, and filters into `getGroups` (`GroupsTable.tsx`). How `@emporix/api-calls` maps those filters was not read.

Name must have one non-blank localized value. `id` can be typed only before the group exists (`users-and-groups/src/components/group/GroupDetailsGeneralForm.tsx`). Description is optional. Restrictions come from configuration key `restrictions`. A selected value missing from that list stays visible with the suffix `(removed)`. An empty selection is mapped to `null` and then omitted by `removeEmptyValues`; whether the API clears stored restrictions is unknown. Configuration key `enableSyncBetweenRestrictionsAndSiteCodes` only changes the field label to sites when its value is truthy. A failed read leaves the label as restrictions and the options empty.

Save needs a valid dirty form and `USERS_AND_GROUPS_MANAGER` (`users-and-groups/src/components/group/GroupPageActions.tsx`). Changing only `accessControls` enables Save (`accessControlsSaveDirty.test.tsx`). HTTP 409 uses the server message and details, with a local title fallback (`users-and-groups/src/helpers/api.test.ts`). If any DCP or OE template is selected, `templates` is `[first fetched IAM template id]`. If templates are selected and that id is missing, save stops with an error toast. After a successful edit, the group and the caller’s access controls reload.

Delete calls `deleteGroup(id)` without force. Any failure opens a force confirm; accept retries `deleteGroup(id, true)` (`GroupsTable.tsx`). The row delete control and the selection Delete button stay visible and inactive when the row `code` is `BO_USER`, `BO_MANAGER`, `BO_ADMIN`, or `SUPPORT_USER`, ignoring case, or when the selection includes one of those codes. A blank code stays deletable. `CUSTOMER` is not protected on this list (`users-and-groups/src/helpers/groups/systemGroupDelete.ts`, `users-and-groups/src/components/usersAndGroups/GroupsTable.delete.test.tsx`).

### Roles and access controls

On load, a group with `templates.length > 0` opens as templates; otherwise a `vendorId` opens as vendor; otherwise standard (`users-and-groups/src/components/group/GroupDetailsGeneralFormRoles.tsx`). The vendor radio is hidden on an existing group that has no `vendorId`. All role radios are disabled once `vendorId` is set. Switching role restores that role’s last in-session access controls, templates, and vendor id. Choosing vendor forces service type `dcp`.

The OE/DCP picker shows only when the tenant has OE access controls (`GroupRole.provider.tsx`, `GroupDetailsGeneralFormRolesServicePicker.tsx`). It is disabled for the vendor role. Changing service clears both template selections.

Standard checkboxes replace the whole `accessControls` list with that role’s ids, or clear the list when the checked role is turned off (`GroupDetailsGeneralFormRolesStandard.tsx`). DCP offers viewer, manager, and administrator. OE also offers editor. A box is checked only when the current ids that belong to any role set are exactly that role’s ids. Viewer and manager also pull in users-and-groups viewer, webhooks, and extensions controls. DCP administrator is manager controls plus admin-domain manager controls, not OE administrator controls (`users-and-groups/src/helpers/groups/accessControls.helpers.ts`, `accessControls.helpers.test.ts`).

DCP templates are `orderFulfillmentManager`, `catalogManager`, and `pricingManager`. `OE_TEMPLATES` is empty (`users-and-groups/src/configs/accessControlsTemplates.tsx`). A stored group matches a template only when every template access control is assigned (`mapAccessControlsToTemplates`). Selecting templates replaces `accessControls` with the union of the selected templates. The assign button is disabled for the templates role (`users-and-groups/src/components/group/AccessControlsTable.tsx`).

Vendor id is required in that role and cannot be changed after the group has an id or a `vendorId`. Search is `getVendors` page size 100 with optional `name: (~query)` (`GroupDetailsGeneralFormRolesVendor.tsx`, `vendors.ts`). Vendor role uses vendor-domain access controls; OE service uses OE controls; standard and templates use employee controls, including non-predefined ones (`GroupRole.provider.tsx`).

Assign unions selected ids. Removing a domain removes every id in that domain group. Domains are fully assigned only when every control in the domain is selected; leftovers are grouped as other (`users-and-groups/src/helpers/accessControls.ts`).

The employee domain `Agent Assistant Viewer` groups the agent viewer access control with `AGENT_EXECUTE_MANAGER`, so agent execution can be assigned to a group as one domain (`users-and-groups/src/configs/accessControls.ts`, COP-7016).

### Members

Members shown are users from `getAllUsers(EMPLOYEE)` whose ids appear in `getGroupUsers` (`Group.provider.tsx`). Assignments whose user is outside that user list are not shown. Add offers employees who are not already members and posts `addUserToGroup` with `EMPLOYEE` (`users-and-groups/src/components/group/GroupAddMembersDialog.tsx`). Remove calls `deleteUserFromGroup` (`users-and-groups/src/components/group/GroupMembers.tsx`). The members tab is hidden until the group exists (`users-and-groups/src/pages/Group.page.tsx`).

## Entra ID group sync

Feature toggle code `ENTRAID_GROUPS_SYNC` (`users-and-groups/src/configs/entraId.config.ts`). `areManualMutationsRestricted` is true while toggles are loading or the toggle is enabled (`users-and-groups/src/hooks/useEntraIdGroupsSync.ts`, `FeatureTogglesProvider.tsx`). While restricted:

- Create user is disabled. An existing user can still be saved, but `groupIds` are forced back to the loaded user and the groups dropdown is disabled (`User.page.tsx`, `UserAccessForm.tsx`).
- Add member is disabled. Remove member is disabled for `EMPLOYEE`. The customer exception in `GroupMembers.tsx` does not apply on these routes.
- Group create, group field save, and user delete stay available to a manager. Group delete stays available except for the system codes in the Groups section above.

A missing toggle is treated as off (`isEnabled` defaults false). A failed toggle fetch leaves the list undefined, so the toggle is off after loading finishes.

## Audit log

The tab exists only with `AUDIT_LOG_VIEWER`. User history uses entity `employee`; group history uses entity `group` (`User.page.tsx`, `Group.page.tsx`). The tab is disabled until the id exists. On a group, disabled tabs are removed, so members and audit stay hidden until load. The group header hides save and add-member while audit is active. Rows load only while the tab is active, filtered by `entity` and `entityId` (`users-and-groups/src/components/auditLog/EntityChangelogTab.tsx`, `users-and-groups/src/hooks/api/changelog.ts`). Empty pagination is omitted (`changelog.helpers.ts`, `changelog.helpers.test.ts`). Related badges skip the current entity and id (`entityChangelog.helpers.ts`). Links: `employee` to `/users/:id`, `group` to `/groups/:id`; missing, empty, or `unknown` has no link (`entityLinkConfig.ts`, `entityLinkConfig.test.ts`). The test mock maps API `create` / `update` / `delete` to UI `created` / `updated` / `deleted`. The real mapping is inside `@emporix/api-calls`, which was not read. Null values render as null; objects are JSON (`formatChangelogValue`).

`useIamApi` also wraps scope and access-control create/update/delete, and vendor and location CRUD. No page in this remote calls those writes. Only `getVendors` is used.

## Not the customer-groups remote

`customer-groups` is federation remote `customerGroups` (`customer-groups/vite.config.ts`). Its list is only groups with `GroupUserTypes.CUSTOMER` (`customer-groups/src/pages/CustomerGroups.page.tsx`), and its group routes pass `CUSTOMER` (`customer-groups/src/RemoteComponent.tsx`). It has no user routes.

This remote still contains customer branches that its routes do not turn on (`Group.provider.tsx`, `GroupPageActions.tsx`):

- `isPredefinedGroup` is true only for `userType === CUSTOMER` when the group has templates or a localized name matching `admin`, `buyer`, `contact`, `requester`, or `customers` (whole word, any case). Predefined groups cannot be edited and show a warning (`GroupDetails.tsx`).
- Loading a customer group merges the first template’s access controls into the group.
- Edit of a customer group that already has templates returns without calling update (comment COP-3557).
- Customer member tables use customer columns, whose inactive filter value is `INACTIVE` (`useUsersTableColumns.tsx`).

On the routes this remote mounts, `groupType` stays `EMPLOYEE`, so those locks do not run.

## Tests that pin behaviour

| File | What it pins |
|---|---|
| `users-and-groups/src/helpers/groups/accessControls.helpers.test.ts` | Viewer, editor, manager, OE administrator, and DCP administrator id sets; a template matches only when every access control is present |
| `users-and-groups/src/helpers/groups/accessControlsSaveDirty.test.tsx` | Save enables when only `accessControls` change |
| `users-and-groups/src/helpers/auditLog/changelog.helpers.test.ts` | Pagination and entity filter mapping |
| `users-and-groups/src/helpers/auditLog/entityChangelog.helpers.test.ts` | Related-entity filter, change-type key, value formatting |
| `users-and-groups/src/configs/entityLinkConfig.test.ts` | Employee and group hash paths; unknown entity has no path |
| `users-and-groups/src/helpers/api.test.ts` | IAM and validation error details; conflict toast title and body |
| `users-and-groups/src/helpers/paginationUtils.test.ts` | Page aggregation and retry limit |
| `users-and-groups/src/components/usersAndGroups/GroupsTable.delete.test.tsx` | List delete stays inactive for `BO_USER`, `BO_MANAGER`, `BO_ADMIN`, and `SUPPORT_USER`, and active for a blank code and `CUSTOMER` |

No page-level test was found for Entra restriction, force delete, or the customer-group lock.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (original pilot, Tier 1 source) (`users-and-groups/package.json`) |
| Federation `name` | `usersAndGroups` (`users-and-groups/vite.config.ts`) |
| Host route `key` → path | `usersAndGroups` → `/administration/users-and-groups/*` (inline `ExternalModule moduleName="usersAndGroups"`) (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_USERS_AND_GROUPS_URL` (`management-dashboard` `.env.*`) |
| Local port | not pinned; `docs/MIGRATED_MODULES.md` lists `5173` (Vite's default) |
| Local deviations | `npm run dev` is plain `vite`, so `.env.dev` is not loaded by mode |

## Not yet scanned

- i18n message bodies, styles, `node_modules`, `dist`, `.env*`, and the README (template text).
- Bodies of presentational shared components and the dev-only settings dialog (`users-and-groups/src/App.tsx`, `users-and-groups/src/helpers/settings.helpers.ts`). Tests say dev settings open when tenant or token is missing.
- `@emporix/api-calls` request paths, auth headers, and changelog enum implementation.
- The full UUID catalog in `users-and-groups/src/configs/accessControls.ts` beyond the domains this remote checks.
- `customer-groups` behaviour beyond the files cited above.
