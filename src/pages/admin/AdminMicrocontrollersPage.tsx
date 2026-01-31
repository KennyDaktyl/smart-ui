import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { SearchInput } from "@/components/forms/SearchInput";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { ActionButton } from "@/components/ActionButton";
import { useAdminMicrocontrollersList } from "@/features/admin/hooks/useAdminMicrocontrollersList";
import { useMicrocontrollerDeletion } from "@/features/admin/hooks/useMicrocontrollerDeletion";
import { PageShell } from "@/features/admin/components/layout/PageShell";
import { AdminPageHeader } from "@/features/admin/components/layout/AdminPageLayout";
import { MicrocontrollerFormModal } from "@/features/admin/components/MicrocontrollerFormModal";
import { useMicrocontrollersLive } from "@/features/microcontrollers/hooks/useMicrocontrollerListLive";

export function AdminMicrocontrollersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);

  const limit = ADMIN_DEFAULT_PAGE_SIZE;

  const { items, total, loading, error, reload } =
    useAdminMicrocontrollersList({
      limit,
      offset,
      search: debouncedSearch,
    });

  const { remove } = useMicrocontrollerDeletion();

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] =
    useState<MicrocontrollerResponse | null>(null);

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const uuids = useMemo(
    () => items.map((mc) => mc.uuid),
    [items]
  );

  const live = useMicrocontrollersLive(uuids);

  const handleDelete = async (microcontrollerId: number) => {
    try {
      await remove(microcontrollerId);

      setToast({
        open: true,
        message: t("microcontroller.deleteSuccess"),
        severity: "success",
      });

      reload();
    } catch {
      setToast({
        open: true,
        message: t("microcontroller.deleteError"),
        severity: "error",
      });
    }
  };

  return (
    <>
      <PageShell
        header={
          <AdminPageHeader
            title={t("admin.microcontrollers.title")}
            breadcrumbs={[
              { label: t("admin.title"), to: "/admin" },
              {
                label: t("admin.tabs.microcontrollers"),
                to: "/admin/microcontrollers",
              },
            ]}
            endActions={
              <Button
                variant="contained"
                onClick={() => {
                  setSelected(null);
                  setModalOpen(true);
                }}
              >
                {t("admin.microcontrollers.add")}
              </Button>
            }
          />
        }
        loading={loading}
      >
        <Stack spacing={2}>
          <SearchInput
            value={search}
            onChange={(v) => {
              setOffset(0);
              setSearch(v);
            }}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="center">
                    {t("microcontroller.name")}
                  </TableCell>
                  <TableCell align="center">
                    {t("microcontroller.owner")}
                  </TableCell>
                  <TableCell align="center">
                    {t("microcontroller.type")}
                  </TableCell>
                  <TableCell align="center">
                    {t("common.online")}
                  </TableCell>
                  <TableCell align="center">
                    {t("common.createdAt")}
                  </TableCell>
                  <TableCell align="center">
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {items.map((mc) => {
                  const state = live[mc.uuid];

                  return (
                    <TableRow key={mc.uuid} hover>
                      <TableCell>
                        <Typography fontWeight={600} noWrap>
                          {mc.name}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {mc.user?.email ?? "-"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={t(
                            `microcontroller.types.${mc.type}`
                          )}
                        />
                      </TableCell>

                      {/* ===== ONLINE STATUS ===== */}
                      <TableCell align="center">
                        {!state || state.loading ? (
                          <CircularProgress size={16} />
                        ) : state.isOnline ? (
                          <Chip
                            label="OK"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            label="NO"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="caption">
                          {new Date(
                            mc.created_at
                          ).toLocaleString()}
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
                            variant="outlined"
                            onClick={() =>
                              navigate(
                                `/admin/microcontrollers/${mc.id}`
                              )
                            }
                          >
                            {t("common.details")}
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelected(mc);
                              setModalOpen(true);
                            }}
                          >
                            {t("common.edit")}
                          </Button>

                          <ActionButton
                            label={t("common.delete")}
                            color="error"
                            variant="text"
                            confirmRequired
                            confirmTitle={t(
                              "common.confirmDelete"
                            )}
                            confirmMessage={t(
                              "microcontroller.confirmDelete"
                            )}
                            onConfirm={() =>
                              handleDelete(mc.id)
                            }
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          <Pagination
            offset={offset}
            limit={limit}
            count={items.length}
            total={total}
            onPrev={() =>
              setOffset((o) => Math.max(0, o - limit))
            }
            onNext={() => setOffset((o) => o + limit)}
          />

          <MicrocontrollerFormModal
            open={modalOpen}
            microcontroller={selected ?? undefined}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              setModalOpen(false);
              reload();
            }}
          />
        </Stack>
      </PageShell>

      {/* ===== TOAST ===== */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() =>
          setToast((t) => ({ ...t, open: false }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() =>
            setToast((t) => ({ ...t, open: false }))
          }
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
