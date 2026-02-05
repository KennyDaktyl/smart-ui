import { Button, Divider, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

import { CardShell } from "@/features/common/components/CardShell";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import { MicrocontrollerMeta } from "./MicrocontrollerMeta";
import { MicrocontrollerProvider } from "./MicrocontrollerProvider";


type Props = {
  microcontroller: MicrocontrollerResponse;
  live: LiveState;
  onAddDevice: () => void;
};

export function MicrocontrollerBox({
  microcontroller,
  live,
  onAddDevice,
}: Props) {
  const { t } = useTranslation();

  return (
    <CardShell
      title={microcontroller.name}
      subtitle={t(`microcontroller.types.${microcontroller.type}`)}
      actions={<StatusBadge status={live.status} />}
      sx={{ width: "100%" }}
    >
      <Stack spacing={2}>
        <MicrocontrollerMeta
          microcontroller={microcontroller}
          live={live}
        />

        <Divider />

        <MicrocontrollerProvider microcontroller={microcontroller} />

        <Divider />

        <Button
          variant="contained"
          disabled={live.status !== "online"}
          onClick={onAddDevice}
        >
          {t("common.add")}
        </Button>
      </Stack>
    </CardShell>
  );
}
