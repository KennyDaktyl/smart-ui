import { Chip } from "@mui/material";

export type StatusBadgeStatus = "online" | "offline" | "disabled" | "pending";

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label?: string;
};

const STATUS_CONFIG: Record<StatusBadgeStatus, { color: "success" | "default" | "warning"; defaultLabel: string }> = {
  online: { color: "success", defaultLabel: "Online" },
  offline: { color: "default", defaultLabel: "Offline" },
  disabled: { color: "warning", defaultLabel: "Disabled" },
  pending: { color: "default", defaultLabel: "Pending" },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Chip
      size="small"
      label={label ?? config.defaultLabel}
      color={config.color}
      variant={status === "offline" || status === "pending" ? "outlined" : "filled"}
    />
  );
}
