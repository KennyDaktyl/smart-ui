import { Box, Toolbar } from "@mui/material";
import { ReactNode } from "react";
import AppHeader, { HeaderMode } from "./AppHeader";
import ContentContainer from "./ContentContainer";
import SmartEnergyFooter from "@/components/SmartEnergyFooter";

interface AppShellProps {
  mode: HeaderMode;
  children: ReactNode;
}

export default function AppShell({ mode, children }: AppShellProps) {
  const isApp = mode === "app";

  return (
    <Box
      sx={{
        minHeight: "120vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <AppHeader mode={mode} />

      <Toolbar sx={{ minHeight: "84px !important" }} />

      <Box sx={{ flex: 1, width: "100%" }}>
        <ContentContainer sx={{ py: { xs: 3, md: 4 } }}>
          {children}
        </ContentContainer>
      </Box>

      <SmartEnergyFooter />
    </Box>
  );
}
