import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslation } from "react-i18next";
import { ProviderResponse } from "../types/userProvider";
import { ProviderLiveState } from "../hooks/useProvidersLive";
import LivePowerEmpty from "./LivePowerEmpty";

type Props = {
  provider: ProviderResponse;
  live?: ProviderLiveState;
};

type ViewState = "loading" | "live" | "stale" | "empty";

export default function LivePowerStatus({
  provider,
  live,
}: Props) {
  const { t } = useTranslation();

  const viewState: ViewState = (() => {
    if (!live) return "empty";
    if (live.loading) return "loading";
    if (live.isStale) return "stale";
    if (live.hasWs) return "live";
    return "empty";
  })();

  const power = live?.power ?? 0;
  const isProducing = power > 0;

  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        mb={0.5}
      >
        {t("providers.live.title")}
      </Typography>

      {/* ================= LOADING ================= */}
      {viewState === "loading" && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2">
            {t("providers.live.waiting")}
          </Typography>

          {live?.countdownSec != null && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {live.countdownSec}s
            </Typography>
          )}
        </Stack>
      )}

      {/* ================= LIVE ================= */}
      {viewState === "live" && (
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            {isProducing ? (
              <EnergySavingsLeafIcon color="success" />
            ) : (
              <BoltIcon color="action" />
            )}

            <Typography
              variant="h5"
              fontWeight={800}
              color={
                isProducing
                  ? "success.main"
                  : "text.primary"
              }
            >
              {power}
              {provider.unit
                ? ` ${provider.unit}`
                : ""}
            </Typography>

            <Chip
              size="small"
              label="LIVE"
              color="success"
              variant="outlined"
            />
          </Stack>

          {live?.timestamp && (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
            >
              <AccessTimeIcon
                fontSize="inherit"
                color="disabled"
              />
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {t("providers.live.updatedAt")}{" "}
                {new Date(
                  live.timestamp
                ).toLocaleTimeString()}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}

      {/* ================= STALE ================= */}
      {viewState === "stale" && (
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon color="warning" />
          <Typography
            variant="body2"
            color="warning.main"
          >
            {t("providers.data_not_fresh")}
          </Typography>
        </Stack>
      )}

      {/* ================= EMPTY ================= */}
      {viewState === "empty" && (
        <LivePowerEmpty />
      )}
    </Box>
  );
}
