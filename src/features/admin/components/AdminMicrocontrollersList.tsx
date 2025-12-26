import { useState } from "react";
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
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import SurfacePanel from "@/layout/SurfacePanel";
import { ADMIN_DEFAULT_PAGE_SIZE } from "@/config/admin";
import { Pagination } from "@/features/paginations/Pagination";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { useDebouncedValue } from "@/components/hooks/useDebouncedValue";
import { SearchInput } from "@/components/forms/SearchInput";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerFormModal } from "./MicrocontrollerFormModal";
import { AdminPageHeader } from "./layout/AdminPageLayout";
import { useMicrocontrollersOnlineStatus } from "@/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus";
import { useAdminMicrocontrollersList } from "../hooks/useAdminMicrocontrollersList";
import { useMicrocontrollerDeletion } from "../hooks/useMicrocontrollerDeletion";

export function AdminMicrocontrollersList() {
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
  const [selected, setSelected] = useState<MicrocontrollerResponse | null>(null);

  const uuids = items.map((mc) => mc.uuid);
  const onlineState = useMicrocontrollersOnlineStatus(uuids);

  const handleDelete = async (microcontrollerId: number) => {
    try {
      await remove(microcontrollerId);
      reload();
    } catch {
      // toast already emitted
    }
  };

  return (
    <SurfacePanel>
      <Stack spacing={2}>
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
              color="primary"
              onClick={() => {
                setSelected(null);
                setModalOpen(true);
              }}
            >
              {t("admin.microcontrollers.add")}
            </Button>
          }
        />

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
                <TableCell align="center">{t("microcontroller.name")}</TableCell>
                <TableCell align="center">{t("microcontroller.owner")}</TableCell>
                <TableCell align="center">{t("microcontroller.type")}</TableCell>
                <TableCell align="center">{t("microcontroller.enabled")}</TableCell>
                <TableCell align="center">{t("common.online")}</TableCell>
                <TableCell align="center">{t("common.createdAt")}</TableCell>
                <TableCell align="center">{t("common.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box py={4} display="flex" justifyContent="center">
                      <CenteredSpinner />
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((mc) => (
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
                      <Chip label={t(`microcontroller.types.${mc.type}`)} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          mc.enabled ? t("common.enabled") : t("common.disabled")
                        }
                        color={mc.enabled ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {onlineState[mc.uuid]?.online ? (
                        <Chip label="OK" color="success" />
                      ) : (
                        <Chip label="NO" color="error" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(mc.created_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            navigate(`/admin/microcontrollers/${mc.id}`)
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
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(mc.id)}
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
          count={items.length}
          total={total}
          onPrev={() => setOffset((o) => Math.max(0, o - limit))}
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
    </SurfacePanel>
  );
}
