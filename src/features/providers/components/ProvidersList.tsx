import UserProviderCard from "@/features/providers/components/UserProviderCard";
import { ProviderResponse } from "@/features/providers/types/userProvider";
import { Stack } from "@mui/material";
import { ProviderLiveEnergy } from "@/features/providers/live/ProviderLiveEnergy";

type Props = {
  providers: ProviderResponse[];
  onProviderEnabledChange: (uuid: string, enabled: boolean) => void;
};

export default function ProvidersList({
  providers,
  onProviderEnabledChange,
}: Props) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="stretch"
    >
      {providers.map((provider) => (
        <ProviderLiveEnergy key={provider.uuid} provider={provider}>
          {(live) => (
            <UserProviderCard
              provider={provider}
              live={provider.enabled ? live : undefined}
              onEnabledChange={onProviderEnabledChange}
            />
          )}
        </ProviderLiveEnergy>
      ))}
    </Stack>
  );
}
