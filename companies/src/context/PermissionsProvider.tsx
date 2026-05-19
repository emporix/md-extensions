import React, { createContext, useCallback, useContext, FC } from "react";
import { Props } from "../helpers/props";
import { useDashboardContext } from "./Dashboard.context";
import { ResourcesDCP, ResourcesOE, RoleCode } from "../helpers/accessConfig";
import { EmployeeDomains } from "../configs/accessControls";
import { Template } from "../models/Groups";

export type Permissions = {
  [key in ResourcesDCP | ResourcesOE]?: { [key in RoleCode]?: boolean };
};

interface PermissionContextType {
  permissions: Permissions | undefined;
  userPermissions: Set<string>;
  tenantPermissions: Set<string>;
  userAccessControls: string[];
  tenantAccessControls: string[];
  templates: Template[];
  /** OAuth-style scopes; empty => RestrictionsProvider treats lists as unrestricted */
  userScopes: string[];
  isPermissionsLoading: boolean;
  vendor?: string;
  syncUserAccessControls: () => Promise<void>;
  /** MD domain string (e.g. Companies Manager); uses `appState.permissions` when host sends them. */
  hasPermission: (domainName: EmployeeDomains) => boolean;
}

const PermissionsContext = createContext<PermissionContextType>({
  permissions: undefined,
  userPermissions: new Set([]),
  tenantPermissions: new Set([]),
  userAccessControls: [],
  tenantAccessControls: [],
  templates: [],
  userScopes: [],
  isPermissionsLoading: false,
  vendor: undefined,
  syncUserAccessControls: async () => {},
  hasPermission: () => true,
});

export const usePermissions = () => useContext(PermissionsContext);

/**
 * Permissions map from `appState.permissions`.
 * `userScopes` from `appState.userScopes` or legacy `appState.scopes` when the host supplies them.
 */
export const PermissionsProvider: FC<Props> = ({ children }) => {
  const ctx = useDashboardContext();
  const { permissions, userScopes: scopesFromState } = ctx;
  const userScopes = scopesFromState ?? [];

  const hasPermission = useCallback(
    (domain: EmployeeDomains): boolean => {
      const co = permissions?.[ResourcesDCP.COMPANIES];
      const cu = permissions?.[ResourcesDCP.CUSTOMERS];
      const noResourceHints =
        !permissions ||
        (typeof permissions === "object" &&
          Object.keys(permissions as object).length === 0);

      if (noResourceHints && userScopes.length === 0) {
        return true;
      }

      switch (domain) {
        case EmployeeDomains.COMPANIES_MANAGER:
          return Boolean(
            co?.[RoleCode.MANAGER] ||
              co?.[RoleCode.ADMINISTRATOR] ||
              co?.[RoleCode.EDITOR],
          );
        case EmployeeDomains.COMPANIES_VIEWER:
          return Boolean(
            co?.[RoleCode.VIEWER] ||
              co?.[RoleCode.MANAGER] ||
              co?.[RoleCode.ADMINISTRATOR] ||
              co?.[RoleCode.EDITOR],
          );
        case EmployeeDomains.CUSTOMERS_MANAGER:
          return Boolean(
            cu?.[RoleCode.MANAGER] ||
              cu?.[RoleCode.ADMINISTRATOR] ||
              cu?.[RoleCode.EDITOR],
          );
        case EmployeeDomains.CUSTOMERS_VIEWER:
          return Boolean(
            cu?.[RoleCode.VIEWER] ||
              cu?.[RoleCode.MANAGER] ||
              cu?.[RoleCode.ADMINISTRATOR] ||
              cu?.[RoleCode.EDITOR],
          );
        default:
          return false;
      }
    },
    [permissions, userScopes.length],
  );

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        userPermissions: new Set(),
        tenantPermissions: new Set(),
        userAccessControls: [],
        tenantAccessControls: [],
        templates: [],
        userScopes,
        isPermissionsLoading: false,
        vendor: undefined,
        syncUserAccessControls: async () => {},
        hasPermission,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
