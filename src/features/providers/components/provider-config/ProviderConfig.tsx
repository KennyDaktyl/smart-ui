import { Typography, Divider } from "@mui/material";
import HuaweiConfigView from "./HuaweiConfig";
import GoodWeConfigView from "./GoodWeConfig";
import RawJsonConfig from "./RawJsonConfig";

type Props = {
  vendor: string;
  config: unknown;
};

export default function ProviderConfig({ vendor, config }: Props) {
  if (!config) return null;

  switch (vendor) {
    case "huawei":
      return <HuaweiConfigView config={config as any} />;

    case "goodwe":
      return <GoodWeConfigView config={config as any} />;

    default:
      return (
        <>
          <Divider />
          <Typography variant="subtitle2" fontWeight={700}>
            Provider config (raw)
          </Typography>
          <RawJsonConfig data={config} />
        </>
      );
  }
}
