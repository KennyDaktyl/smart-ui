export interface RaspberryWithDevices {
  rpi: any;
  devices: any[];
  live: any[];
  liveInitialized: boolean;
  is_online: boolean;
  last_seen?: string | null;
}