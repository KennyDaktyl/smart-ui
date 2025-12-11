import { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import FlashOnIcon from "@mui/icons-material/FlashOn";

export default function AppHeader() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = token
    ? [
        ...(user?.role === "admin" ? [{ label: t("header.menu.admin"), path: "/admin" }] : []),
        { label: t("header.menu.installations"), path: "/dashboard" },
        { label: t("header.menu.raspberries"), path: "/raspberries" },
        { label: t("header.menu.huawei"), path: "/huawei" },
        { label: t("header.menu.account"), path: "/account" },
        { label: t("header.menu.logout"), action: handleLogout },
      ]
    : [
        { label: t("header.menu.login"), path: "/login" },
        { label: t("header.menu.register"), path: "/register" },
      ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center", p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t("common.brand")}
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => {
                if (item.action) item.action();
                else navigate(item.path);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box
        mt={2}
        display="flex"
        justifyContent="center"
        onClick={(e) => e.stopPropagation()}
      >
        <LanguageSwitcher />
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" color="primary" sx={{ mb: 3 }}>
        <Toolbar>
          {token && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1,
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
              Huawei
            </Box>
          </Typography>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
            }}
          >
            {menuItems.map((item) => (
              <Button
                key={item.label}
                color="inherit"
                onClick={() => {
                  if (item.action) item.action();
                  else navigate(item.path);
                }}
                sx={{ ml: 1 }}
              >
                {item.label}
              </Button>
            ))}
            <Box ml={2}>
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
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
