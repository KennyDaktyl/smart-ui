import { MicrocontrollerCard } from "./MicrocontrollerCard";
import { Microcontroller } from "./types";
import Grid from "@mui/material/Grid2";

interface MicrocontrollerGridProps {
  items: Microcontroller[];
  onAttachProvider(mc: Microcontroller): void;
  onRefresh(): void;
}

export function MicrocontrollerGrid({
  items,
  onAttachProvider,
  onRefresh,
}: MicrocontrollerGridProps) {
  return (
    <Grid container spacing={3}>
      {items.map((mc) => (
        <Grid item xs={12} md={6} lg={4} mt={1} key={mc.uuid}>
        <MicrocontrollerCard
          microcontroller={mc}
          onAttachProvider={onAttachProvider}
          onRefresh={onRefresh}
        />
        </Grid>
      ))}
    </Grid>
  );
}
