import { Button } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

type Props = {
  label: string;
  color?: "primary" | "error" | "warning" | "success";
  variant?: "contained" | "outlined" | "text";

  confirmRequired?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;

  onConfirm: () => Promise<void> | void;
  onSuccessNavigateTo?: string;
  navigate?: (path: string) => void;

  disabled?: boolean;
};

export function ActionButton({
  label,
  color = "primary",
  variant = "contained",
  confirmRequired = false,
  confirmTitle,
  confirmMessage,
  onConfirm,
  onSuccessNavigateTo,
  navigate,
  disabled,
}: Props) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (confirmRequired) {
      setOpen(true);
      return;
    }

    await execute();
  };

  const execute = async () => {
    try {
      setLoading(true);
      await onConfirm();

      if (onSuccessNavigateTo && navigate) {
        navigate(onSuccessNavigateTo);
      }
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        color={color}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {label}
      </Button>

      {confirmRequired && (
        <StickyDialog
          open={open}
          onClose={() => setOpen(false)}
          title={confirmTitle ?? t("common.confirmTitle")}
          actions={
            <>
              <Button onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>

              <Button
                color={color}
                onClick={execute}
                autoFocus
                disabled={loading}
              >
                {t("common.confirm")}
              </Button>
            </>
          }
          maxWidth="xs"
        >
          {confirmMessage ?? t("common.confirmMessage")}
        </StickyDialog>
      )}
    </>
  );
}
