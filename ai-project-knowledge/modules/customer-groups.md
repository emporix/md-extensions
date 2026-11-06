# Customer groups

Last scanned: 05d8d1d (2026-11-06)
Sources: `customer-groups/README.md`, `customer-groups/src/models/Groups.model.ts`, `customer-groups/src/hooks/api/iam.ts`, `customer-groups/src/RemoteComponent.tsx`, `customer-groups/src/pages/CustomerGroups.page.tsx`, `customer-groups/src/pages/Group.page.tsx`, `customer-groups/src/context/Group.provider.tsx`, `customer-groups/src/components/customerGroups/GroupsTable.tsx`, `customer-groups/src/components/group/GroupPageActions.tsx`, `customer-groups/src/configs/accessControls.ts`, `customer-groups/src/helpers/groups/accessControlsSaveDirty.test.tsx`, `customer-groups/src/helpers/groups/systemGroupDelete.ts`, `customer-groups/src/components/customerGroups/GroupsTable.delete.test.tsx`

## Scope

This federated Management Dashboard module manages IAM groups of `userType: CUSTOMER`: list, create, edit, delete, members, and access controls (`customer-groups/README.md`). The mounted screens do that.

`GroupUserTypes.CUSTOMER` is the string `CUSTOMER` (`customer-groups/src/models/Groups.model.ts`). The list passes it into `getGroups` (`customer-groups/src/pages/CustomerGroups.page.tsx`, `customer-groups/src/components/customerGroups/GroupsTable.tsx`, `customer-groups/src/hooks/api/iam.ts`). Add and detail wrap the page in `GroupDataProvider` with that type (`customer-groups/src/RemoteComponent.tsx`). Create, update, member load, and member add on the detail page use the provider value (`customer-groups/src/components/group/GroupPageActions.tsx`, `customer-groups/src/components/group/GroupMembers.tsx`).

When a caller omits the user type, the IAM hook defaults to `EMPLOYEE` (`customer-groups/src/hooks/api/iam.ts`). Outside `GroupDataProvider`, the context default is also `EMPLOYEE` (`customer-groups/src/context/Group.provider.tsx`).

Federation name is `customerGroups`. The exposed module is `./RemoteComponent` (`customer-groups/vite.config.ts`, `customer-groups/README.md`). The remote uses `HashRouter`. Paths inside it are `/`, `/groups/add`, and `/groups/:groupId` (`customer-groups/src/constants/paths.ts`, `customer-groups/src/RemoteComponent.tsx`). Any other path redirects to `/`. Dev and preview listen on port 5174 (`customer-groups/vite.config.ts`). The README local `remoteEntry.js` example uses port 4173 (`customer-groups/README.md`). The README host contract — route key `customerGroups`, path `administration/customer-groups/*`, env `VITE_CUSTOMER_GROUPS_URL` — does not appear in this module's source.

Calls use `VITE_API_URL` plus the host tenant and token (`customer-groups/src/api/bootstrap.ts`, `customer-groups/README.md`). A missing base URL throws. A missing tenant rejects the call. The embedded entry takes `appState` (`customer-groups/src/RemoteComponent.tsx`, `customer-groups/src/models/AppState.model.ts`). The standalone dev shell collects tenant, token, and language before rendering (`customer-groups/src/App.tsx`).

## Operator permissions

The shell loads the caller's access controls, scopes, and IAM templates before painting routes (`customer-groups/src/context/PermissionsProvider.tsx`). A domain is granted only when every access-control id on that domain is in the caller's set. A higher role implies the lower roles that share its base name: `Administrator` implies `Manager`, which implies `Editor`, which implies `Viewer`. The implication walks the employee, OE, vendor, and customer catalogs (`customer-groups/src/helpers/accessControls.ts`).

