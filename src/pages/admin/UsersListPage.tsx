import { useEffect, useState } from "react";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    axiosClient.get("/admin/users").then((res) => setUsers(res.data));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>{t("admin.usersTitle")}</Typography>
      {users.map((u: any) => (
        <Card key={u.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6">{u.email}</Typography>
            <Typography variant="body2">{t("admin.role", { role: u.role })}</Typography>
            <Button variant="outlined" sx={{ mt: 1 }} onClick={() => navigate(`/admin/users/${u.id}/installations`)}>
              {t("admin.viewInstallations")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
