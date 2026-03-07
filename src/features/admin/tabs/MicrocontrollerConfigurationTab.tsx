import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import JSONEditor, { JSONEditorOptions } from "jsoneditor";
import { useTranslation } from "react-i18next";
import "jsoneditor/dist/jsoneditor.css";

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
  const [hardwareConfigJson, setHardwareConfigJson] = useState<JsonObject>(EMPTY_JSON);
  const [envFileText, setEnvFileText] = useState("");
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

      setConfigJson(toJsonObject(response.data.config_json));
      setHardwareConfigJson(toJsonObject(response.data.hardware_config_json));
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

  const parseJsonObject = (
    value: unknown,
    fileTranslationKey: "microcontroller.agentConfig.configFile" | "microcontroller.agentConfig.hardwareConfigFile"
  ) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(
        t("microcontroller.agentConfig.invalidJson", {
          file: t(fileTranslationKey),
        })
      );
    }

    return value as JsonObject;
  };

  const handleSave = async () => {
    if (disabled) return;

    try {
      setSaving(true);
      setError(null);

      const parsedConfigJson = parseJsonObject(
        configJson,
        "microcontroller.agentConfig.configFile"
      );
      const parsedHardwareConfigJson = parseJsonObject(
        hardwareConfigJson,
        "microcontroller.agentConfig.hardwareConfigFile"
      );

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

        <JsonObjectEditor
          label={t("microcontroller.agentConfig.configFile")}
          value={configJson}
          onChange={setConfigJson}
          disabled={disabled || loading || saving}
        />

        <JsonObjectEditor
          label={t("microcontroller.agentConfig.hardwareConfigFile")}
          value={hardwareConfigJson}
          onChange={setHardwareConfigJson}
          disabled={disabled || loading || saving}
        />

        <TextField
          label={t("microcontroller.agentConfig.envFile")}
          multiline
          minRows={10}
          value={envFileText}
          onChange={(event) => setEnvFileText(event.target.value)}
          fullWidth
          disabled={disabled || loading || saving}
          sx={{
            "& .MuiInputBase-input": {
              fontFamily: "monospace",
            },
          }}
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
            disabled={disabled || loading || saving}
            fullWidth
          >
            {t("microcontroller.agentConfig.save")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

function JsonObjectEditor({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: JsonObject;
  onChange: (next: JsonObject) => void;
  disabled: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<JSONEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const options: JSONEditorOptions = {
      mode: "tree",
      modes: ["tree", "code"],
      onChangeJSON: (json) => {
        onChange(toJsonObject(json));
      },
      onEditable: () => !disabled,
      mainMenuBar: false,
      navigationBar: false,
      statusBar: false,
    };

    editorRef.current = new JSONEditor(containerRef.current, options, value);

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [disabled, onChange]);

  useEffect(() => {
    if (!editorRef.current) return;

    try {
      editorRef.current.update(value);
    } catch {
      editorRef.current.set(value);
    }
  }, [value]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "hidden",
          "& .jsoneditor": {
            border: 0,
            minHeight: 0,
          },
          "& .jsoneditor-outer": {
            minHeight: 0,
          },
        }}
      >
        <Box ref={containerRef} />
      </Box>
    </Box>
  );
}

function toJsonObject(input: unknown): JsonObject {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as JsonObject;
}
