import UserProviderCard from "@/features/providers/components/UserProviderCard";
import { useProvidersLive } from "@/features/providers/hooks/useProvidersLive";
import { ProviderResponse } from "@/features/providers/types/userProvider";
import { Stack } from "@mui/material";
import { useMemo } from "react";

type Props = {
  providers: ProviderResponse[];
  onProviderEnabledChange: (uuid: string, enabled: boolean) => void;
};

export default function ProvidersList({ 
  providers,
  onProviderEnabledChange
}: Props) {

  const enabledProviders = useMemo(
    () => providers.filter((p) => p.enabled),
    [providers]
  );
  
  const liveState = useProvidersLive(enabledProviders);

  return (
    <Stack direction="row" spacing={2}>
      {providers.map((provider) => (
        <UserProviderCard
          key={provider.uuid}
          provider={provider}
          live={
            provider.enabled
              ? liveState[provider.uuid]
              : undefined
          }
          onEnabledChange={onProviderEnabledChange}
        />
      ))}
    </Stack>
  );
}
