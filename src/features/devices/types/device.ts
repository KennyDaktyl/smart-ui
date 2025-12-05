import { DeviceMode } from "@/shared/enums/deviceMode";

export interface ApiDevice {
    id: number;
    uuid: string;
    user_id: number;
    name: string;
    device_number: number;
    rated_power_kw: number;
    hysteresis_w: number;
    threshold_kw: number | null;
    mode: DeviceMode;
    is_on: boolean;
    schedule: any | null;
    raspberry_id: number;
    last_update: string;
}

export interface DeviceFormData {
    name: string;
    rated_power_kw: number | "";
    mode: DeviceMode;
    device_number: number;
    threshold_kw: number | "" ;
}