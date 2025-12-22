import { SyntheticEvent, useState } from "react";
import { Box, Tabs, Tab, Typography, Stack } from "@mui/material";
import { AdminUserList } from "@/features/admin/components/AdminUserList";
import { AdminMicrocontrollersList } from "@/features/admin/components/AdminMicrocontrollersList";


export default function UsersListPage() {
  const [tab, setTab] = useState("users");

  const handleChange = (_: SyntheticEvent, value: string) => {
    setTab(value);
  };

  return (
    <Box p={{ xs: 2, md: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={800}>
          Admin
        </Typography>

        <Tabs value={tab} onChange={handleChange}>
          <Tab value="users" label="Users" />
          <Tab value="microcontrollers" label="Microcontrollers" />
        </Tabs>

        {tab === "users" && <AdminUserList />}
        {tab === "microcontrollers" && <AdminMicrocontrollersList />}
      </Stack>
    </Box>
  );
}