| Action | Employee domain |
|---|---|
| Create, delete, batch delete, add or remove members, save | `Users And Groups Manager` |
| Audit tab | `Audit Log Viewer` |
| Assign access controls, and loading the tenant access-control catalog | `Access Controls Viewer` |
| Company picker can be viewed | `Companies Viewer` |

Domain constants are in `customer-groups/src/configs/accessControls.ts`. Call sites: `customer-groups/src/pages/CustomerGroups.page.tsx`, `customer-groups/src/pages/Group.page.tsx`, `customer-groups/src/components/customerGroups/GroupsTable.tsx`, `customer-groups/src/components/group/GroupMembers.tsx`, `customer-groups/src/components/group/AccessControlsTable.tsx`, `customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`.

Opening a row does not check the manager domain (`customer-groups/src/components/customerGroups/GroupsTable.tsx`). Unassign of a domain or a single access control does not check it either (`customer-groups/src/components/group/AccessControlsTable.tsx`, `customer-groups/src/components/group/AccessControlsExpansionTable.tsx`).

The tenant catalog loads only after `Access Controls Viewer` is granted (`customer-groups/src/context/PermissionsProvider.tsx`). Without it, the access-control table uses the no-permissions empty text (`customer-groups/src/components/group/AccessControlsTable.tsx`).

## Group record

`Group` has `id`, `code`, `name`, optional `b2b.legalEntityId`, `description`, `accessControls`, `templates`, `metadata`, `userType`, optional `vendorId`, optional `mixins`, and optional `restrictions` (`customer-groups/src/models/Groups.model.ts`). `name` and `description` are locale maps (`customer-groups/src/models/Localized.model.ts`). `metadata` may include `createdAt`, `modifiedAt`, and `version` (`customer-groups/src/models/Metadata.model.ts`).

