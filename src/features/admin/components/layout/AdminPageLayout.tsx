import {
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

import ContentContainer from "@/layout/ContentContainer";
import SurfacePanel from "@/layout/SurfacePanel";
import { useTranslation } from "react-i18next";

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

const outerStyles = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  px: { xs: 2, md: 3 },
  py: { xs: 3, md: 4 },
};

export function AdminPageContainer({ children }: { children: ReactNode }) {
  return (
    <Box sx={outerStyles}>
      <ContentContainer
        sx={{
          backgroundColor: "transparent",
          boxShadow: "none",
          border: "none",
          px: { xs: 0, md: 1 },
          pt: { xs: 0, md: 1 },
        }}
      >
        <SurfacePanel>{children}</SurfacePanel>
      </ContentContainer>
    </Box>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  startAction,
  endActions,
}: AdminPageHeaderProps) {
  const breadcrumbColor = "text.secondary";
  const subtitleColor = "text.secondary";

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
      <Box display="flex" justifyContent="space-between" alignItems="center">
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

          <Stack direction="row" alignItems="center" spacing={1}>
            {startAction}
            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ color: "text.primary" }}
            >
              {title}
            </Typography>
          </Stack>
        </Stack>

        {endActions && (
          <Stack direction="row" alignItems="center" spacing={1}>
            {endActions}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
