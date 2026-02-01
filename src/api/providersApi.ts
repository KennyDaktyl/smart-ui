import axiosClient from "@/api/axiosClient";
import { ProviderDefinitionsResponse } from "@/features/providers/types/provider";
import {
  ProviderMeasurementSeries,
  ProviderResponse,
  UserProvider,
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

  getProviderMeasurements: (
    providerUuid: string,
    params?: {
      date_start?: string;
      date_end?: string;
      limit?: number;
    }
  ) => {
    return axiosClient.get<ProviderMeasurementSeries>(
      `/provider-measurements/provider/${providerUuid}`,
      { params }
    );
  },
  
};
