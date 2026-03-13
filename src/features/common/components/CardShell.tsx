import { Card, CardContent, Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type CardShellProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  minHeight?: number | string;
  visualState?: "default" | "offline";
  headerSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  subtitleSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
};

export function CardShell({
  title,
  subtitle,
  actions,
  children,
  minHeight,
  visualState = "default",
  headerSx,
  titleSx,
  subtitleSx,
  actionsSx,
  sx,
}: CardShellProps) {
  const isOffline = visualState === "offline";

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        minHeight,
        display: "flex",
        flexDirection: "column",
        background:
          isOffline
            ? "linear-gradient(180deg, rgba(241,245,249,0.96) 0%, rgba(226,232,240,0.92) 100%)"
            : undefined,
        borderColor: isOffline ? "rgba(100,116,139,0.5)" : undefined,
        boxShadow: isOffline ? "0 10px 22px rgba(15,23,42,0.09)" : undefined,
        ...sx,
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {(title || subtitle || actions) && (
          <Box
            sx={[
              {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1.5,
                gap: 2,
              },
              headerSx,
            ]}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && (
                <Typography variant="h6" fontWeight={600} sx={titleSx}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={subtitleSx}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {actions && <Box sx={actionsSx}>{actions}</Box>}
          </Box>
        )}

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}
