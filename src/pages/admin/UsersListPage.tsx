import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminUserSummary } from "@/features/admin/types";
import ShieldIcon from "@mui/icons-material/Shield";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";

export default function UsersListPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(ADMIN_DEFAULT_PAGE_SIZE);
  const [offset, setOffset] = useState(0);

  const locale = useMemo(() => (i18n.language === "pl" ? "pl-PL" : "en-US"), [i18n.language]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const res = await adminApi.getUsers(token, { limit, offset });
        setUsers(res.data);
        setError("");
      } catch (err) {
        console.error("Failed to load users", err);
        setError(t("admin.errors.loadUsers"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, t, limit, offset]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <Box p={{ xs: 1.5, md: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#e8f1f8" }}>
            {t("admin.usersTitle")}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(232,241,248,0.7)" }}>
            {t("admin.usersSubtitle")}
          </Typography>
        </Box>

        {isAdmin && (
          <Chip
            icon={<ShieldIcon />}
            label={t("admin.adminLabel")}
            color="secondary"
            variant="filled"
          />
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {users.length === 0 ? (
        <Typography color="text.secondary">{t("admin.emptyUsers")}</Typography>
      ) : (
        <List
          sx={{
            bgcolor: "rgba(8,19,31,0.82)",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#e8f1f8",
          }}
        >
          {users.map((u, idx) => (
            <Box key={u.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Button size="small" variant="contained" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    {t("admin.viewDetails")}
                  </Button>
                }
                sx={{ py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#e8f1f8" }}>
                        {u.email}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${t("admin.idLabel")}: ${u.id}`}
                        variant="outlined"
                        sx={{ color: "#c5d7e4", borderColor: "rgba(255,255,255,0.14)" }}
                      />
                      <Chip
                        size="small"
                        label={t("admin.role", { role: u.role })}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={u.is_active ? t("admin.statusActive") : t("admin.statusInactive")}
                        color={u.is_active ? "success" : "default"}
                        variant={u.is_active ? "filled" : "outlined"}
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={0.5} mt={1} color="rgba(232,241,248,0.8)">
                      <Typography variant="body2">
                        {t("admin.huaweiLabel")}: {u.huawei_username || t("admin.noHuawei")}
                      </Typography>
                      <Typography variant="body2">
                        {t("admin.userSince", { date: new Date(u.created_at).toLocaleDateString(locale) })}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItem>
              {idx < users.length - 1 && <Divider component="li" sx={{ borderColor: "rgba(255,255,255,0.06)" }} />}
            </Box>
          ))}
        </List>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="rgba(232,241,248,0.7)">
            {t("admin.limitLabel", { count: limit })}
          </Typography>
          <Chip
            size="small"
            label="5"
            variant={limit === 5 ? "filled" : "outlined"}
            onClick={() => {
              setOffset(0);
              setLimit(5);
            }}
          />
          <Chip
            size="small"
            label="10"
            variant={limit === 10 ? "filled" : "outlined"}
            onClick={() => {
              setOffset(0);
              setLimit(10);
            }}
          />
          <Chip
            size="small"
            label="20"
            variant={limit === 20 ? "filled" : "outlined"}
            onClick={() => {
              setOffset(0);
              setLimit(20);
            }}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<ChevronLeftIcon />}
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={offset === 0 || loading}
            variant="outlined"
          >
            {t("admin.prevPage")}
          </Button>
          <Button
            size="small"
            endIcon={<ChevronRightIcon />}
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={users.length < limit}
            variant="outlined"
          >
            {t("admin.nextPage")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
