import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { useMicrocontrollerLive } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import { ActionButton } from "@/components/ActionButton";

type Props = {
  microcontroller: MicrocontrollerResponse;
  isAdmin?: boolean;
  onDelete?: () => Promise<void>;
};

export function MicrocontrollerDetails({
  microcontroller,
  isAdmin,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const live = useMicrocontrollerLive(microcontroller.uuid);

  /**
   * Handles delete flow:
   * - execute delete
   * - show toast
   * - redirect to list
   */
  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      await onDelete();

      enqueueSnackbar(
        t("microcontroller.deleteSuccess"),
        { variant: "success" }
      );

      navigate("/admin/microcontrollers");
    } catch (error) {
      enqueueSnackbar(
        t("microcontroller.deleteError"),
        { variant: "error" }
      );
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* HEADER */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" fontWeight={700}>
              {microcontroller.name}
            </Typography>

            {live.status === "pending" && (
              <CircularProgress size={18} />
            )}

            {live.status === "online" && (
              <Chip
                size="small"
                label={t("common.online")}
                color="success"
              />
            )}

            {live.status === "offline" && (
              <Chip
                size="small"
                label={t("common.offline")}
                color="error"
                variant="outlined"
              />
            )}
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

          {/* USER */}
          <InfoRow
            label={t("microcontroller.owner")}
            value={
              microcontroller.user
                ? `${microcontroller.user.email} (${microcontroller.user.role})`
                : t("microcontroller.noUserAssigned")
            }
          />

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
                <ActionButton
                  label={t("common.delete")}
                  color="error"
                  variant="text"
                  confirmRequired
                  confirmTitle={t("common.confirmDelete")}
                  confirmMessage={t("microcontroller.confirmDelete")}
                  onConfirm={handleDelete}
                />
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
