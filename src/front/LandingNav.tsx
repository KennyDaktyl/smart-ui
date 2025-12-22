import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function LandingNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const isActive = (to: string) => pathname === to;
  const links = [
    { label: t("front.nav.home"), to: "/" },
    { label: t("front.nav.offer"), to: "/offer" },
    { label: t("front.nav.pricing"), to: "/pricing" },
    { label: t("front.nav.contact"), to: "/contact" },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        backdropFilter: "blur(12px)",
        background: "rgba(7,20,32,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 76 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: "none",
            color: "#e8f1f8",
            fontWeight: 800,
            letterSpacing: 0.8,
          }}
        >
          {t("common.brand")}
        </Typography>

        <Box sx={{ flex: 1, display: { xs: "none", md: "flex" }, gap: 1 }}>
          {links.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              color={isActive(link.to) ? "secondary" : "inherit"}
              variant={isActive(link.to) ? "contained" : "text"}
              sx={{
                color: isActive(link.to) ? "#0a1726" : "#dce8f2",
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            color="secondary"
            sx={{ borderRadius: 999, borderColor: "rgba(124,255,224,0.6)" }}
          >
            {t("front.nav.login")}
          </Button>
          <Button
            component={Link}
            to="/register"
            variant="contained"
            color="primary"
            sx={{ borderRadius: 999, boxShadow: "0 8px 22px rgba(15,139,111,0.35)" }}
          >
            {t("front.nav.register")}
          </Button>
        </Box>

        <IconButton
          edge="end"
          onClick={() => setOpen((v) => !v)}
          sx={{ display: { xs: "flex", md: "none" }, color: "#e8f1f8" }}
          aria-label={t("common.menu")}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {open && (
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            gap: 1,
            px: 2,
            pb: 2,
            background: "rgba(7,20,32,0.9)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {links.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              color={isActive(link.to) ? "secondary" : "inherit"}
              variant={isActive(link.to) ? "contained" : "text"}
              onClick={() => setOpen(false)}
              sx={{ justifyContent: "flex-start", color: "#dce8f2" }}
            >
              {link.label}
            </Button>
          ))}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              component={Link}
              to="/login"
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{ borderRadius: 999, borderColor: "rgba(124,255,224,0.6)" }}
              onClick={() => setOpen(false)}
            >
              {t("front.nav.login")}
            </Button>
            <Button
              component={Link}
              to="/register"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ borderRadius: 999, boxShadow: "0 8px 22px rgba(15,139,111,0.35)" }}
              onClick={() => setOpen(false)}
            >
              {t("front.nav.register")}
            </Button>
          </Box>
        </Box>
      )}
    </AppBar>
  );
}

export default LandingNav;
