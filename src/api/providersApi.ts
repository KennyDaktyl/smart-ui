import axiosClient from "@/api/axiosClient";
import { ProviderDefinitionsResponse } from "@/features/providers/types/provider";
import {
  ProviderMetricSeries,
  ProviderEnergySeries,
  ProviderTelemetryResponse,
  ProviderResponse,
} from "@/features/providers/types/userProvider";

export const providersApi = {

  getProviders: () => {
    return axiosClient.get<ProviderResponse[]>("/providers/list");
  },

  getProviderByUuid: (uuid: string) => {
    return axiosClient.get<ProviderResponse>(`/providers/${uuid}`);
  },

  createProvider: (payload: unknown) => {
    return axiosClient.post<ProviderResponse>("/providers", payload);
  },

  updateProvider: (uuid: string, payload: unknown) => {
    return axiosClient.patch<ProviderResponse>(`/providers/${uuid}`, payload);
  },

  getProviderDefinitions: () =>
    axiosClient.get<ProviderDefinitionsResponse>(
      "/providers/definitions/list"
  ),

  setProviderEnabled: (
    uuid: string,
    enabled: boolean
  ) => {
    return axiosClient.patch<ProviderResponse>(
      `/providers/${uuid}/enabled`,
      { enabled }
    );
  },

  getProviderEnergy: (
    providerUuid: string,
    params?: {
      date?: string;
    }
  ) => {
    return axiosClient.get<ProviderEnergySeries>(
      `/provider-measurements/provider/${providerUuid}/energy`,
      { params }
    );
  },

  getProviderTelemetry: (
    providerUuid: string,
    params?: {
      date?: string;
    }
  ) => {
    return axiosClient.get<ProviderTelemetryResponse>(
      `/provider-measurements/provider/${providerUuid}/telemetry`,
      { params }
    );
  },

  getProviderMetric: (
    providerUuid: string,
    metricKey: string,
    params?: {
      date?: string;
    }
  ) => {
    return axiosClient.get<ProviderMetricSeries>(
      `/provider-measurements/provider/${providerUuid}/metrics/${metricKey}`,
      { params }
    );
  },
  
};