The form edits `id`, `name`, `description`, `b2b.legalEntityId`, `restrictions`, and `accessControls` (`customer-groups/src/helpers/groups/groupForm.helpers.tsx`, `customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). `code` and `mixins` are not fields. On edit the payload starts from the loaded group, so those properties remain when the document had them (`mapGroupFormToPayload`). On create the payload is the form mapping only.

`userType` is an argument of the IAM create and update calls, not a form field (`customer-groups/src/hooks/api/iam.ts`). These routes always pass `CUSTOMER`, including when the loaded document's `userType` is something else. Whether IAM accepts that is unknown.

Empty strings, nulls, and objects that become empty are removed before the request (`customer-groups/src/helpers/utils.ts`, `customer-groups/src/components/group/GroupPageActions.tsx`). An empty restrictions selection is mapped to `null` and then removed, so the body omits `restrictions`. Whether the API clears a stored value is unknown.

## List

Create is disabled without `Users And Groups Manager` (`customer-groups/src/pages/CustomerGroups.page.tsx`).

The table requests one server page of `CUSTOMER` groups (`customer-groups/src/components/customerGroups/GroupsTable.tsx`). Default page size is 10 (`customer-groups/src/hooks/usePagination.tsx`). The column is the localized name (`customer-groups/src/hooks/useGroupsTableColumns.tsx`). Row click and edit open `/groups/:groupId` and store the current path as `backTo`. The detail header goes back to `/` and does not read `backTo` (`customer-groups/src/pages/Group.page.tsx`). No other reader of `backTo` was found.

Delete calls IAM without force. Any thrown error opens a confirm dialog and retries that group with `force: true` (`customer-groups/src/components/customerGroups/GroupsTable.tsx`, `customer-groups/src/hooks/api/iam.ts`). Success refreshes the list. A group with no `id` stops the rest of the batch. Which IAM status means "needs force" is unknown; the UI treats every failure that way. The row delete control and the selection Delete button stay visible and inactive when the row `code` is `CUSTOMER`, ignoring case, or when the selection includes such a group. A blank code stays deletable. Employee system codes are not protected on this list (`customer-groups/src/helpers/groups/systemGroupDelete.ts`, `customer-groups/src/components/customerGroups/GroupsTable.delete.test.tsx`).

The list add-members dialog sits outside `GroupDataProvider`, so it uses the default `EMPLOYEE` for `getAllUsers` and `addUserToGroup` (`customer-groups/src/components/customerGroups/GroupsTable.tsx`, `customer-groups/src/components/group/GroupAddMembersDialog.tsx`). The same dialog on the detail page receives `CUSTOMER` from the provider.

## Create and edit

Tabs are `details`, `members`, and, with `Audit Log Viewer`, `audit-log` (`customer-groups/src/pages/Group.page.tsx`). The active tab is the `tab` query on the hash URL. An unknown value falls back to the first tab (`customer-groups/src/hooks/useTabs.tsx`). A tab change resets `page` to 1 and `rows` to 10. Members and audit are omitted until a group is loaded, so create shows details only.

Name is required: at least one locale value must be non-blank. Description is optional. `id` can be typed only while creating (`customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`).

Save requires a valid form, `Users And Groups Manager`, and a dirty form or a dirty `accessControls` array (`customer-groups/src/components/group/GroupPageActions.tsx`). `accessControlsSaveDirty.test.tsx` covers that dirty path with a `userType: CUSTOMER` group (`customer-groups/src/helpers/groups/accessControlsSaveDirty.test.tsx`). Discard resets the form. The audit tab hides save, discard, and add members.

Create sends the stripped payload with `CUSTOMER`. HTTP 409 uses the server `message` and `details`, otherwise a local title that includes the form id or `resourceId` (`customer-groups/src/components/group/GroupPageActions.tsx`, `customer-groups/src/helpers/api.ts`). The create result is treated as the new group id and the route replaces to that detail path. Other failures toast `details`, or `message` when `details` is absent.

When the form's DCP or OE template arrays are non-empty, create and edit require `templates[0]` from the loaded IAM template list and store that single id on the group (`customer-groups/src/components/group/GroupPageActions.tsx`, `customer-groups/src/helpers/groups/groupForm.helpers.tsx`). The customer form does not render the employee role picker that fills those arrays (`customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). They can still be filled after load when the group's access-control ids contain every id of a local DCP or OE template (`customer-groups/src/helpers/groups/accessControls.helpers.ts`, `customer-groups/src/configs/accessControlsTemplates.tsx`). Those local templates list employee access-control ids. Customer domain ids in this repo use the `2ac869fc-` prefix (`customer-groups/src/configs/accessControls.ts`). Whether a stored customer group can match a full DCP or OE template is unknown.

Edit of a customer group whose loaded `templates` array is non-empty returns before the update call and shows no toast (`customer-groups/src/components/group/GroupPageActions.tsx`, Hotfix COP-3557).

A successful edit reloads the group and the caller's access controls, then resets the form. A failed group load returns to the list and toasts `usersAndGroups.users.toasts.fetchUser.error` (`customer-groups/src/context/Group.provider.tsx`).

## Company

The company field is rendered for `CUSTOMER` and binds `b2b.legalEntityId` (`customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). Options come from legal-entity search with contacts omitted (`customer-groups/src/components/shared/CompanySelector.tsx`, `customer-groups/src/hooks/api/customerManagement.ts`). The label is `name`, or `id` when name is missing (`customer-groups/src/models/LegalEntity.model.ts`). Selection is a single id. The picker is viewable with `Companies Viewer` and editable when the rest of the form is manageable. A failed lookup of the current id leaves the resolved list empty. A blank company is an empty string and is then stripped from the payload.

The vendor picker is mounted only for `EMPLOYEE`, so these routes do not show it (`customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). `vendorId` is still copied from the form. The form value is empty unless mapping preserved a loaded `vendorId`. An empty string is stripped (`customer-groups/src/helpers/groups/groupForm.helpers.tsx`).

## Restrictions

