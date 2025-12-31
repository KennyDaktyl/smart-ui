import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { useProviders } from "@/features/providers/hooks/useProviders";
import ProvidersList from "@/features/providers/components/ProvidersList";
import ProvidersEmptyState from "@/features/providers/components/ProvidersEmptyState";
import AddProviderWizardDialog from "@/features/providers/components/AddProviderWizardDialog";
import { useToast } from "@/context/ToastContext";

export default function ProvidersPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useProviders();
  const { notifyError } = useToast();

  const [wizardOpen, setWizardOpen] = useState(false);

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
    <Box p={3}>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">
          {t("providers.title")}
        </Typography>

        {data.length > 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setWizardOpen(true)}
          >
            {t("providers.actions.add")}
          </Button>
        )}
      </Box>

      {/* CONTENT */}
      {data.length === 0 ? (
        <ProvidersEmptyState
          onAdd={() => setWizardOpen(true)}
        />
      ) : (
        <ProvidersList providers={data} />
      )}

      {/* ADD PROVIDER */}
      <AddProviderWizardDialog
        open={wizardOpen}
        onClose={handleWizardClose}
      />
    </Box>
  );
}
