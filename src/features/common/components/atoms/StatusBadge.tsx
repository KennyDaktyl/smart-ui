import { Chip } from "@mui/material";

export type StatusBadgeStatus =
  | "online"
  | "offline"
  | "disabled"
  | "pending";

export type StatusBadgeProps = {
  status: StatusBadgeStatus;
  label?: string;
};

type StatusConfig = {
  color: "success" | "default" | "warning";
  variant: "filled" | "outlined";
  defaultLabel: string;
};

const STATUS_CONFIG: Record<StatusBadgeStatus, StatusConfig> = {
  online: {
    color: "success",
    variant: "filled",
    defaultLabel: "Online",
  },
  offline: {
    color: "default",
    variant: "outlined",
    defaultLabel: "Offline",
  },
  pending: {
    color: "default",
    variant: "outlined",
    defaultLabel: "Pending",
  },
  disabled: {
    color: "warning",
    variant: "filled",
    defaultLabel: "Disabled",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { color, variant, defaultLabel } = STATUS_CONFIG[status];

  return (
    <Chip
      size="small"
      color={color}
      variant={variant}
      label={label ?? defaultLabel}
    />
  );
}
