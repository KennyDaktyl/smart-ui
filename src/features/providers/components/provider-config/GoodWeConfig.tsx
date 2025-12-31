import { Stack, Typography, Divider } from "@mui/material";
import { GoodWeConfig } from "../../types/providerConfig";

type Props = {
  config: GoodWeConfig;
};

export default function GoodWeConfigView({ config }: Props) {
  return (
    <>
      <Divider />
      <Typography variant="subtitle2" fontWeight={700}>
        GoodWe power station details
      </Typography>

      <Stack spacing={0.5}>
        <ConfigRow label="Station name" value={config.station_name} />
        <ConfigRow label="Address" value={config.address} />
        <ConfigRow label="Capacity (kW)" value={config.capacity_kw} />
        <ConfigRow
          label="Battery capacity (kWh)"
          value={config.battery_capacity_kwh}
        />
        <ConfigRow label="Type" value={config.powerstation_type} />
        <ConfigRow label="Currency" value={config.currency} />
        <ConfigRow label="Inverter SN" value={config.inverter_sn} />
        <ConfigRow label="Max power (kW)" value={config.max_power_kw} />
      </Stack>
    </>
  );
}

function ConfigRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null) return null;

  return (
    <Stack direction="row" spacing={1}>
      <Typography variant="body2" fontWeight={600}>
        {label}:
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}
