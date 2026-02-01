import axiosClient from "@/api/axiosClient";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

export const microcontrollersApi = {

  getUserMicrocontrollers: () => {
    return axiosClient.get<MicrocontrollerResponse[]>("/microcontrollers/get_for_user");
  },
  setProvider: (microcontrollerUuid: string, providerUuid: string | null) => {
    return axiosClient.put<MicrocontrollerResponse>(`/microcontrollers/set_provider/${microcontrollerUuid}/`, {
      provider_uuid: providerUuid,
    });
  },
};
