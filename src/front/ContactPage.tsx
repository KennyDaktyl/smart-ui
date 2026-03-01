import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useTranslation } from "react-i18next";
import { publicContactApi } from "@/api/publicContactApi";
import { parseApiError } from "@/api/parseApiError";

export default function ContactPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!subject.trim() || !email.trim() || !description.trim()) {
      setErrorMessage(t("contact.form.validationRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await publicContactApi.sendLead({
        subject: subject.trim(),
        email: email.trim(),
        message: description.trim(),
      });

      setSuccessMessage(t("contact.form.success"));
      setSubject("");
      setEmail("");
      setDescription("");
    } catch (error) {
      setErrorMessage(
        parseApiError(error).message || t("contact.form.error")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ width: "100%", maxWidth: 1320, mx: "auto" }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} mb={1}>
              {t("contact.title")}
            </Typography>
            <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
              {t("contact.subtitle")}
            </Typography>
          </Box>

          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, md: 9, lg: 8 }}>
              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                autoComplete="off"
                sx={{
                  width: "100%",
                  p: { xs: 2.25, md: 3.25 },
                  borderRadius: 3,
                  background:
                    "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.65,
                  "& .MuiFormControl-root": {
                    width: "100%",
                  },
                }}
              >
                {successMessage && <Alert severity="success">{successMessage}</Alert>}
                {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                <TextField
                  label={t("contact.form.email")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  label={t("contact.form.subject")}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                />
                <TextField
                  label={t("contact.form.description")}
                  multiline
                  minRows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  sx={{ borderRadius: 10, mt: 1, alignSelf: "flex-start", px: 3 }}
                >
                  {submitting ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress color="inherit" size={18} />
                      <span>{t("contact.form.submitting")}</span>
                    </Stack>
                  ) : (
                    t("contact.form.submit")
                  )}
                </Button>
              </Box>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 3, lg: 4 }}>
              <Stack spacing={2} sx={{ p: { xs: 1, md: 0.5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LinkedInIcon color="info" />
                  <Box>
                    <Typography variant="body2" color="rgba(232,241,248,0.9)" fontWeight={700}>
                      LinkedIn
                    </Typography>
                    <Link
                      href="https://www.linkedin.com/in/micha%C5%82-pielak/"
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      color="secondary.light"
                      sx={{ wordBreak: "break-all", fontSize: "0.92rem" }}
                    >
                      linkedin.com/in/michal-pielak
                    </Link>
                  </Box>
                </Stack>

                <Typography variant="body2" color="rgba(232,241,248,0.75)">
                  {t("contact.info.directContactNote")}
                </Typography>
              </Stack>
            </Grid2>
          </Grid2>
        </Stack>
      </Box>
    </Stack>
  );
}