The form reads configuration keys `restrictions` and `enableSyncBetweenRestrictionsAndSiteCodes` (`customer-groups/src/hooks/api/configuration.ts`, `customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). A truthy sync value labels the field as sites. A failed read leaves the list empty and sync off. The dropdown is disabled when that list is empty. A selected value missing from the list stays as an option whose label is the value plus ` (removed)`. A non-empty selection is sent as a string array.

`SitesProvider` loads sites when a token exists (`customer-groups/src/context/SitesProvider.tsx`, `customer-groups/src/api/sites.ts`). No screen calls `useSites`. The field options are the configuration list.

## Access controls on a customer group

For `groupType === 'CUSTOMER'`, the role context returns the customer catalog (`customer-groups/src/context/GroupRole.provider.tsx`). That catalog is the tenant access controls whose ids sit in `CUSTOMER_DOMAINS`. Predefined controls keep only those customer domain names (`customer-groups/src/context/PermissionsProvider.tsx`). Tenant controls outside that id set, including non-predefined controls, are left out.

| Domain | Access controls (`AccessControlsForCustomer`) |
|---|---|
| Customer Orders Viewer | legal-entity orders viewer |
| Customer Checkout Manager | legal-entity order up to a limit |
| Customer Checkout Administrator | legal-entity order without a limit |
| Customer Users Manager | read own legal entities, read own user, manage users, assign users |

UUID constants are in `customer-groups/src/configs/accessControls.ts`.

A named domain is shown as assigned only when every control in it is selected. A partial selection is grouped under `zzzOther`, and the unassign dialog labels that group Other (`customer-groups/src/helpers/accessControls.ts`, `customer-groups/src/components/group/AccessControlsTable.tsx`). Assign unions the chosen ids into the form. Unassign drops one domain's ids or one control id. The assign button is off for a predefined group and without `Access Controls Viewer`. It is also off when the role type is templates; these routes leave the role type at `STANDARD` (`customer-groups/src/context/GroupRole.provider.tsx`). Confirm in the dialog is off for a predefined group or an empty selection (`customer-groups/src/components/group/AssignAccessControlsDialog.tsx`).

`AccessControl.restrictedTo` may be `CUSTOMER` or `EMPLOYEE` (`customer-groups/src/models/Permissions.model.ts`). No screen reads `restrictedTo`. `Template.tags` uses `RoleCode` `viewer`, `editor`, `manager`, `administrator` (`customer-groups/src/models/Groups.model.ts`). No customer-group screen reads `tags`.

When a loaded customer group has templates, the provider replaces in-memory `accessControls` with the union of the group's ids and the access controls of `templates[0]` (`customer-groups/src/context/Group.provider.tsx`). That merge is display state. The edit path then refuses to save.

## Predefined customer groups

A loaded group is predefined when `userType` is `CUSTOMER` and either `templates` is non-empty or any locale name contains a whole word `admin`, `buyer`, `contact`, `requester`, or `customers`, case-insensitive (`customer-groups/src/context/Group.provider.tsx`, Hotfix COP-3557). Predefined groups show an info warning (`customer-groups/src/components/group/GroupDetails.tsx`). General fields are disabled (`customer-groups/src/components/group/GroupDetailsGeneralForm.tsx`). Assign is disabled. Unassign stays available. A name-keyword group can still be saved if the form becomes dirty. A template group cannot: edit returns before the API call.

## Members

On the detail page, members are users of the provider user type whose `id` is a group assignment `userId` (`customer-groups/src/context/Group.provider.tsx`). Users are read in pages of 500 until the list is exhausted (`customer-groups/src/hooks/api/iam.ts`, `customer-groups/src/helpers/paginationUtils.ts`). An assigned user missing from that list is omitted. The table paginates the filtered array in the browser (`customer-groups/src/components/group/GroupMembers.tsx`).

Customer columns are first name, last name, `contactEmail`, and status (`customer-groups/src/hooks/useUsersTableColumns.tsx`). Filter values are `ACTIVE` and `INACTIVE`. The indicator is on only when `status` is `ACTIVE`. The user model also allows `PROVISIONED` (`customer-groups/src/models/User.model.ts`). The customer filter does not offer it.

Candidates are users of the same type who are not already members (`customer-groups/src/components/group/GroupAddMembersDialog.tsx`). Adds run one after another and each call sends the user type. Removes run together (`customer-groups/src/components/group/GroupMembers.tsx`). Each call toasts its own success or failure. A failure does not stop the others, because the single-member helpers catch the error. Members reload after the batch. The manager domain disables remove and the add button on the members tab. The empty-table add action opens the dialog without a second check inside the dialog.

`GroupUser` is `id`, `groupId`, `userId`, `userType` (`customer-groups/src/models/Groups.model.ts`).

## Audit log

With `Audit Log Viewer`, the third tab loads changelogs for entity `group` and the route group id, and only while the tab is active (`customer-groups/src/pages/Group.page.tsx`, `customer-groups/src/components/auditLog/EntityChangelogTab.tsx`, `customer-groups/src/hooks/api/changelog.ts`). An empty result shows the empty state. A fetch error clears the list. A related `group` link uses `/groups/:groupId` (`customer-groups/src/configs/entityLinkConfig.ts`). Other entity types have no path in this remote. The file comment says employee entities stay unmapped because this remote has no user detail route.

## Loaded and unused by these screens

`FeatureTogglesProvider` loads every feature-toggle value (`customer-groups/src/context/FeatureTogglesProvider.tsx`). No screen calls `useFeatureToggles`. `SitesProvider` loads sites. No screen calls `useSites`. `useIamApi` also exposes scope, access-control, and user create/update/delete (`customer-groups/src/hooks/api/iam.ts`). Customer-group screens do not call those writes. Vendor writes exist (`customer-groups/src/hooks/api/vendors.ts`) and these routes do not call them. The employee role editor (`customer-groups/src/components/group/GroupDetailsGeneralFormRoles.tsx` and its standard, template, and vendor children) renders only when `groupType` is `EMPLOYEE`.

## Tests that name this behaviour

`accessControlsSaveDirty.test.tsx` builds a `CUSTOMER` group and expects Save to enable when only `accessControls` changes. `mapAccessControlsToTemplates` is covered by `customer-groups/src/helpers/groups/accessControls.helpers.test.ts`. `getEntityDetailPath` is covered by `customer-groups/src/configs/entityLinkConfig.test.ts`. IAM and platform error parsing, including conflict toasts, is covered by `customer-groups/src/helpers/api.test.ts`. Changelog pagination and path formatting are covered by `customer-groups/src/helpers/auditLog/changelog.helpers.test.ts` and `customer-groups/src/helpers/auditLog/entityChangelog.helpers.test.ts`. List delete for code `CUSTOMER` is covered by `customer-groups/src/components/customerGroups/GroupsTable.delete.test.tsx`. No page test covers list loading, create, members, or the predefined-group rules.

## Host wiring

| Fact | Value |
|---|---|
| Kind | playbook-aligned (derived from users-and-groups) (`customer-groups/package.json`) |
| Federation `name` | `customerGroups` (`customer-groups/vite.config.ts`) |
| Host route `key` → path | `customerGroups` → `administration/customer-groups/*` (`management-dashboard` `src/router/module-routes.tsx`) |
| Host env var | `VITE_CUSTOMER_GROUPS_URL` (`management-dashboard` `.env.*`) |
| Local port | `5174`, `strictPort` |
| Local deviations | none beyond showing `CUSTOMER` groups only |

## Unknown

Whether IAM rejects a non-customer id on these `CUSTOMER` calls. How force-delete differs from delete. Whether omitting `restrictions` clears them. What `code` and `mixins` mean beyond being copied on edit. Host registration of the remote.
