import { Stack } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  align?: "start" | "center" | "end";
}

export default function FormActions({
  children,
  align = "center",
}: Props) {
  return (
    <Stack
      spacing={1}
      alignItems={
        align === "start"
          ? "flex-start"
          : align === "end"
          ? "flex-end"
          : "center"
      }
    >
      {children}
    </Stack>
  );
}
