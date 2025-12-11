import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

type Mode = "login" | "register";

export function AuthPanel() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Podaj email i hasło.");
      return;
    }
    try {
      setLoading(true);
      if (mode === "login") {
        const res = await authApi.login({ email, password });
        const { access_token, refresh_token } = res.data;
        login(access_token, refresh_token);
        navigate("/");
      } else {
        await authApi.register({ email, password });
        setSuccess("Konto utworzone! Zaloguj się tym samym hasłem.");
        setMode("login");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Operacja nie powiodła się.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
        minWidth: { xs: "100%", sm: 360 },
      }}
    >
      <Tabs
        value={mode}
        onChange={(_, val) => setMode(val)}
        aria-label="auth tabs"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab value="login" label="Logowanie" />
        <Tab value="register" label="Rejestracja" />
      </Tabs>

      <Stack spacing={1.25} mt={2}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label="Hasło"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        {mode === "register" && (
          <Typography variant="caption" color="text.secondary">
            Hasło min. 6 znaków. Konto tworzone jest od razu, bez dodatkowych pól.
          </Typography>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            mt: 1,
            borderRadius: 10,
            py: 1.1,
            boxShadow: "0 12px 26px rgba(15,139,111,0.3)",
          }}
        >
          {loading ? "Przetwarzanie..." : mode === "login" ? "Zaloguj się" : "Utwórz konto"}
        </Button>

        <Button
          variant="text"
          size="small"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Chcę utworzyć konto" : "Mam już konto"}
        </Button>
      </Stack>
    </Box>
  );
}

export default AuthPanel;
