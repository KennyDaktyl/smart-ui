import UserProviderCard from "@/features/providers/components/UserProviderCard";
import { useProvidersLive } from "@/features/providers/hooks/useProvidersLive";
import { ProviderResponse } from "@/features/providers/types/userProvider";
import { Stack } from "@mui/material";

type Props = {
  providers: ProviderResponse[];
};

export default function ProvidersList({ providers }: Props) {
  const liveState = useProvidersLive(providers);

  return (
    <Stack spacing={2}>
      {providers.map((provider) => (
        <UserProviderCard
          key={provider.uuid}
          provider={provider}
          live={liveState[provider.uuid]}
        />
      ))}
    </Stack>
  );
}
