import axiosClient from "@/api/axiosClient";
import { ProviderDefinitionsResponse } from "@/features/providers/types/provider";
import { ProviderResponse, UserProvider } from "@/features/providers/types/userProvider";

export const providersApi = {

  getProviders: () => {
    return axiosClient.get<ProviderResponse[]>("/providers/list");
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
  
};
