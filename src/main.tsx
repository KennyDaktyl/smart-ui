// import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./i18n/config";
import { globalStyles, solarTheme } from "./theme";
import { ToastProvider } from "./context/ToastContext";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ScrollToTop from "./features/common/components/ScrollToTop";
import RefreshWsOnRouteChange from "./features/common/components/RefreshWsOnRouteChange";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ThemeProvider theme={solarTheme}>
    <CssBaseline />
    {globalStyles}
    <BrowserRouter>
      <ScrollToTop />
      <RefreshWsOnRouteChange />
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  // </React.StrictMode>
);
