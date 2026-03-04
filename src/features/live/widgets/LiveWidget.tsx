import type { DeviceLiveWidgetProps } from "./DeviceLiveWidget";
import { DeviceLiveWidget } from "./DeviceLiveWidget";
import type { MicrocontrollerLiveWidgetProps } from "./MicrocontrollerLiveWidget";
import { MicrocontrollerLiveWidget } from "./MicrocontrollerLiveWidget";
import type { ProviderLiveWidgetProps } from "./ProviderLiveWidget";
import { ProviderLiveWidget } from "./ProviderLiveWidget";

type ProviderSourceProps = ProviderLiveWidgetProps & {
  source: "provider";
};

type MicrocontrollerSourceProps = MicrocontrollerLiveWidgetProps & {
  source: "microcontroller";
};

type DeviceSourceProps = DeviceLiveWidgetProps & {
  source: "device";
};

export type LiveWidgetProps =
  | ProviderSourceProps
  | MicrocontrollerSourceProps
  | DeviceSourceProps;

export function LiveWidget(props: LiveWidgetProps) {
  if (props.source === "provider") {
    const { source, ...rest } = props;
    return <ProviderLiveWidget {...rest} />;
  }

  if (props.source === "microcontroller") {
    const { source, ...rest } = props;
    return <MicrocontrollerLiveWidget {...rest} />;
  }

  const { source, ...rest } = props;
  return <DeviceLiveWidget {...rest} />;
}
