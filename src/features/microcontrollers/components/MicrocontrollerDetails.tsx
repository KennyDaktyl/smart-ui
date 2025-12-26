import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { useMicrocontrollerLive } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

type Props = {
  microcontroller: MicrocontrollerResponse;
  isAdmin?: boolean;
  onDelete?: () => void;
};

export function MicrocontrollerDetails({
  microcontroller,
  isAdmin,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const live = useMicrocontrollerLive(microcontroller.uuid);

  return (
    <Card sx={{ backgroundColor: "#ffffff" }}>
      <CardContent>
        <Stack spacing={2}>
          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={700}>
              {microcontroller.name}
            </Typography>

            <Chip
              size="small"
              label={live.online ? t("common.online") : t("common.offline")}
              color={live.online ? "success" : "error"}
            />
          </Stack>

          <Divider />

          {/* BASIC INFO */}
          <InfoRow
            label={t("microcontroller.uuid")}
            value={microcontroller.uuid}
          />

          <InfoRow
            label={t("microcontroller.type")}
            value={t(`microcontroller.types.${microcontroller.type}`)}
          />

          <InfoRow
            label={t("microcontroller.software")}
            value={microcontroller.software_version ?? "-"}
          />

          <InfoRow
            label={t("microcontroller.maxDevices")}
            value={String(microcontroller.max_devices)}
          />

          <Divider />

          {/* DESCRIPTION */}
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {t("microcontroller.description")}
            </Typography>
            <Typography variant="body2">
              {microcontroller.description || "-"}
            </Typography>
          </Stack>

          <Divider />

          {/* USER – READ ONLY */}
          <InfoRow
            label={t("microcontroller.owner")}
            value={
              microcontroller.user
                ? `${microcontroller.user.email} (${microcontroller.user.role})`
                : t("microcontroller.noUserAssigned")
            }
          />

          <Divider />

          {/* SENSORS – READ ONLY */}
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {t("microcontroller.sensorsLabel")}
            </Typography>

            {microcontroller.assigned_sensors.length > 0 ? (
              <Typography variant="body2">
                {microcontroller.assigned_sensors
                  .map((s) => t(`microcontroller.sensorOptions.${s}`))
                  .join(", ")}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("common.none")}
              </Typography>
            )}
          </Stack>

          <Divider />

          {/* STATUS */}
          <InfoRow
            label={t("common.status")}
            value={
              microcontroller.enabled
                ? t("common.enabled")
                : t("common.disabled")
            }
          />

          {/* ADMIN ACTIONS */}
          {isAdmin && onDelete && (
            <>
              <Divider />
              <Box display="flex" justifyContent="flex-end">
                <Button color="error" onClick={onDelete}>
                  {t("common.delete")}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" fontWeight={600}>
        {label}:
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
