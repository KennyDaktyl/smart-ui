import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { parseApiError } from "@/api/parseApiError";
import { schedulersApi } from "@/api/schedulersApi";
import { useToast } from "@/context/ToastContext";
import type {
  Scheduler,
  SchedulerPayload,
} from "@/features/schedulers/types/scheduler";
import { SchedulerCard } from "@/features/schedulers/components/SchedulerCard";
import { SchedulerForm } from "@/features/schedulers/components/SchedulerForm";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

export default function SchedulersPage() {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheduler, setEditingScheduler] = useState<Scheduler | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadSchedulers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await schedulersApi.list();
      setSchedulers(response.data);
    } catch (error) {
      const message = parseApiError(error).message || t("errors.api.generic");
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, [notifyError, t]);

  useEffect(() => {
    void loadSchedulers();
  }, [loadSchedulers]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingScheduler(null);
    setSubmitError(null);
  };

  const handleCreate = () => {
    setEditingScheduler(null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleEdit = (scheduler: Scheduler) => {
    setEditingScheduler(scheduler);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleDelete = async (scheduler: Scheduler) => {
    const confirmed = window.confirm(
      t("schedulers.deleteConfirm", { name: scheduler.name }),
    );
    if (!confirmed) return;

    try {
      await schedulersApi.remove(scheduler.id);
      setSchedulers((prev) => prev.filter((entry) => entry.id !== scheduler.id));
      notifySuccess(t("schedulers.deleteSuccess"));
    } catch (error) {
      notifyError(parseApiError(error).message || t("errors.api.generic"));
    }
  };

  const handleSubmit = async (payload: SchedulerPayload) => {
    setSaving(true);
    setSubmitError(null);
    try {
      if (editingScheduler) {
        const response = await schedulersApi.update(editingScheduler.id, payload);
        setSchedulers((prev) =>
          prev.map((entry) =>
            entry.id === editingScheduler.id ? response.data : entry,
          ),
        );
        notifySuccess(t("schedulers.updateSuccess"));
      } else {
        const response = await schedulersApi.create(payload);
        setSchedulers((prev) => [response.data, ...prev]);
        notifySuccess(t("schedulers.createSuccess"));
      }
      closeDialog();
    } catch (error) {
      const message = parseApiError(error).message || t("errors.api.generic");
      setSubmitError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

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
        <Box>
          <Typography variant="h4">{t("schedulers.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("schedulers.subtitle")}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          fullWidth
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {t("schedulers.actions.add")}
        </Button>
      </Stack>

      {schedulers.length === 0 ? (
        <Box
          sx={{
            p: 3,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" fontWeight={600} mb={1}>
            {t("schedulers.empty.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("schedulers.empty.description")}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {schedulers.map((scheduler) => (
            <SchedulerCard
              key={scheduler.id}
              scheduler={scheduler}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </Box>
      )}

      <StickyDialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="md"
        title={
          editingScheduler
            ? t("schedulers.form.editTitle")
            : t("schedulers.form.createTitle")
        }
        actions={
          <>
            <Button variant="outlined" onClick={closeDialog} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="scheduler-form" variant="contained" disabled={saving}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <SchedulerForm
          key={editingScheduler?.id ?? "create"}
          scheduler={editingScheduler}
          loading={saving}
          submitError={submitError}
          formId="scheduler-form"
          hideActions
          onSubmit={handleSubmit}
          onCancel={closeDialog}
        />
      </StickyDialog>
    </Box>
  );
}
