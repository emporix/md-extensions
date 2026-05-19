import { useEffect } from "react";
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { api, ErrorResponse } from "../api/index";
import { Props } from "../helpers/props";
import { useDashboardContext } from "./Dashboard.context.tsx";

const ApiProvider = ({ children }: Props) => {
  const { token, tenant, onError } = useDashboardContext();
  const apiIsReady = Boolean(token && tenant);

  useEffect(() => {
    const requestInterceptorId = api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const { headers } = config;
        if (headers) {
          headers["Authorization"] = `Bearer ${token}`;
          headers["Accept-Language"] = headers["Accept-Language"] || "*";
          headers["Content-Language"] = "*";
          headers["Emporix-Tenant"] = tenant;
        }
        return config;
      },
    );

    const responseInterceptorId = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        if (error?.response?.status === 401) {
          onError(error);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptorId);
      api.interceptors.response.eject(responseInterceptorId);
    };
  }, [token, tenant, onError]);

  return apiIsReady ? children : null;
};

export default ApiProvider;
