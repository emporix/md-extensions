import { createContext, useContext } from "react";
import { ResolvedAppState } from "../models/AppState.model";

type DashboardContextType = ResolvedAppState;

const Context = createContext<DashboardContextType>({
  tenant: "",
  language: "",
  token: "",
  currency: undefined,
  contentLanguage: "",
  permissions: {},
  user: {},
  onError: () => {
    // NOOP
  },
});

export const useDashboardContext = () => useContext(Context);

export const DashboardProvider = ({
  children,
  appState,
}: {
  children: React.ReactNode;
  appState: ResolvedAppState;
}) => {
  return <Context.Provider value={appState}>{children}</Context.Provider>;
};
