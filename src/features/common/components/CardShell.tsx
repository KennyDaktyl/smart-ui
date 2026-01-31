import { Card, CardContent, Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type CardShellProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  minHeight?: number | string;
  sx?: SxProps<Theme>;
};

export function CardShell({
  title,
  subtitle,
  actions,
  children,
  minHeight,
  sx,
}: CardShellProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        minHeight,
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {(title || subtitle || actions) && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={1.5}
            gap={2}
          >
            <Box>
              {title && (
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && <Box>{actions}</Box>}
          </Box>
        )}

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}
