import { Alert, Snackbar } from "@mui/material";
import { AlertColor } from "@mui/material";

interface ToastProps {
  open: boolean;
  message?: string | null;
  severity?: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

export default function Toast({
  open,
  message,
  severity = "info",
  onClose,
  autoHideDuration = 4000,
}: ToastProps) {
  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={severity} onClose={onClose} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}
