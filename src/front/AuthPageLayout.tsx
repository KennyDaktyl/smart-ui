import { ReactNode } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link, useNavigate } from "react-router-dom";
import LandingNav from "./LandingNav";
import SmartEnergyFooter from "@/components/SmartEnergyFooter";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthPageLayout({ title, subtitle, children }: Props) {
  const navigate = useNavigate();

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
        <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 3, md: 4 } }}>
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="rgba(232,241,248,0.8)">
                    {subtitle}
                  </Typography>
                )}
              </Box>

              <Button
                startIcon={<ArrowBackIcon />}
                variant="text"
                color="secondary"
                onClick={() => navigate("/")}
                sx={{ borderRadius: 10, textTransform: "none" }}
              >
                Wróć
              </Button>
            </Stack>

            <Box
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
                color: "#0d1b2a",
              }}
            >
              {children}
            </Box>

            <Typography
              component={Link}
              to="/"
              sx={{
                alignSelf: "flex-start",
                color: "rgba(232,241,248,0.8)",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { color: "#7cffe0" },
              }}
            >
              ← Wróć na stronę główną
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 5 } }}>
        <SmartEnergyFooter />
      </Container>
    </Box>
  );
}
