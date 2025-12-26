import { Box, Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAccount } from "@/features/users/hooks/useAccount";
import AccountHeader from "@/features/users/components/AccountHeader";
import AccountTabs from "@/features/users/components/AccountTabs";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";

export default function AccountPage() {
  const { t } = useTranslation();
  const { data, loading } = useAccount();

  if (loading) return <CenteredSpinner />;

  if (!data) {
    return (
      <Typography color="text.secondary">
        {t("account.missingUser")}
      </Typography>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        {t("account.title")}
      </Typography>

      <Stack spacing={3}>
        <AccountHeader
          email={data.email}
          role={data.role}
          createdAt={data.created_at}
        />

        <AccountTabs />
      </Stack>
    </Box>
  );
}
