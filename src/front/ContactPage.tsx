import { Box, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import MapIcon from "@mui/icons-material/Map";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t("front.contact.title")}
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          {t("front.contact.subtitle")}
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
            <TextField label={t("front.contact.form.name")} fullWidth />
            <TextField label={t("front.contact.form.email")} type="email" fullWidth />
            <TextField label={t("front.contact.form.phone")} type="tel" fullWidth />
            <TextField
              label={t("front.contact.form.description")}
              fullWidth
              multiline
              minRows={4}
            />
            <Button variant="contained" color="primary" sx={{ borderRadius: 10 }}>
              {t("front.contact.form.submit")}
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
                  {t("front.contact.info.emailHint")}
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
                  {t("front.contact.info.phoneHint")}
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
                  {t("front.contact.info.locationHint")}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
