import {
  Button,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

import { AdminUserForm } from "./AdminUserForm";
import { useUserMutation } from "@/features/admin/hooks/useUserMutation";
import { UserResponse } from "@/features/users/types/user";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: UserResponse;
  onSuccess: () => void;
};

export function AdminUserFormModal({ open, onClose, user, onSuccess }: Props) {
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
    <StickyDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      title={user ? t("user.form.editTitle") : t("user.form.addTitle")}
      actions={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>

          <Button
            type="submit"
            form="user-form"
            variant="contained"
            disabled={loading}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
        <AdminUserForm isEdit={!!user} defaultValues={defaultValues} onSubmit={submit} />
    </StickyDialog>
  );
}
