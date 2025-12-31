import { createTheme, GlobalStyles } from "@mui/material";

/* =========================
   BRAND
========================= */
const solarGradient =
  "linear-gradient(90deg, #0f8b6f 0%, #0c5a4d 40%, #0f8b6f 100%)";

/* =========================
   THEME
========================= */
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

    success: { main: "#1fbf74" },
    error: { main: "#d32f2f" },

    /* 🔑 KLUCZOWA ZMIANA */
    text: {
      primary: "#0d1b2a",   // CIEMNY TEKST NA JASNYCH POWIERZCHNIACH
      secondary: "#475569",
    },

    background: {
      default: "#08131f",             // CIEMNE TŁO APPKI
      paper: "rgba(255,255,255,0.95)", // JASNE KARTY / ADMIN
    },

    divider: "rgba(15, 23, 42, 0.12)",
  },

  shape: {
    borderRadius: 14,
  },

  typography: {
    fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',

    h4: {
      fontWeight: 700,
      letterSpacing: "0.01em",
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },

  components: {
    /* =========================
       APP BAR
    ========================= */
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

    /* =========================
       BUTTONS
    ========================= */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
        },
        containedPrimary: {
          boxShadow: "0 6px 18px rgba(15,139,111,0.28)",
        },
        containedSecondary: {
          color: "#08131f",
          boxShadow: "0 8px 24px rgba(247,183,51,0.35)",
        },
      },
    },

    /* =========================
       PAPER / CARD
    ========================= */
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.98)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 18px 40px rgba(7,17,31,0.18)",
          color: "#0d1b2a",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid rgba(15,139,111,0.12)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          color: "#0d1b2a",
        },
      },
    },

    /* =========================
       TABS – 🔥 KLUCZOWE
    ========================= */
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 2,
          borderRadius: 2,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontWeight: 600,
          textTransform: "none",
          color: "#475569",
          "&.Mui-selected": {
            color: "#0f8b6f",
          },
        },
      },
    },

    /* =========================
       FORMS
    ========================= */
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: 12,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          color: "#0d1b2a",
          "&::placeholder": {
            color: "#64748b",
            opacity: 1,
          },
        },
        notchedOutline: {
          borderColor: "rgba(15,139,111,0.22)",
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: "#475569",
          "&.Mui-focused": {
            color: "#0f8b6f",
          },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: "#64748b",
        },
      },
    },

    /* =========================
       DRAWER
    ========================= */
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "rgba(8, 19, 31, 0.94)",
          color: "#e8f1f8",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        },
      },
    },

  },
});

/* =========================
   GLOBAL STYLES
========================= */
export const globalStyles = (
  <GlobalStyles
    styles={{
      body: {
        margin: 0,
        backgroundColor: "#08131f",
        backgroundImage: `
          radial-gradient(1200px at 85% 0%, rgba(247,183,51,0.14), transparent 50%),
          radial-gradient(900px at 10% 20%, rgba(15,139,111,0.18), transparent 40%),
          linear-gradient(115deg, rgba(9,23,38,0.92), rgba(5,12,20,0.96))
        `,
        backgroundSize: "cover",
        color: "#e8f1f8",
        minHeight: "120vh",
      },

      "#root": {
        minHeight: "100vh",
      },

      "*::selection": {
        background: "rgba(247,183,51,0.35)",
        color: "#08131f",
      },
    }}
  />
);
