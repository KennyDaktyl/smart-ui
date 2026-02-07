import { Box, Typography, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { useProviders } from "@/features/providers/hooks/useProviders";
import ProvidersEmptyState from "@/features/providers/components/ProvidersEmptyState";
import AddProviderWizardDialog from "@/features/providers/components/AddProviderWizardDialog";
import { useToast } from "@/context/ToastContext";
import ProvidersList from "../../features/providers/components/ProvidersList";
import { ProviderResponse } from "@/features/providers/types/userProvider";

export default function ProvidersPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useProviders();
  const [providers, setProviders] = useState<ProviderResponse[]>([]);

  const { notifyError } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    setProviders((prev) => {
      return data.map((p) => {
        const local = prev.find((x) => x.uuid === p.uuid);
        return local ? { ...p, enabled: local.enabled } : p;
      });
    });
  }, [data]);

  const handleProviderEnabledChange = useCallback(
    (uuid: string, enabled: boolean) => {
      setProviders((prev) =>
        prev.map((p) =>
          p.uuid === uuid ? { ...p, enabled } : p
        )
      );
    },
    []
  );

  useEffect(() => {
    if (error) {
      notifyError(
        t("providers.errors.loadDetail", {
          message: error.message,
        })
      );
    }
  }, [error, notifyError, t]);

  const handleWizardClose = useCallback(
    (shouldReload?: boolean) => {
      setWizardOpen(false);
      if (shouldReload) {
        reload();
      }
    },
    [reload]
  );

  if (loading) {
    return <CenteredSpinner />;
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={3}
      >
        <Typography variant="h4">
          {t("providers.title")}
        </Typography>
  
        {providers.length > 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setWizardOpen(true)}
            fullWidth
            sx={{
              width: { xs: "100%", sm: "auto" },
              alignSelf: { xs: "stretch", sm: "auto" },
            }}
          >
            {t("providers.actions.add")}
          </Button>
        )}
      </Stack>
  
      {providers.length === 0 ? (
        <ProvidersEmptyState onAdd={() => setWizardOpen(true)} />
      ) : (
        <ProvidersList
          providers={providers}
          onProviderEnabledChange={handleProviderEnabledChange}
        />
      )}
  
      <AddProviderWizardDialog
        open={wizardOpen}
        onClose={handleWizardClose}
      />
    </Box>
  );
}
