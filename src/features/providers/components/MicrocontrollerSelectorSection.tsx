import { Alert, Box, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Microcontroller } from "@/features/microcontrollers/components/types";

type MicrocontrollerSelectorSectionProps = {
  microcontrollers: Microcontroller[];
  loading: boolean;
  error: string | null;
  selectedMicrocontrollerUuid: string;
  onSelect: (uuid: string) => void;
};

export default function MicrocontrollerSelectorSection({
  microcontrollers,
  loading,
  error,
  selectedMicrocontrollerUuid,
  onSelect,
}: MicrocontrollerSelectorSectionProps) {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid rgba(13,27,42,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">{t("providers.selectMicrocontroller")}</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : microcontrollers.length === 0 ? (
            <Typography sx={{ color: "rgba(13,27,42,0.7)" }}>
              {t("providers.microcontrollersEmpty")}
            </Typography>
          ) : (
            <FormControl fullWidth>
              <InputLabel>{t("providers.microcontrollerLabel")}</InputLabel>
              <Select
                label={t("providers.microcontrollerLabel")}
                value={selectedMicrocontrollerUuid}
                onChange={(event) => onSelect(event.target.value)}
              >
                {microcontrollers.map((item) => (
                  <MenuItem key={item.uuid} value={item.uuid}>
                    {item.name ? `${item.name} (${item.uuid})` : item.uuid}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
