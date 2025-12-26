import { Tabs, Tab, Box } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ProfileTab from "./ProfileTab";
import ChangePasswordTab from "./ChangePasswordTab";

export default function AccountTabs() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);

  return (
    <>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={t("account.tabs.profile")} />
        <Tab label={t("account.tabs.password")} />
        <Tab label={t("account.tabs.payments")} disabled />
      </Tabs>

      <Box>
        {tab === 0 && <ProfileTab />}
        {tab === 1 && <ChangePasswordTab />}
      </Box>
    </>
  );
}
