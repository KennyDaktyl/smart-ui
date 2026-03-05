import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/features/auth/hooks/useAuth";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export type HeaderMode = "public" | "app";

interface MenuItem {
  label: string;
  path?: string;
  action?: () => void;
}

type DrawerEntry = MenuItem | { type: "divider" };

interface AppHeaderProps {
  mode: HeaderMode;
}

export default function AppHeader({ mode }: AppHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublic = mode === "public";

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const publicNav: MenuItem[] = [
    { label: t("landing.nav.home"), path: "/" },
    { label: t("landing.nav.offer"), path: "/offer" },
    { label: t("landing.nav.contact"), path: "/contact" },
  ];

  const publicActions: MenuItem[] = [
    { label: t("landing.nav.login"), path: "/login" },
    { label: t("landing.nav.register"), path: "/register" },
  ];

  const authenticatedNav: MenuItem[] = [
    { label: t("header.menu.dashboard"), path: "/dashboard" },
    { label: t("header.menu.microcontrollers"), path: "/microcontrollers" },
    { label: t("header.menu.controllers"), path: "/providers" },
    { label: t("header.menu.schedulers"), path: "/schedulers" },
    { label: t("header.menu.account"), path: "/account" },
  ];

  if (user?.role === "admin") {
    authenticatedNav.splice(4, 0, {
      label: t("header.menu.admin"),
      path: "/admin",
    });
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    setMobileOpen(false);
  };

  const drawerItems: DrawerEntry[] = isPublic
    ? [...publicNav, { type: "divider" }, ...publicActions]
    : [...authenticatedNav, { label: t("header.menu.logout"), action: handleLogout }];

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar disableGutters sx={{ minHeight: 84 }}>
          <Box
            sx={{
              width: "100%",
              maxWidth: 1320,
              mx: "auto",
              px: { xs: 1, sm: 2, md: 4 },
              minHeight: 84,
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 1.5 },
              flexWrap: "nowrap",
            }}
          >
            <IconButton
              color="inherit"
              onClick={handleDrawerToggle}
              sx={{ display: { sm: "flex", md: "none" }, ml: 0 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component="div"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                fontWeight: 700,
                flexShrink: 0,
                whiteSpace: "nowrap",
                mr: { md: 1 },
              }}
              onClick={() => navigate("/")}
            >
              <FlashOnIcon fontSize="small" />
              {t("common.brand")}
            </Typography>

            <Box
              sx={{
                minWidth: 0,
                flexGrow: 1,
                display: { xs: "none", md: "flex" },
                gap: { md: 0.5, lg: 1 },
                justifyContent: isPublic ? "flex-start" : "flex-end",
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {(isPublic ? publicNav : authenticatedNav).map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  variant="text"
                  onClick={() => handleItemClick(item)}
                  sx={{
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    minWidth: "max-content",
                    px: { md: 1.25, lg: 1.75 },
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: { sm: 0.5, md: 1 },
                flexShrink: 0,
              }}
            >
              {isPublic ? (
                <>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/login")}
                    sx={{ borderRadius: 999, whiteSpace: "nowrap" }}
                  >
                    {t("landing.nav.login")}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/register")}
                    sx={{
                      borderRadius: 999,
                      boxShadow: "0 8px 22px rgba(15,139,111,0.35)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("landing.nav.register")}
                  </Button>
                </>
              ) : (
                <Button color="inherit" onClick={handleLogout} sx={{ whiteSpace: "nowrap" }}>
                  {t("header.menu.logout")}
                </Button>
              )}
              <LanguageSwitcher />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: 280,
            mt: "84px",
            height: "calc(100% - 84px)",
            background:
              "linear-gradient(160deg, rgba(7,20,32,0.98), rgba(9,26,38,0.96))",
            color: "#e8f1f8",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "none",
          },
        }}
      >
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t("common.brand")}
          </Typography>
          <List>
            {drawerItems.map((item, index) =>
              "type" in item ? (
                <Divider key={`divider-${index}`} sx={{ my: 1 }} />
              ) : (
                <ListItem key={item.label} disablePadding>
                  <ListItemButton onClick={() => handleItemClick(item)}>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            )}
          </List>
          <Box mt={2} display="flex" justifyContent="center">
            <LanguageSwitcher direction="row" />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
