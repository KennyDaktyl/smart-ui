import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";
import { UserResponse } from "@/features/users/types/user";
import { adminApi } from "@/api/adminApi";
import { USER_ROLE_COLOR, USER_ROLE_LABEL } from "../../features/admin/utils/userRoleUi";
import { AdminUserFormModal } from "@/features/users/components/admin/AdminUserFormModal";
import { AdminPageHeader } from "../../features/admin/components/layout/AdminPageLayout";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { SearchInput } from "@/components/forms/SearchInput";
import { PageShell } from "../../features/admin/components/layout/PageShell";

export function AdminUsersPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const limit = ADMIN_DEFAULT_PAGE_SIZE;

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminApi.getUsers({
        limit,
        offset,
        search: debouncedSearch || undefined,
      });

      setUsers(res.data.items);
      setTotal(res.data.meta.total);
    } catch {
      setError(t("common.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [token, offset, limit, debouncedSearch]);

  return (
    <PageShell
      header={
        <AdminPageHeader
          title={t("admin.userList.title")}
          breadcrumbs={[
            { label: t("admin.title"), to: "/admin" },
            { label: t("admin.tabs.users"), to: "/admin/users" },
          ]}
          endActions={
            <Button
              variant="contained"
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
            >
              {t("admin.userList.actions.addUser")}
            </Button>
          }
        />
      }
      loading={loading}
    >
      <Stack spacing={2}>
        <SearchInput
          value={search}
          onChange={(value) => {
            setOffset(0);
            setSearch(value);
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">{t("user.form.email")}</TableCell>
                <TableCell align="center">{t("user.form.role")}</TableCell>
                <TableCell align="center">{t("user.form.isActive")}</TableCell>
                <TableCell align="center">{t("admin.table.createdAt")}</TableCell>
                <TableCell align="center">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography fontWeight={600} noWrap>
                      {u.email}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={USER_ROLE_LABEL[u.role]}
                      color={USER_ROLE_COLOR[u.role]}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={
                        u.is_active ? t("user.active") : t("user.inactive")
                      }
                      color={u.is_active ? "success" : "default"}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="caption">
                      {new Date(u.created_at).toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                      >
                        {t("common.details")}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsModalOpen(true);
                        }}
                      >
                        {t("common.edit")}
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        onClick={async () => {
                          await adminApi.deleteUser(u.id);
                          loadUsers();
                        }}
                      >
                        {t("common.delete")}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Pagination
          offset={offset}
          limit={limit}
          count={users.length}
          total={total}
          onPrev={() => setOffset((o) => Math.max(0, o - limit))}
          onNext={() => setOffset((o) => o + limit)}
        />

        <AdminUserFormModal
          open={isModalOpen}
          user={selectedUser ?? undefined}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadUsers();
          }}
        />
      </Stack>
    </PageShell>
  );
}
