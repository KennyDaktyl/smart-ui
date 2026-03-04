import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertColor } from "@mui/material";

import { authApi } from "@/api/authApi";
import { parseApiError } from "@/api/parseApiError";
import ConfirmEmailLoading from "./ConfirmEmailLoading";
import ConfirmEmailSuccess from "./ConfirmEmailSuccess";
import ConfirmEmailError from "./ConfirmEmailError";
import Toast from "@/components/Toast";

type Status = "loading" | "success" | "error";

export default function ConfirmEmailContainer() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    severity: AlertColor;
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    if (!token) {
      const message = t("auth.confirmEmail.missingToken");
      setStatus("error");
      setError(message);
      setToast({ open: true, severity: "error", message });
      return;
    }

    authApi
      .confirmEmail(token)
      .then(() => {
        const message = t("auth.confirmEmail.successTitle");
        setStatus("success");
        setToast({ open: true, severity: "success", message });
      })
      .catch((err) => {
        const parsed = parseApiError(err);
        const message = parsed.message || t("auth.confirmEmail.errorDescription");
        setStatus("error");
        setError(message);
        setToast({ open: true, severity: "error", message });
      });
  }, [token, t]);

  const renderContent = () => {
    if (status === "loading") return <ConfirmEmailLoading />;
    if (status === "success") return <ConfirmEmailSuccess />;
    return <ConfirmEmailError message={error} />;
  };

  return (
    <>
      {renderContent()}
      <Toast
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
