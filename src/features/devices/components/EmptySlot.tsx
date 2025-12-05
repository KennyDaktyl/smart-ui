import { Card, CardContent, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export function EmptySlot({ slotIndex, locked, onAdd }: any) {
  return (
    <Card
      sx={{
        border: "2px dashed #aaa",
        textAlign: "center",
        py: 3,
        opacity: locked ? 0.4 : 1,
        cursor: locked ? "not-allowed" : "pointer",
        "&:hover": locked ? {} : { background: "#f7f7f7" },
      }}
      onClick={() => !locked && onAdd()}
    >
      <CardContent>
        <AddIcon fontSize="large" />
        <Typography>Dodaj urządzenie (slot {slotIndex})</Typography>
        {locked && (
          <Typography color="error" variant="caption">
            Raspberry offline
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
