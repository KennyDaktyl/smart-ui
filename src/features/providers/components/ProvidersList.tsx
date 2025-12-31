import { Box } from "@mui/material";
import { memo } from "react";
import UserProviderCard from "./UserProviderCard";
import { ProviderResponse } from "../types/userProvider";

type Props = {
  providers: ProviderResponse[];
};

function ProvidersList({ providers }: Props) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="repeat(auto-fill, minmax(380px, 1fr))"
      gap={2}
    >
      {providers.map((provider) => (
        <UserProviderCard
          key={provider.uuid}
          provider={provider}
        />
      ))}
    </Box>
  );
}

export default memo(ProvidersList);
