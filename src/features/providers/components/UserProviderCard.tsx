import {
  Paper,
  Stack,
  Typography,
  Switch,
  Divider,
  Box,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ProviderResponse } from "../types/userProvider";
import ProviderConfig from "./provider-config/ProviderConfig";

type ProviderLiveState = {
  power: number | null;
  timestamp: string | null;
  loading: boolean;
  hasWs: boolean;
};

type Props = {
  provider: ProviderResponse;
  live?: ProviderLiveState;
};

export default function UserProviderCard({ provider, live }: Props) {
  const { t } = useTranslation();

  const hasRange =
    provider.value_min != null &&
    provider.value_max != null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        width: "100%",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* ================= HEADER ================= */}
      <Box display="flex" justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {provider.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {provider.vendor} • {provider.provider_type}
          </Typography>
        </Box>

        <Switch checked={provider.enabled} disabled />
      </Box>

      <Divider />

      {/* ================= META ================= */}
      <Stack direction="row" spacing={3}>
        <MetaItem
          label={t("providers.card.kind")}
          value={provider.kind}
        />

        {provider.unit && (
          <MetaItem
            label={t("providers.card.unit")}
            value={provider.unit}
          />
        )}
      </Stack>

      {/* ================= RANGE ================= */}
      {hasRange && (
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: provider.enabled
              ? "primary.light"
              : "action.hover",
          }}
        >
          <Typography variant="caption">
            {t("providers.card.range")}
          </Typography>

          <Typography variant="h6" fontWeight={700}>
            {provider.value_min} {provider.unit} →{" "}
            {provider.value_max} {provider.unit}
          </Typography>
        </Box>
      )}

      {/* ================= LIVE POWER ================= */}
      <Divider />

      <Box>
        <Typography variant="subtitle2" fontWeight={700}>
          Live inverter data
        </Typography>

        {(!live || live.loading) && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2">
              {t("providers.live.waiting")}
            </Typography>
          </Stack>
        )}

        {!live?.loading && live?.hasWs && (
          <>
            <Typography variant="h6" fontWeight={700}>
              {live.power ?? "-"} {provider.unit}
            </Typography>

            {live.timestamp && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {t("providers.live.updatedAt")}{" "}
                {new Date(live.timestamp).toLocaleString()}
              </Typography>
            )}
          </>
        )}

        {!live?.loading && !live?.hasWs && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {t("providers.live.noData")}
          </Typography>
        )}
      </Box>

      {/* ================= CONFIG (delegated) ================= */}
      {provider.config && (
        <ProviderConfig
          vendor={provider.vendor}
          config={provider.config}
        />
      )}
    </Paper>
  );
}

/* ================= HELPERS ================= */

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}
