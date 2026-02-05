import Grid from "@mui/material/Grid";
import { Stack } from "@mui/system";
import { ReactNode } from "react";

type Props = {
  layout: "stack" | "split";
  left: ReactNode;
  right: ReactNode;
};

export function MicrocontrollerSplitLayout({ layout, left, right }: Props) {
  if (layout === "split") {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        <Grid xs={12} md={3}>{left}</Grid>
        <Grid xs={12} md={9} sx={{ minWidth: 0 }}>{right}</Grid>
      </Grid>
    );
  }

  return (
    <Stack spacing={2}>
      {left}
      {right}
    </Stack>
  );
}
