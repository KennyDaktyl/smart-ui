export function mergeLiveDeviceData(devices: any[], live: any[], liveInitialized: boolean) {
    return devices.map((dev) => {
      const liveData = live.find((l) => Number(l.device_id) === Number(dev.id));
  
      return {
        ...dev,
        online: liveInitialized ? !!liveData : false,
        is_on: liveInitialized ? liveData?.is_on ?? false : false,
        waitingForState: !liveInitialized,
      };
    });
  }
  