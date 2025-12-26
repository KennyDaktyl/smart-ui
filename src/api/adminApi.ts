import { UserResponse } from "@/features/users/types/user";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import axiosClient from "./axiosClient";
import { PaginatedResponse } from "@/components/types/pagination";
import { UserFormPayload } from "@/features/admin/types/userForm";
import {
  CreateMicrocontrollerPayload,
  EditMicrocontrollerPayload,
  UpdateMicrocontrollerConfigPayload,
} from "@/features/microcontrollers/types/microcontrollerPayload";

type GetUsersParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

type GetMicrocontrollersParams = {
  limit?: number;
  offset?: number;
  search?: string;
};

export const adminApi = {
  getUsers: (params?: GetUsersParams) => {
    return axiosClient.get<PaginatedResponse<UserResponse>>(
      "/admin/users/list",
      { params }
    );
  },

  getUserDetails: (userId: number) => {
    return axiosClient.get(`/admin/users/${userId}/details`);
  },

  createUser: (payload: UserFormPayload) => {
    return axiosClient.post("/admin/users", payload);
  },
  updateUser: (userId: number, payload: UserFormPayload) => {
    return axiosClient.patch(`/admin/users/${userId}`, payload);
  },

  deleteUser: (userId: number) => {
    return axiosClient.delete(`/admin/users/${userId}`);
  },

  getMicrocontrollers: (params?: GetMicrocontrollersParams) =>
    axiosClient.get<PaginatedResponse<MicrocontrollerResponse>>(
      "/admin/microcontrollers/list",
      { params }
    ),

  getMicrocontroller: (microcontrollerId: number) =>
    axiosClient.get(`/admin/microcontrollers/${microcontrollerId}`),

  
  createMicrocontroller: (payload: CreateMicrocontrollerPayload) =>
    axiosClient.post("/admin/microcontrollers", payload),

  updateMicrocontroller: (
    microcontrollerId: number,
    payload: EditMicrocontrollerPayload
  ) =>
    axiosClient.patch(
      `/admin/microcontrollers/${microcontrollerId}`,
      payload
  ),

  updateMicrocontrollerConfig: (
    microcontrollerId: number,
    payload: UpdateMicrocontrollerConfigPayload
  ) =>
    axiosClient.patch(
      `/admin/microcontrollers/${microcontrollerId}/config`,
      payload
  ),

  deleteMicrocontroller: (microcontrollerId: number) =>
    axiosClient.delete(`/admin/microcontrollers/${microcontrollerId}`),
};
