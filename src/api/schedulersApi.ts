import axiosClient from "@/api/axiosClient";
import type {
  Scheduler,
  SchedulerPayload,
} from "@/features/schedulers/types/scheduler";

export const schedulersApi = {
  list: () => axiosClient.get<Scheduler[]>("/schedulers"),
  create: (payload: SchedulerPayload) =>
    axiosClient.post<Scheduler>("/schedulers", payload),
  update: (schedulerId: number, payload: SchedulerPayload) =>
    axiosClient.put<Scheduler>(`/schedulers/${schedulerId}`, payload),
  remove: (schedulerId: number) =>
    axiosClient.delete(`/schedulers/${schedulerId}`),
};
