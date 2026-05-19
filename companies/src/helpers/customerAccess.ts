import type { Permissions } from "../context/PermissionsProvider";

/** Missing MD flags allow UI affordances; only explicit false hides — APIs enforce authorization. */
export function customerMayManage(
  permissions: Permissions | undefined,
): boolean {
  return permissions?.customers?.manager !== false;
}

export function customerMayView(permissions: Permissions | undefined): boolean {
  return permissions?.customers?.viewer !== false;
}
