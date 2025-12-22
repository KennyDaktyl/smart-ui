import { Tabs, Tab } from "@mui/material";

import type { ProviderType } from "@/features/providers/types/provider";

type ProviderTypeSelectorProps = {
  types: Array<{ type: ProviderType }>;
  selectedType: ProviderType | "";
  onSelect: (type: ProviderType) => void;
};

export default function ProviderTypeSelector({
  types,
  selectedType,
  onSelect,
}: ProviderTypeSelectorProps) {
  return (
    <Tabs
      value={selectedType}
      onChange={(_, value) => onSelect(value as ProviderType)}
      sx={{
        "& .MuiTab-root": { color: "rgba(13,27,42,0.65)" },
        "& .Mui-selected": { color: "#0d1b2a" },
        "& .MuiTabs-indicator": { backgroundColor: "#0f8b6f" },
      }}
    >
      {types.map((item) => (
        <Tab key={item.type} value={item.type} label={item.type.toUpperCase()} />
      ))}
    </Tabs>
  );
}
