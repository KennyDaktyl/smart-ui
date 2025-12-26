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

import SurfacePanel from "@/layout/SurfacePanel";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";
import { UserResponse } from "@/features/users/types/user";
import { adminApi } from "@/api/adminApi";
import { USER_ROLE_COLOR, USER_ROLE_LABEL } from "../utils/userRoleUi";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { UserFormModal } from "./UserFormModal";
import { AdminPageHeader } from "./layout/AdminPageLayout";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { SearchInput } from "@/components/forms/SearchInput";

export function AdminUserList() {
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
    <SurfacePanel>
      <Stack spacing={2}>
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
                <TableCell>{t("user.form.email")}</TableCell>
                <TableCell>{t("user.form.role")}</TableCell>
                <TableCell>{t("user.form.isActive")}</TableCell>
                <TableCell>{t("admin.table.createdAt")}</TableCell>
                <TableCell align="right">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box py={4} display="flex" justifyContent="center">
                      <CenteredSpinner />
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography fontWeight={600} noWrap>
                        {u.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={USER_ROLE_LABEL[u.role]}
                        color={USER_ROLE_COLOR[u.role]}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          u.is_active
                            ? t("user.active")
                            : t("user.inactive")
                        }
                        color={u.is_active ? "success" : "default"}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {new Date(u.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          size="small"
                          variant="text"
                          onClick={() =>
                            navigate(`/admin/users/${u.id}`)
                          }
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

        <UserFormModal
          open={isModalOpen}
          user={selectedUser ?? undefined}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadUsers();
          }}
        />
      </Stack>
    </SurfacePanel>
  );
}
