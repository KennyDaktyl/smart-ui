import {
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type {
  UpdateMicrocontrollerConfigPayload,
} from "@/features/microcontrollers/types/microcontrollerPayload";
import { useUpdateMicrocontrollerConfig } from "../hooks/useUpdateMicrocontrollerConfig";

function sanitizeConfig(input: any): UpdateMicrocontrollerConfigPayload {
  const {
    uuid,
    device_max,
    active_low,
    devices_config,
    provider,
  } = input ?? {};

  return {
    uuid,
    device_max,
    active_low,
    devices_config,
    provider,
  };
}

type Props = {
  microcontroller: MicrocontrollerResponse;
};

export function MicrocontrollerConfigurationTab({
  microcontroller,
}: Props) {
  const { t } = useTranslation();
  const [json, setJson] = useState("{}");

  const { save, loading } =
    useUpdateMicrocontrollerConfig(microcontroller.id);

  useEffect(() => {
    setJson(
      JSON.stringify(
        {
          uuid: microcontroller.uuid,
          ...(microcontroller.config ?? {}),
        },
        null,
        2
      )
    );
  }, [microcontroller]);

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(json);
      const payload = sanitizeConfig(parsed);

      await save(payload);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw error;
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        p: { xs: 2, md: 3 },
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {t("microcontroller.configuration")}
      </Typography>

      <TextField
        label={t("microcontroller.configurationJson")}
        multiline
        minRows={12}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        fullWidth
        sx={{ fontFamily: "monospace" }}
      />

      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {t("common.save")}
        </Button>
      </Box>
    </Box>
  );
}
