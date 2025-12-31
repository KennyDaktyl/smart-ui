import axiosClient from "@/api/axiosClient";
import { EnumOption } from "@/features/common/types/enumOption";

export const enumsApi = {
  getUnits: () => {
    return axiosClient.get<EnumOption[]>("/enums/units");
  },

  getSensorTypes: () => {
    return axiosClient.get<EnumOption[]>("/enums/sensor-types");
  },
};
