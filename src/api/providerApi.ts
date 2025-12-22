import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const providersPath = `${API_URL}/providers`;
const providerDetailsPath = (uuid: string) => `${providersPath}/${uuid}`;
const microcontrollerProvidersPath = (microcontrollerUuid: string) =>
  `${API_URL}/microcontrollers/${microcontrollerUuid}/providers`;

export const providerApi = {
  getUserProviders: (token: string) =>
    axiosClient.get(providersPath, authHeaders(token)),

  getProviderCatalog: (token: string) =>
    axiosClient.get(`${providersPath}/catalog`, authHeaders(token)),

  getProvider: (token: string, providerUuid: string) =>
    axiosClient.get(providerDetailsPath(providerUuid), authHeaders(token)),

  getProviderDefinitions: (token: string) =>
    axiosClient.get(`${providersPath}/definitions`, authHeaders(token)),

  getProviderDefinitionDetails: (token: string, vendor: string) =>
    axiosClient.get(`${providersPath}/definitions/${vendor}`, authHeaders(token)),

  getProviderDefinitionConfig: (token: string, vendor: string) =>
    axiosClient.get(
      `${providersPath}/definitions/${vendor}/config`,
      authHeaders(token)
    ),

  getWizardStart: (token: string, vendor: string) =>
    axiosClient.get(`${providersPath}/wizard/${vendor}`, authHeaders(token)),

  runWizardStep: (
    token: string,
    vendor: string,
    step: number | string,
    payload: Record<string, any>
  ) =>
    axiosClient.post(
      `${providersPath}/wizard/${vendor}/${step}`,
      payload,
      authHeaders(token)
    ),

  getMicrocontrollerProviders: (token: string, microcontrollerUuid: string) =>
    axiosClient.get(
      microcontrollerProvidersPath(microcontrollerUuid),
      authHeaders(token)
    ),

  getMicrocontrollerProviderDefinitions: (token: string, microcontrollerUuid: string) =>
    axiosClient.get(
      `${microcontrollerProvidersPath(microcontrollerUuid)}/definitions`,
      authHeaders(token)
    ),

  createMicrocontrollerProvider: (
    token: string,
    microcontrollerUuid: string,
    payload: any
  ) =>
    axiosClient.post(
      microcontrollerProvidersPath(microcontrollerUuid),
      payload,
      authHeaders(token)
    ),

  createUserProvider: (token: string, payload: any) =>
    axiosClient.post(providersPath, payload, authHeaders(token)),

  updateProvider: (token: string, providerUuid: string, payload: any) =>
    axiosClient.patch(providerDetailsPath(providerUuid), payload, authHeaders(token)),

  updateProviderStatus: (
    token: string,
    providerUuid: string,
    payload: { enabled: boolean }
  ) =>
    axiosClient.patch(
      `${providerDetailsPath(providerUuid)}/status`,
      payload,
      authHeaders(token)
    ),

  updateMicrocontrollerProvider: (
    token: string,
    microcontrollerUuid: string,
    providerId: number,
    payload: any
  ) =>
    axiosClient.patch(
      `${microcontrollerProvidersPath(microcontrollerUuid)}/${providerId}`,
      payload,
      authHeaders(token)
    ),

  updateMicrocontrollerProviderStatus: (
    token: string,
    microcontrollerUuid: string,
    providerId: number,
    payload: { enabled: boolean }
  ) =>
    axiosClient.patch(
      `${microcontrollerProvidersPath(microcontrollerUuid)}/${providerId}/status`,
      payload,
      authHeaders(token)
    ),

  deleteProvider: (token: string, providerUuid: string) =>
    axiosClient.delete(providerDetailsPath(providerUuid), authHeaders(token)),
};
