import {
  Alert,
  Box,
  Button,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

type Props = {
  microcontroller: MicrocontrollerResponse;
  disabled?: boolean;
};

const EMPTY_JSON = "{}";

export function MicrocontrollerConfigurationTab({
  microcontroller,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const [configJsonText, setConfigJsonText] = useState(EMPTY_JSON);
  const [hardwareConfigJsonText, setHardwareConfigJsonText] = useState(EMPTY_JSON);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgentFiles = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getMicrocontrollerAgentConfigFiles(
        microcontroller.id
      );

      setConfigJsonText(JSON.stringify(response.data.config_json ?? {}, null, 2));
      setHardwareConfigJsonText(
        JSON.stringify(response.data.hardware_config_json ?? {}, null, 2)
      );
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      notifyError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [disabled, microcontroller.id, notifyError]);

  useEffect(() => {
    void loadAgentFiles();
  }, [loadAgentFiles]);

  const parseJson = (
    raw: string,
    fileTranslationKey: "microcontroller.agentConfig.configFile" | "microcontroller.agentConfig.hardwareConfigFile"
  ) => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid object");
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(
        t("microcontroller.agentConfig.invalidJson", {
          file: t(fileTranslationKey),
        })
      );
    }
  };

  const handleSave = async () => {
    if (disabled) return;

    try {
      setSaving(true);
      setError(null);

      const configJson = parseJson(
        configJsonText,
        "microcontroller.agentConfig.configFile"
      );
      const hardwareConfigJson = parseJson(
        hardwareConfigJsonText,
        "microcontroller.agentConfig.hardwareConfigFile"
      );

      await adminApi.updateMicrocontrollerAgentConfigFiles(microcontroller.id, {
        config_json: configJson,
        hardware_config_json: hardwareConfigJson,
      });

      notifySuccess(t("microcontroller.agentConfig.saveSuccess"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : parseApiError(err).message;
      setError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CardContent>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {t("microcontroller.agentConfig.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("microcontroller.agentConfig.description")}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label={t("microcontroller.agentConfig.configFile")}
          multiline
          minRows={10}
          value={configJsonText}
          onChange={(event) => setConfigJsonText(event.target.value)}
          fullWidth
          disabled={disabled || loading || saving}
          sx={{
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
            },
          }}
        />

        <TextField
          label={t("microcontroller.agentConfig.hardwareConfigFile")}
          multiline
          minRows={10}
          value={hardwareConfigJsonText}
          onChange={(event) => setHardwareConfigJsonText(event.target.value)}
          fullWidth
          disabled={disabled || loading || saving}
          sx={{
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
            },
          }}
        />

        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button
            variant="outlined"
            onClick={loadAgentFiles}
            disabled={disabled || loading || saving}
          >
            {t("microcontroller.agentConfig.load")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={disabled || loading || saving}
          >
            {t("microcontroller.agentConfig.save")}
          </Button>
        </Box>
      </Stack>
    </CardContent>
  );
}
