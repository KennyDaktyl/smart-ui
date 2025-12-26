import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <TextField
      size="small"
      placeholder={t("common.search")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
