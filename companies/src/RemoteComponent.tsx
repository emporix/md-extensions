import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppState } from "./models/AppState.model";
import { DashboardProvider } from "./context/Dashboard.context";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import "./translations/i18n";
import "/node_modules/primeflex/primeflex.css";
import "primeicons/primeicons.css";
import ApiProvider from "./context/ApiProvider.tsx";
import { ConfigurationProvider } from "./context/ConfigurationProvider.tsx";
import { SiteProvider } from "./context/SitesProvider.tsx";
import { DateTimeProvider } from "./context/DateTimeProvider.tsx";
import { TenantProvider } from "./context/TenantProvider.tsx";
import { PermissionsProvider } from "./context/PermissionsProvider.tsx";
import { RestrictionsProvider } from "./context/RestrictionsProvider.tsx";
import { CurrencyProvider } from "./context/CurrencyProvider.tsx";
import { ProductDataProvider } from "./context/ProductDataProvider.tsx";
import { ToastProvider } from "./context/ToastProvider.tsx";
import { UIBlockerProvider } from "./context/UIBlcoker.tsx";
import { RefreshValuesProvider } from "./context/RefreshValuesProvider.tsx";
import { FeatureTogglesProvider } from "./components/featureToggles/FeatureTogglesProvider.tsx";
import { SelectionValuesProvider } from "./context/SelectionValuesProvider.tsx";
import { NavigationConfirmProvider } from "./context/NavigationConfirmProvider.tsx";
import CompaniesModule from "./modules/Companies.module.tsx";
import CompaniesAddEditModule from "./modules/CompaniesAddEdit.module.tsx";
import { LocationAddEdit } from "./components/companies/LocationAddEdit.tsx";
import { ContactAddEdit } from "./components/contacts/ContactAddEdit.tsx";
import { CustomerAssignmentAddEdit } from "./components/contacts/CustomerAssignmentAddEdit.tsx";
import { mergeRemoteAppState } from "./helpers/mergeRemoteAppState.ts";

interface RemoteComponentProps {
  /** Host may send extra keys; see {@link mergeRemoteAppState}. */
  appState?: Partial<AppState> & Record<string, unknown>;
}

const defaultAppState: AppState = {
  tenant: "default",
  language: "en",
  token: "default",
  currency: undefined,
  contentLanguage: "en",
  permissions: {},
  user: {},
  onError: () => {},
};

const RemoteComponent = ({
  appState: incomingAppState,
}: RemoteComponentProps) => {
  const appState = mergeRemoteAppState(defaultAppState, incomingAppState);
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const lng = appState.language?.trim();
    if (lng) void i18n.changeLanguage(lng);
  }, [appState.language, i18n]);

  return (
    <DashboardProvider appState={appState}>
      <HashRouter>
        <NavigationConfirmProvider>
          <ApiProvider>
            <TenantProvider>
            <PermissionsProvider>
              <RestrictionsProvider>
                <CurrencyProvider>
                  <ProductDataProvider>
                    <SiteProvider>
                      <ConfigurationProvider>
                        <SelectionValuesProvider>
                          <RefreshValuesProvider>
                            <DateTimeProvider>
                              <ToastProvider>
                                <FeatureTogglesProvider>
                                  <UIBlockerProvider>
                                    <Routes>
                                      <Route
                                        path="/"
                                        element={
                                          <Navigate
                                            to="/apps/management/companies"
                                            replace
                                          />
                                        }
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/assignments/contact/:contactAssignmentId"
                                        element={<ContactAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/assignments/contact"
                                        element={<ContactAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/assignments/customer/:contactAssignmentId"
                                        element={<CustomerAssignmentAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/assignments/customer"
                                        element={<CustomerAssignmentAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/locations/:locationId"
                                        element={<LocationAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId/locations"
                                        element={<LocationAddEdit />}
                                      />
                                      <Route
                                        path="/apps/management/companies/add"
                                        element={<CompaniesAddEditModule />}
                                      />
                                      <Route
                                        path="/apps/management/companies/:companyId"
                                        element={<CompaniesAddEditModule />}
                                      />
                                      <Route
                                        path="/apps/management/companies"
                                        element={<CompaniesModule />}
                                      />
                                      <Route
                                        path="*"
                                        element={
                                          <div className="p-4">
                                            {t("notFound.title")}
                                          </div>
                                        }
                                      />
                                    </Routes>
                                  </UIBlockerProvider>
                                </FeatureTogglesProvider>
                              </ToastProvider>
                            </DateTimeProvider>
                          </RefreshValuesProvider>
                        </SelectionValuesProvider>
                      </ConfigurationProvider>
                    </SiteProvider>
                  </ProductDataProvider>
                </CurrencyProvider>
              </RestrictionsProvider>
            </PermissionsProvider>
          </TenantProvider>
          </ApiProvider>
        </NavigationConfirmProvider>
      </HashRouter>
    </DashboardProvider>
  );
};

export default RemoteComponent;
