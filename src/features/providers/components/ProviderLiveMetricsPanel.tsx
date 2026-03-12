import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import {
  formatProviderMetricValue,
  resolveProviderDisplayMetrics,
} from "@/features/providers/utils/providerLiveMetrics";

type ProviderLiveMetricsPanelProps = {
  provider: ProviderResponse;
  live?: ProviderLiveState;
  compact?: boolean;
  title?: string;
  emptyLabel?: string;
  metrics?: ReturnType<typeof resolveProviderDisplayMetrics>;
};

export function ProviderLiveMetricsPanel({
  provider,
  live,
  compact = false,
  title,
  emptyLabel,
  metrics: metricsOverride,
}: ProviderLiveMetricsPanelProps) {
  const { t } = useTranslation();

  const metrics =
    metricsOverride ??
    resolveProviderDisplayMetrics({
      provider,
      liveMetrics: live?.metrics,
      power: live?.power,
      unit: live?.unit ?? provider.unit ?? null,
      t: (key, options) => String(t(key, options)),
    });

  return (
    <Stack spacing={compact ? 0.75 : 1}>
      {title ? (
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
      ) : null}

      {metrics.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyLabel ?? t("providers.live.noMetrics")}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: compact ? 0.75 : 1,
            gridTemplateColumns: compact
              ? {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                }
              : {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
          }}
        >
          {metrics.map((metric) => (
            <Stack
              key={metric.key}
              spacing={0.25}
              sx={{
                minWidth: 0,
                p: compact ? 0.9 : 1.1,
                borderRadius: compact ? 1.5 : 2,
                border: (theme) =>
                  `1px solid ${
                    metric.isPrimary
                      ? alpha(theme.palette.primary.main, 0.24)
                      : alpha(theme.palette.success.main, 0.12)
                  }`,
                backgroundColor: (theme) =>
                  metric.isPrimary
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.common.white, 0.82),
                boxShadow: (theme) =>
                  `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.65)}`,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  lineHeight: 1.2,
                  display: "-webkit-box",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: compact ? 2 : 1,
                }}
              >
                {metric.label}
              </Typography>
              <Typography
                variant={compact ? "body2" : "subtitle1"}
                fontWeight={metric.isPrimary ? 700 : 600}
                color={metric.isPrimary ? "primary.main" : "text.primary"}
                sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {formatProviderMetricValue(metric.value, metric.unit)}
              </Typography>
            </Stack>
          ))}
        </Box>
      )}
    </Stack>
  );
}
