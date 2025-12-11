import { useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import AuthPageLayout from "@/front/AuthPageLayout";
import { authApi } from "@/api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Podaj adres e-mail.");
      return;
    }
    try {
      setLoading(true);
      await authApi.requestPasswordReset(email);
      setSuccess("Jeśli konto istnieje, wysłaliśmy instrukcje zmiany hasła.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Nie udało się wysłać wiadomości.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Przypomnij hasło"
      subtitle="Wyślij link do resetu hasła na swój e-mail."
    >
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label="Email"
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
          {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
