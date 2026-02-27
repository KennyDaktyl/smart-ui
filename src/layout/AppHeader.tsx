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
    { label: t("landing.nav.pricing"), path: "/pricing" },
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
        <Toolbar sx={{ minHeight: 76, gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              fontWeight: 700,
            }}
            onClick={() => navigate("/")}
          >
            <FlashOnIcon fontSize="small" />
            {t("common.brand")}
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.25,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: "rgba(211,47,47,0.18)",
                color: "#d32f2f",
              }}
            >
              {t("common.huaweiBadge")}
            </Box>
          </Typography>

          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              gap: 1,
              justifyContent: "flex-start",
            }}
          >
            {(isPublic ? publicNav : authenticatedNav).map((item) => (
              <Button
                key={item.label}
                color="inherit"
                variant="text"
                onClick={() => handleItemClick(item)}
                sx={{ fontWeight: 600 }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            {isPublic ? (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate("/login")}
                  sx={{ borderRadius: 999 }}
                >
                  {t("landing.nav.login")}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/register")}
                  sx={{ borderRadius: 999, boxShadow: "0 8px 22px rgba(15,139,111,0.35)" }}
                >
                  {t("landing.nav.register")}
                </Button>
              </>
            ) : (
              <Button color="inherit" onClick={handleLogout}>
                {t("header.menu.logout")}
              </Button>
            )}
            <LanguageSwitcher />
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
            mt: "76px",
            height: "calc(100% - 76px)",
            background:
              "linear-gradient(160deg, rgba(7,20,32,0.98), rgba(9,26,38,0.96))",
            color: "#e8f1f8",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(8px)",
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
                    <ListItemText primary={item.label} />
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
