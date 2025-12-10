import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface Props {
  token: string;
  onSaved?: () => void;
}

export default function HuaweiCredentialsForm({ token, onSaved }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    axios
      .get(`${API_URL}/users/me/huawei-credentials`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsername(res.data.huawei_username);
        setPassword(res.data.huawei_password);
      })
      .catch(() => {});
  }, [token]);

  const handleSave = async () => {
    try {
      await axios.put(
        `${API_URL}/users/huawei-credentials`,
        {
          huawei_username: username,
          huawei_password: password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaved(true);
      setMessage(t("huaweiCredentials.saved"));

      if (onSaved) onSaved();

      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setMessage(err.response?.data?.detail || t("huaweiCredentials.saveError"));
    }
  };

  return (
    <Paper
      elevation={4}
      sx={{
        p: { xs: 2.5, md: 4 },
        mt: 3,
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        backgroundColor: "rgba(255,255,255,0.98)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.16)",
        border: "1px solid rgba(15,139,111,0.08)",
      }}
    >
      <Typography variant="h6" mb={2}>
        {t("huaweiCredentials.title")}
      </Typography>

      {message && (
        <Alert severity={saved ? "success" : "error"} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* USERNAME */}
      <TextField
        fullWidth
        label={t("huaweiCredentials.username")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        margin="normal"
      />

      {/* PASSWORD + toggle visibility */}
      <TextField
        fullWidth
        label={t("huaweiCredentials.password")}
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((prev) => !prev)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>
        {t("huaweiCredentials.save")}
      </Button>
    </Paper>
  );
}
