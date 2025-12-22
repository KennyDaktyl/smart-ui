import { useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import AuthPageLayout from "@/front/AuthPageLayout";
import { authApi } from "@/api/authApi";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError(t("auth.forgot.emptyEmail"));
      return;
    }
    try {
      setLoading(true);
      await authApi.requestPasswordReset(email);
      setSuccess(t("auth.forgot.success"));
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("auth.forgot.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
    >
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label={t("auth.fields.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ borderRadius: 10, py: 1.1 }}
        >
          {loading ? t("auth.forgot.loading") : t("auth.forgot.submit")}
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
