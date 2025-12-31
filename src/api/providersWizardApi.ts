import { WizardResponse } from "@/features/providers/types/wizard";
import axiosClient from "./axiosClient";

export const providersWizardApi = {
  startWizard: (vendor: string) =>
    axiosClient.get<WizardResponse>(
      `/providers/wizard/${vendor}`
    ),

  submitStep: (
    vendor: string,
    step: string,
    payload: Record<string, any>,
    context?: Record<string, any>
  ) =>
    axiosClient.post<WizardResponse>(
      `/providers/wizard/${vendor}/${step}`,
      { 
        payload,
        context
     }
    )
};