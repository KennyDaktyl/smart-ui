import { Typography, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAccount } from "@/features/users/hooks/useAccount";
import AccountHeader from "@/features/users/components/AccountHeader";
import AccountTabs from "@/features/users/components/AccountTabs";
import LoadingOverlay from "@/features/common/components/LoadingOverlay";

export default function AccountPage() {
  const { t } = useTranslation();
  const { data, loading } = useAccount();

  return (
    <Stack spacing={2.5} sx={{ width: "100%", minWidth: 0 }}>
      <Typography variant="h4" mb={3}>
        {t("account.title")}
      </Typography>

      <LoadingOverlay
        loading={loading}
        keepChildrenMounted={Boolean(data)}
        minHeight={220}
      >
        {!data ? (
          <Typography color="text.secondary">
            {t("account.missingUser")}
          </Typography>
        ) : (
          <Stack spacing={3}>
            <AccountHeader
              email={data.email}
              role={data.role}
              createdAt={data.created_at}
            />

            <AccountTabs />
          </Stack>
        )}
      </LoadingOverlay>
    </Stack>
  );
}
