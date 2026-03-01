import {
  Paper,
  Stack,
  Typography,
  Switch,
  Divider,
  Box,
  Button,
} from "@mui/material";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ProviderResponse } from "../types/userProvider";
import ProviderConfig from "./provider-config/ProviderConfig";
import LivePowerStatus from "./LivePowerStatus";
import ProviderLastMeasurement from "./ProviderLastMeasurement";
import { ProviderLiveState } from "../hooks/useProvidersLive";
import { useToggleProviderEnabled } from "../hooks/useToggleProviderEnabled";
import LiveEnergyStream from "./LiveEnergyStream";

type Props = {
  provider: ProviderResponse;
  live?: ProviderLiveState;
  onEnabledChange: (uuid: string, enabled: boolean) => void;
  onEdit: (provider: ProviderResponse) => void;
};

export default function UserProviderCard({
  provider,
  live,
  onEnabledChange,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { loading, toggle } = useToggleProviderEnabled(
    provider.uuid,
    (enabled) => {
      onEnabledChange(provider.uuid, enabled);
    }
  );

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

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => onEdit(provider)}
            sx={{ textTransform: "none" }}
          >
            {t("providers.actions.edit")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ShowChartIcon />}
            onClick={() =>
              navigate(`/providers/${provider.uuid}/telemetry`, {
                state: { provider },
              })
            }
            sx={{ textTransform: "none" }}
          >
            {t("providers.actions.telemetry")}
          </Button>
          <Switch
            checked={provider.enabled}
            disabled={loading}
            onChange={(_, checked) => toggle(checked)}
          />
        </Stack>
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

        {provider.power_source && (
          <MetaItem
            label={t("providers.card.powerSource")}
            value={t(`providers.powerSource.${provider.power_source}`)}
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
            ? "success.light"
            : "action.hover",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ElectricBoltIcon color="success" />
          <Typography variant="caption">
            {t("providers.card.range")}
          </Typography>
        </Stack>

        <Typography variant="h6" fontWeight={700}>
          {provider.value_min} {provider.unit} →{" "}
          {provider.value_max} {provider.unit}
        </Typography>
      </Box>
    )}


      {/* ================= LIVE POWER ================= */}
      <Divider />

      <LivePowerStatus provider={provider} live={live} />

      {/* ================= LAST MEASUREMENT ================= */}
      <Box
        mt={1}
        sx={{
          Height: 112,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {live?.hasWs ? (
          <LiveEnergyStream unit={provider.unit ?? null} />
        ) : (
          provider.last_value && (
            <ProviderLastMeasurement
              measurement={provider.last_value}
              expectedIntervalSec={provider.default_expected_interval_sec}
              unit={provider.unit ?? null}
            />
          )
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
