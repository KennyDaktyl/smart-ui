import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { UserForm } from "./UserForm";
import { useUserMutation } from "../hooks/useUserMutation";
import { UserResponse } from "@/features/users/types/user";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: UserResponse;
  onSuccess: () => void;
};

export function UserFormModal({ open, onClose, user, onSuccess }: Props) {
  const { t } = useTranslation();

  const mode = user ? "edit" : "create";

  const { submit, loading } = useUserMutation(mode, user?.id, onSuccess);

  const defaultValues = user
    ? {
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      }
    : undefined;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {user ? t("user.form.editTitle") : t("user.form.addTitle")}
      </DialogTitle>

      <DialogContent>
        <UserForm isEdit={!!user} defaultValues={defaultValues} onSubmit={submit} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>

        <Button
          type="submit"
          form="user-form"
          variant="contained"
          disabled={loading}
        >
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
