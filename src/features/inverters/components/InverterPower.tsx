import { Box } from "@mui/material";
import { useInverterPower } from "../hooks/useInverterPower";

import { PowerErrorAlert } from "./atoms/PowerErrorAlert";
import { PowerLoadingAlert } from "./atoms/PowerLoadingAlert";
import { PowerStaleAlert } from "./atoms/PowerStaleAlert";
import { PowerWaitingAlert } from "./atoms/PowerWaitingAlert";
import { PowerSuccessAlert } from "./atoms/PowerSuccessAlert";

interface Props {
  inverterId: number;
  serial: string;
}

export function InverterPower({ inverterId, serial }: Props) {
  const {
    power,
    timestamp,
    error,
    hasWs,
    stale,
    countdown,
    loadingInitial,
  } = useInverterPower({ inverterId, serial });

  const formattedTimestamp =
    timestamp &&
    new Date(timestamp).toLocaleString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <Box mt={2}>
      {error && <PowerErrorAlert message={error} />}

      {loadingInitial && <PowerLoadingAlert />}

      {stale && <PowerStaleAlert timestamp={formattedTimestamp} />}

      {!loadingInitial && !hasWs && power == null && (
        <PowerWaitingAlert countdown={countdown} />
      )}

      {!error && !loadingInitial && !stale && (hasWs || power != null) && (
        <PowerSuccessAlert
          power={power ?? 0}
          timestamp={formattedTimestamp}
          countdown={countdown}
        />
      )}
    </Box>
  );
}
