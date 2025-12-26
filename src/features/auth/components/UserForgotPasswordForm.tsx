import { useState } from "react";
import { Alert, AlertColor, Button, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import Toast from "@/components/Toast";

export default function UserForgotPasswordForm() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    severity: AlertColor;
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError(t("auth.forgot.emptyEmail"));
      setToastOpen(true);
      return;
    }

    try {
      setLoading(true);
      await authApi.requestPasswordReset(email);
      const successMessage = t("auth.forgot.success");
      setSuccess(successMessage);
      setToast({ open: true, severity: "success", message: successMessage });
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        t("auth.forgot.error");

      setError(message);
      setToast({ open: true, severity: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label={t("auth.fields.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoComplete="email"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ borderRadius: 10, py: 1.1 }}
        >
          {loading
            ? t("common.waitingForStatus")
            : t("auth.forgot.submit")}
        </Button>
      </Stack>

      {/* Toast */}
      <Toast
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
