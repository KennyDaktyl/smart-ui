import { Stack, Typography, Divider } from "@mui/material";
import { HuaweiConfig } from "../../types/providerConfig";

type Props = {
  config: HuaweiConfig;
};

export default function HuaweiConfigView({ config }: Props) {
  return (
    <>
      <Divider />
      <Typography variant="subtitle2" fontWeight={700}>
        Inverter details
      </Typography>

      <Stack spacing={0.5}>
        <ConfigRow label="Inverter name" value={config.name} />
        <ConfigRow label="Model" value={config.model} />
        <ConfigRow label="Station code" value={config.station_code} />
        <ConfigRow label="Inverter ID" value={config.inverter_id} />
        <ConfigRow label="Inverter type" value={config.inv_type} />
        <ConfigRow label="Software version" value={config.software_version} />
        <ConfigRow label="Optimizers" value={config.optimizer_count} />

        {config.min_power_kw != null &&
          config.max_power_kw != null && (
            <ConfigRow
              label="Power range (kW)"
              value={`${config.min_power_kw} – ${config.max_power_kw}`}
            />
          )}

        {config.latitude != null &&
          config.longitude != null && (
            <ConfigRow
              label="Location"
              value={`${config.latitude}, ${config.longitude}`}
            />
          )}
      </Stack>
    </>
  );
}

/* helpers */
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
