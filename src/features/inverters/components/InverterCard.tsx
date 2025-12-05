import { Card, CardContent, Typography } from "@mui/material";
import { Inverter } from "@/features/installations/hooks/installation";
import { InverterPower } from "@/features/inverters/components/InverterPower";

interface Props {
  inverter: Inverter;
}

export function InverterCard({ inverter }: Props) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">
          {inverter.name || inverter.serial_number}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Serial: {inverter.serial_number}
        </Typography>

        <InverterPower
          inverterId={inverter.id}
          serial={inverter.serial_number}
        />

      </CardContent>
    </Card>
  );
}
