import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminUserSummary } from "@/features/admin/types";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";

export function AdminUserList() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = ADMIN_DEFAULT_PAGE_SIZE;

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      const res = await adminApi.getUsers(token, { limit, offset });
      setUsers(res.data.items ?? []);
      setTotal(res.data.meta?.total ?? 0);
      setLoading(false);
    };

    load();
  }, [token, offset]);

  if (loading) {
    return (
      <Box py={6} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => navigate("/register")}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("admin.addUser")}
          </Button>

          <List>
            {users.map((u, idx) => (
              <Box key={u.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >
                      {t("admin.viewDetails")}
                    </Button>
                  }
                >
                  <ListItemButton>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>
                            {u.email}
                          </Typography>
                          <Chip size="small" label={u.role} />
                          <Chip
                            size="small"
                            color={u.is_active ? "success" : "default"}
                            label={u.is_active ? "Active" : "Inactive"}
                          />
                        </Stack>
                      }
                    />
                  </ListItemButton>
                </ListItem>

                {idx < users.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          <Pagination
            offset={offset}
            limit={limit}
            count={users.length}
            total={total}
            onPrev={() => setOffset((o) => Math.max(0, o - limit))}
            onNext={() => setOffset((o) => o + limit)}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
