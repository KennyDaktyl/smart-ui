import { microcontrollerApi } from "./microcontrollerApi";

export const raspberryApi = {
  getMyRaspberries: (token: string) => microcontrollerApi.getMicrocontrollers(token),

  updateRaspberry: (token: string, uuid: string, payload: any) =>
    microcontrollerApi.patchMicrocontroller(token, uuid, payload),
};
