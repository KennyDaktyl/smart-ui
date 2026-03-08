import {
  Alert,
  Box,
  Button,
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

type JsonObject = Record<string, unknown>;
const EMPTY_JSON: JsonObject = {};

export function MicrocontrollerConfigurationTab({
  microcontroller,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const [configJson, setConfigJson] = useState<JsonObject>(EMPTY_JSON);
  const [configJsonText, setConfigJsonText] = useState("{}");
  const [configJsonError, setConfigJsonError] = useState<string | null>(null);

  const [hardwareConfigJson, setHardwareConfigJson] = useState<JsonObject>(EMPTY_JSON);
  const [hardwareConfigJsonText, setHardwareConfigJsonText] = useState("{}");
  const [hardwareConfigJsonError, setHardwareConfigJsonError] = useState<string | null>(null);

  const [envFileText, setEnvFileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyJsonText = useCallback((
    rawText: string,
    fileTranslationKey:
      | "microcontroller.agentConfig.configFile"
      | "microcontroller.agentConfig.hardwareConfigFile",
    setJson: (next: JsonObject) => void,
    setText: (next: string) => void,
    setJsonError: (next: string | null) => void,
    format = false
  ) => {
    setText(rawText);

    try {
      const parsed = parseJsonTextToObject(rawText, t(fileTranslationKey));
      setJson(parsed);
      setJsonError(null);

      if (format) {
        setText(JSON.stringify(parsed, null, 2));
      }

      return parsed;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("microcontroller.agentConfig.invalidJson", {
          file: t(fileTranslationKey),
        });
      setJsonError(message);
      return null;
    }
  }, [t]);

  const loadAgentFiles = useCallback(async () => {
    if (disabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await adminApi.getMicrocontrollerAgentConfigFiles(
        microcontroller.id
      );

      const nextConfigJson = toJsonObject(response.data.config_json);
      const nextHardwareConfigJson = toJsonObject(response.data.hardware_config_json);

      setConfigJson(nextConfigJson);
      setConfigJsonText(JSON.stringify(nextConfigJson, null, 2));
      setConfigJsonError(null);

      setHardwareConfigJson(nextHardwareConfigJson);
      setHardwareConfigJsonText(JSON.stringify(nextHardwareConfigJson, null, 2));
      setHardwareConfigJsonError(null);

      setEnvFileText(response.data.env_file_content ?? "");
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

  const handleSave = async () => {
    if (disabled) return;

    try {
      setSaving(true);
      setError(null);

      const parsedConfigJson = applyJsonText(
        configJsonText,
        "microcontroller.agentConfig.configFile",
        setConfigJson,
        setConfigJsonText,
        setConfigJsonError,
        true
      );

      const parsedHardwareConfigJson = applyJsonText(
        hardwareConfigJsonText,
        "microcontroller.agentConfig.hardwareConfigFile",
        setHardwareConfigJson,
        setHardwareConfigJsonText,
        setHardwareConfigJsonError,
        true
      );

      if (!parsedConfigJson || !parsedHardwareConfigJson) {
        throw new Error("Popraw błędy w plikach JSON przed zapisem.");
      }

      await adminApi.updateMicrocontrollerAgentConfigFiles(microcontroller.id, {
        config_json: parsedConfigJson,
        hardware_config_json: parsedHardwareConfigJson,
        env_file_content: envFileText,
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
    <Box sx={{ p: 0 }}>
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

        <JsonTextEditor
          label={t("microcontroller.agentConfig.configFile")}
          value={configJsonText}
          error={configJsonError}
          disabled={disabled || loading || saving}
          onChange={(nextText) =>
            applyJsonText(
              nextText,
              "microcontroller.agentConfig.configFile",
              setConfigJson,
              setConfigJsonText,
              setConfigJsonError
            )
          }
          onFormat={() =>
            applyJsonText(
              configJsonText,
              "microcontroller.agentConfig.configFile",
              setConfigJson,
              setConfigJsonText,
              setConfigJsonError,
              true
            )
          }
        />

        <JsonTextEditor
          label={t("microcontroller.agentConfig.hardwareConfigFile")}
          value={hardwareConfigJsonText}
          error={hardwareConfigJsonError}
          disabled={disabled || loading || saving}
          onChange={(nextText) =>
            applyJsonText(
              nextText,
              "microcontroller.agentConfig.hardwareConfigFile",
              setHardwareConfigJson,
              setHardwareConfigJsonText,
              setHardwareConfigJsonError
            )
          }
          onFormat={() =>
            applyJsonText(
              hardwareConfigJsonText,
              "microcontroller.agentConfig.hardwareConfigFile",
              setHardwareConfigJson,
              setHardwareConfigJsonText,
              setHardwareConfigJsonError,
              true
            )
          }
        />

        <TextField
          label={t("microcontroller.agentConfig.envFile")}
          multiline
          minRows={10}
          value={envFileText}
          onChange={(event) => setEnvFileText(event.target.value)}
          fullWidth
          disabled={disabled || loading || saving}
          sx={editorFieldSx}
        />

        <Box
          display="flex"
          justifyContent="flex-end"
          gap={1}
          flexDirection={{ xs: "column", sm: "row" }}
        >
          <Button
            variant="outlined"
            onClick={loadAgentFiles}
            disabled={disabled || loading || saving}
            fullWidth
          >
            {t("microcontroller.agentConfig.load")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              disabled ||
              loading ||
              saving ||
              Boolean(configJsonError) ||
              Boolean(hardwareConfigJsonError)
            }
            fullWidth
          >
            {t("microcontroller.agentConfig.save")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

function JsonTextEditor({
  label,
  value,
  error,
  disabled,
  onChange,
  onFormat,
}: {
  label: string;
  value: string;
  error: string | null;
  disabled: boolean;
  onChange: (next: string) => void;
  onFormat: () => void;
}) {
  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2">{label}</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={onFormat}
          disabled={disabled}
        >
          Formatuj JSON
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Edytujesz zwykły tekst JSON. Nowe klucze dodajesz ręcznie, a usuwać możesz
        dowolne pola jak w normalnym pliku.
      </Typography>

      <TextField
        multiline
        minRows={14}
        maxRows={28}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        fullWidth
        disabled={disabled}
        error={Boolean(error)}
        helperText={error ?? " "}
        sx={editorFieldSx}
      />
    </Box>
  );
}

function parseJsonTextToObject(text: string, fileLabel: string): JsonObject {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const details = err instanceof Error ? err.message : "Nieprawidłowa składnia JSON.";
    throw new Error(`${fileLabel}: ${details}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${fileLabel}: JSON musi być obiektem na poziomie root.`);
  }

  return parsed as JsonObject;
}

function toJsonObject(input: unknown): JsonObject {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as JsonObject;
}

const editorFieldSx = {
  "& .MuiInputBase-root": {
    alignItems: "flex-start",
    backgroundColor: "#fff",
  },
  "& .MuiInputBase-input": {
    fontFamily: '"JetBrains Mono", "Consolas", monospace',
    fontSize: 13,
    lineHeight: 1.6,
  },
};
