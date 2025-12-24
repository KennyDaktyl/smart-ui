import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";
import { microcontrollerApi } from "@/api/microcontrollerApi";

export function AdminMicrocontrollersList() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const limit = ADMIN_DEFAULT_PAGE_SIZE;

  const loadMicrocontrollers = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const res = await microcontrollerApi.getMicrocontrollers(token, { limit, offset, admin_list: true });
      setItems(res.data.items ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch (err) {
      console.error("Failed to load microcontrollers", err);
      setError(t("admin.errors.loadMicrocontrollers"));
    } finally {
      setLoading(false);
    }
  }, [token, limit, offset, t]);

  useEffect(() => {
    loadMicrocontrollers();
  }, [loadMicrocontrollers]);

  const handleDelete = async (uuid: string) => {
    if (!token) return;
    if (!confirm("Czy na pewno usunąć mikrokontroler?")) return;

    await adminApi.deleteMicrocontrollerByUuid(token, uuid);
    setOffset(0);
    await loadMicrocontrollers();
  };

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
            onClick={() => navigate("/admin/microcontrollers/add")}
            sx={{ alignSelf: "flex-start" }}
          >
            {t("admin.microcontrollers.addButton")}
          </Button>

          {error && <Alert severity="error">{error}</Alert>}

          <List>
            {items.map((mc, idx) => (
              <Box key={mc.uuid}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/microcontrollers/${mc.uuid}/edit`);
                        }}
                      >
                        {t("admin.microcontrollers.editButton")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mc.uuid);
                        }}
                      >
                        {t("admin.microcontrollers.deleteButton")}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/microcontrollers/${mc.uuid}`);
                        }}
                      >
                        {t("admin.microcontrollers.detailsButton")}
                      </Button>
                    </Stack>
                  }
                >
                  <ListItemButton
                    onClick={() => navigate(`/admin/microcontrollers/${mc.uuid}`)}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>
                            {mc.name ?? mc.uuid}
                          </Typography>
                          <Chip
                            size="small"
                            label={
                              mc.enabled
                                ? t("admin.microcontrollers.statusActive")
                                : t("admin.microcontrollers.statusInactive")
                            }
                            color={mc.enabled ? "success" : "default"}
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.25}>
                          <Typography variant="body2">
                            UUID: {mc.uuid}
                          </Typography>
                          <Typography variant="body2">
                            {t("admin.microcontrollers.ownerLabel")}:{" "}
                            {mc.user_email ?? "-"}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                </ListItem>

                {idx < items.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          <Pagination
            offset={offset}
            limit={limit}
            count={items.length}
            total={total}
            onPrev={() => setOffset((o) => Math.max(0, o - limit))}
            onNext={() => setOffset((o) => o + limit)}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
