import { Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import MapIcon from "@mui/icons-material/Map";

export default function ContactPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Kontakt
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          Opowiedz o swojej infrastrukturze – przygotujemy demo dopasowane do Twoich inwerterów i Raspberry.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <TextField label="Imię i nazwisko" fullWidth />
            <TextField label="Email" type="email" fullWidth />
            <TextField label="Telefon" type="tel" fullWidth />
            <TextField label="Opis instalacji / potrzeby" fullWidth multiline minRows={4} />
            <Button variant="contained" color="primary" sx={{ borderRadius: 10 }}>
              Wyślij zapytanie
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EmailIcon color="secondary" />
              <Box>
                <Typography variant="body2" color="rgba(232,241,248,0.85)">
                  support@smart-energy.io
                </Typography>
                <Typography variant="caption" color="rgba(232,241,248,0.65)">
                  Zapytania produktowe i demo
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PhoneIphoneIcon color="info" />
              <Box>
                <Typography variant="body2" color="rgba(232,241,248,0.85)">
                  +48 555 123 123
                </Typography>
                <Typography variant="caption" color="rgba(232,241,248,0.65)">
                  Pon-Pt, 9:00-17:00
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MapIcon color="success" />
              <Box>
                <Typography variant="body2" color="rgba(232,241,248,0.85)">
                  Warszawa / Remote
                </Typography>
                <Typography variant="caption" color="rgba(232,241,248,0.65)">
                  Wsparcie w całej Polsce
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
