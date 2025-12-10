import { createTheme, GlobalStyles } from "@mui/material";

const solarGradient =
  "linear-gradient(90deg, #0f8b6f 0%, #0c5a4d 40%, #0f8b6f 100%)";

export const solarTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      light: "#33b893",
      main: "#0f8b6f",
      dark: "#0c5a4d",
    },
    secondary: {
      light: "#ffd56b",
      main: "#f7b733",
      dark: "#c58a00",
    },
    error: { main: "#d32f2f" },
    success: { main: "#1fbf74" },
    text: {
      primary: "#e8f1f8",
      secondary: "rgba(232, 241, 248, 0.72)",
    },
    background: {
      default: "#08131f",
      paper: "rgba(255,255,255,0.92)",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Roboto","Inter","Helvetica","Arial",sans-serif',
    h4: { fontWeight: 700, letterSpacing: "0.01em" },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: solarGradient,
          boxShadow: "0 12px 32px rgba(0,0,0,0.24)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backdropFilter: "saturate(160%) blur(10px)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
          boxShadow: "0 6px 18px rgba(15,139,111,0.24)",
        },
        containedSecondary: {
          color: "#08131f",
          boxShadow: "0 8px 24px rgba(247,183,51,0.35)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 18px 40px rgba(7,17,31,0.18)",
          color: "#0d1b2a",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(245,252,248,0.96) 100%)",
          border: "1px solid rgba(15,139,111,0.12)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          color: "#0d1b2a",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "rgba(8, 19, 31, 0.92)",
          color: "#e8f1f8",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "inherit",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 12,
          color: "#0d1b2a",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          color: "#0d1b2a",
          "&::placeholder": {
            color: "#546579",
            opacity: 0.95,
          },
        },
        notchedOutline: {
          borderColor: "rgba(15,139,111,0.16)",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "#4a5a6a",
          "&.Mui-focused": {
            color: "#0f8b6f",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: "#4a5a6a",
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: "#5b6b7c",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.08)",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.16)",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          "&.Mui-selected": {
            backgroundColor: "rgba(247, 183, 51, 0.14)",
          },
        },
      },
    },
  },
});

export const globalStyles = (
  <GlobalStyles
    styles={{
      body: {
        margin: 0,
        backgroundColor: "#08131f",
        backgroundImage: `
          radial-gradient(1200px at 85% 0%, rgba(247, 183, 51, 0.14), transparent 50%),
          radial-gradient(900px at 10% 20%, rgba(15, 139, 111, 0.18), transparent 40%),
          linear-gradient(115deg, rgba(9, 23, 38, 0.92), rgba(5, 12, 20, 0.96)),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "cover, cover, cover, 120px 120px, 120px 120px",
        color: "#e8f1f8",
        minHeight: "100vh",
      },
      "*::selection": {
        background: "rgba(247,183,51,0.35)",
        color: "#08131f",
      },
      "#root": {
        minHeight: "100vh",
      },
      ".glass-panel": {
        background: "rgba(255,255,255,0.98)",
        borderRadius: 14,
        border: "1px solid rgba(15,139,111,0.12)",
        boxShadow: "0 16px 38px rgba(0,0,0,0.12)",
      },
    }}
  />
);
