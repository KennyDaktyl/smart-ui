import { Box, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ProviderMeasurement } from "../types/userProvider";

type Props = {
  measurement: ProviderMeasurement;
  expectedIntervalSec?: number | null;
  unit?: string | null;
};

export default function ProviderLastMeasurement({
  measurement,
  expectedIntervalSec,
  unit,
}: Props) {
  const { t } = useTranslation();
  const measuredAt = new Date(measurement.measured_at);
  const elapsedMs = Date.now() - measuredAt.getTime();
  const thresholdMs =
    expectedIntervalSec != null
      ? Math.max(0, expectedIntervalSec * 1000)
      : undefined;
  const isFresh =
    thresholdMs == null ? true : elapsedMs <= thresholdMs;

  const valueParts = [
    measurement.measured_value.toString(),
    measurement.measured_unit ?? unit,
  ].filter(Boolean);

  const valueLabel = valueParts.join(" ");
  const formattedTime = Number.isNaN(measuredAt.getTime())
    ? t("providers.card.unknownTime")
    : measuredAt.toLocaleString();

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={500} gutterBottom>
        {t("providers.card.lastValue")}
      </Typography>

      <Typography variant="h5" fontWeight={700}>
        {valueLabel}
      </Typography>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mt={0.5}
        flexWrap="wrap"
      >
        <Chip
          label={
            isFresh
              ? t("providers.card.measurementFresh")
              : t("providers.card.measurementStale")
          }
          size="small"
          color={isFresh ? "success" : "warning"}
          variant={isFresh ? "filled" : "outlined"}
        />

        <Typography variant="caption" color="text.secondary">
          {t("providers.card.lastMeasurement")} {formattedTime}
        </Typography>
      </Stack>
    </Box>
  );
}
