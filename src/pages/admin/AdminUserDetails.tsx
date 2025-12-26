import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import {
  USER_ROLE_LABEL,
  USER_ROLE_COLOR,
} from "@/features/admin/utils/userRoleUi";
import { UserDetailsResponse } from "@/features/users/types/user";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { UserFormModal } from "@/features/admin/components/UserFormModal";
import { AdminPageHeader } from "@/features/admin/components/layout/AdminPageLayout";

export function AdminUserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [user, setUser] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const loadUser = useCallback(async () => {
    if (!userId || Number.isNaN(Number(userId))) return;
    setLoading(true);
    try {
      const res = await adminApi.getUserDetails(Number(userId));
      setUser(res.data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) return <CenteredSpinner />;
  if (!user) return null;

  return (
    <>
      <AdminPageHeader
        subtitle={t("admin.title")}
        title={user.email}
        breadcrumbs={[
          { label: t("admin.title"), to: "/admin" },
          { label: t("admin.tabs.users"), to: "/admin/users" },
          { label: t("common.details") },
        ]}
        startAction={
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin/users")}
          >
            {t("common.backToList")}
          </Button>
        }
        endActions={
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
          >
            {t("common.edit")}
          </Button>
        }
      />


      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography>
                <strong>{t("user.form.email")}:</strong> {user.email}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Chip
                  label={USER_ROLE_LABEL[user.role]}
                  color={USER_ROLE_COLOR[user.role]}
                />

                <Chip
                  label={
                    user.is_active ? t("user.active") : t("user.inactive")
                  }
                  color={user.is_active ? "success" : "default"}
                />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {t("admin.createdAt")}:{" "}
                {new Date(user.created_at).toLocaleString()}
              </Typography>
            </Stack>

            {user.profile && (
              <>
                <Typography fontWeight={600}>
                  {t("account.profile.title")}
                </Typography>

                <Stack spacing={0.5}>
                  <Typography>
                    {t("account.profile.firstName")}:{" "}
                    {user.profile.first_name || "-"}
                  </Typography>
                  <Typography>
                    {t("account.profile.lastName")}:{" "}
                    {user.profile.last_name || "-"}
                  </Typography>
                  <Typography>
                    {t("account.profile.companyName")}:{" "}
                    {user.profile.company_name || "-"}
                  </Typography>
                  <Typography>
                    {t("account.profile.companyVat")}:{" "}
                    {user.profile.company_vat || "-"}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      <UserFormModal
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          loadUser();
        }}
      />
    </>
  );
}
