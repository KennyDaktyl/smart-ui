import { Box, Container, Stack } from "@mui/material";
import { ReactNode } from "react";
import LandingNav from "./LandingNav";
import SmartEnergyFooter from "@/components/SmartEnergyFooter";
import AuthPanel from "./components/AuthPanel";

interface Props {
  children: ReactNode;
  showAuthPanel?: boolean;
}

export default function LandingLayout({ children, showAuthPanel = true }: Props) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at 12% 18%, rgba(124,255,224,0.08) 0%, rgba(12,24,36,0) 35%), linear-gradient(150deg, #061423 0%, #081b2c 35%, #071320 100%)",
        color: "#e8f1f8",
      }}
    >
      <LandingNav />

      <Box sx={{ flex: 1, width: "100%" }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 2, md: 4 } }}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 2.5, md: 3.5 }}
            alignItems="stretch"
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
            {showAuthPanel && (
              <Box sx={{ flexShrink: 0, width: { xs: "100%", lg: 380 } }}>
                <AuthPanel />
              </Box>
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 5 } }}>
        <SmartEnergyFooter />
      </Container>
    </Box>
  );
}
