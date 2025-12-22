import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ProviderWizardInline from "./ProviderWizardInline";

type Props = {
  open: boolean;
  vendor: string;
  onComplete: (config: any, credentials?: any) => void;
  onClose: () => void;
};

export default function ProviderWizardDialog({
  open,
  vendor,
  onComplete,
  onClose,
}: Props) {
  return (
    <Dialog open={open} fullWidth maxWidth="md">
      <DialogTitle>Kreator providera</DialogTitle>

      <DialogContent dividers>
        <ProviderWizardInline
          vendor={vendor}
          onComplete={(config, credentials) =>
            onComplete(config, credentials)
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
      </DialogActions>
    </Dialog>
  );
}
