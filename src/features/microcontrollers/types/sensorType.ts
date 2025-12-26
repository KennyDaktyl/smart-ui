export const SENSOR_TYPE_VALUES = [
  "dht22",
  "bme280",
  "bh1750",
] as const;

export type SensorType = (typeof SENSOR_TYPE_VALUES)[number];
