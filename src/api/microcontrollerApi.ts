import axiosClient from "@/api/axiosClient";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { EditMicrocontrollerPayload } from "@/features/microcontrollers/types/microcontrollerPayload";

export const microcontrollersApi = {

  getUserMicrocontrollers: () => {
    return axiosClient.get<MicrocontrollerResponse[]>("/microcontrollers/get_for_user");
  },
  updateMicrocontroller: (
    microcontrollerUuid: string,
    payload: EditMicrocontrollerPayload
  ) => {
    return axiosClient.patch<MicrocontrollerResponse>(
      `/microcontrollers/${microcontrollerUuid}`,
      payload
    );
  },
  setProvider: (microcontrollerUuid: string, providerUuid: string | null) => {
    return axiosClient.put<MicrocontrollerResponse>(`/microcontrollers/set_provider/${microcontrollerUuid}/`, {
      provider_uuid: providerUuid,
    });
  },
};
