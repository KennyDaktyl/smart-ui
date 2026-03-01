import axiosClient from "@/api/axiosClient";

export type PublicContactPayload = {
  subject: string;
  email: string;
  message: string;
};

export const publicContactApi = {
  sendLead: (payload: PublicContactPayload) =>
    axiosClient.post("/public/contact-lead", payload),
};
