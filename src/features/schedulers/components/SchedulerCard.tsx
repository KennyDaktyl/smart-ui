import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { SCHEDULER_DAY_ORDER } from "@/features/schedulers/constants";
import type { Scheduler } from "@/features/schedulers/types/scheduler";

type Props = {
  scheduler: Scheduler;
  onEdit: (scheduler: Scheduler) => void;
  onDelete: (scheduler: Scheduler) => void;
};

export function SchedulerCard({ scheduler, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  const toMinutes = (value: string): number => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const orderedSlots = [...(scheduler.slots ?? [])].sort(
    (a, b) =>
      SCHEDULER_DAY_ORDER.indexOf(a.day_of_week) -
        SCHEDULER_DAY_ORDER.indexOf(b.day_of_week) ||
      toMinutes(
        a.start_local_time ?? a.start_time ?? a.start_utc_time ?? "00:00",
      ) -
        toMinutes(
          b.start_local_time ?? b.start_time ?? b.start_utc_time ?? "00:00",
        ),
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">{scheduler.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t("schedulers.card.blocksCount", {
                count: orderedSlots.length,
              })}
            </Typography>
          </Box>

          <Stack spacing={1}>
            {orderedSlots.map((slot, index) => (
              <Stack
                key={`${slot.day_of_week}-${
                  slot.start_local_time ?? slot.start_time ?? slot.start_utc_time ?? ""
                }-${slot.end_local_time ?? slot.end_time ?? slot.end_utc_time ?? ""}-${index}`}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
              >
                <Chip
                  size="small"
                  label={t(`schedulers.days.${slot.day_of_week}`)}
                  variant="outlined"
                />
                <Box
                  textAlign={{ xs: "left", sm: "right" }}
                  width={{ xs: "100%", sm: "auto" }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {`${slot.start_local_time ?? slot.start_time ?? "--:--"} - ${
                      slot.end_local_time ?? slot.end_time ?? "--:--"
                    }`}
                  </Typography>
                  {slot.use_power_threshold &&
                    slot.power_threshold_value != null &&
                    slot.power_threshold_unit && (
                      <Typography variant="caption" color="text.secondary">
                        {t("schedulers.card.slotPowerCondition", {
                          value: slot.power_threshold_value,
                          unit: slot.power_threshold_unit,
                        })}
                      </Typography>
                    )}
                </Box>
              </Stack>
            ))}
          </Stack>

          <Box
            display="flex"
            justifyContent="flex-end"
            gap={1}
            flexDirection={{ xs: "column", sm: "row" }}
          >
            <Button size="small" variant="outlined" onClick={() => onEdit(scheduler)}>
              {t("common.edit")}
            </Button>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => onDelete(scheduler)}
            >
              {t("common.delete")}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
