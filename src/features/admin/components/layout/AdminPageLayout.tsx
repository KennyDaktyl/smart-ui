import {
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { ReactNode } from "react";

export type AdminBreadcrumb = {
  label: ReactNode;
  to?: string;
};

type AdminPageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
  startAction?: ReactNode;
  endActions?: ReactNode;
};

export function AdminPageContainer({ children }: { children: ReactNode }) {
  return <Box sx={{ width: "100%", minWidth: 0 }}>{children}</Box>;
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  startAction,
  endActions,
}: AdminPageHeaderProps) {
  const breadcrumbColor = "rgba(232,241,248,0.74)";
  const subtitleColor = "rgba(232,241,248,0.74)";
  const titleColor = "#e8f1f8";

  return (
    <Stack
      spacing={0.75}
      sx={{
        mb: 1.5,
        "& .MuiBreadcrumbs-separator": {
          color: breadcrumbColor,
        },
      }}
    >
      {/* BREADCRUMBS */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast || !crumb.to) {
              return (
                <Typography
                  key={`${index}`}
                  sx={{ color: breadcrumbColor }}
                >
                  {crumb.label}
                </Typography>
              );
            }

            return (
              <MuiLink
                key={`${index}`}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                sx={{ color: breadcrumbColor, fontWeight: 500 }}
              >
                {crumb.label}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}

      {/* HEADER ROW */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        flexDirection={{ xs: "column", sm: "row" }}
        gap={{ xs: 1.25, sm: 1.5 }}
      >
        <Stack spacing={0.25}>
          {/* ✅ SUBTITLE (np. "Panel administratora") */}
          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: subtitleColor, letterSpacing: 0.15 }}
            >
              {subtitle}
            </Typography>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1}
          >
            {startAction}
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: titleColor }}
            >
              {title}
            </Typography>
          </Stack>
        </Stack>

        {endActions && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {endActions}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
