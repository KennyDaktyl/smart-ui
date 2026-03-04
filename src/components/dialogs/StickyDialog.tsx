import {
  Box,
  Dialog,
  DialogTitle,
  type DialogProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: DialogProps["maxWidth"];
  fullWidth?: boolean;
  paperSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  actionsSx?: SxProps<Theme>;
};

export function StickyDialog({
  open,
  onClose,
  title,
  actions,
  children,
  maxWidth = "sm",
  fullWidth = true,
  paperSx,
  contentSx,
  titleSx,
  actionsSx,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      scroll="paper"
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100dvh - 32px)",
          overflow: "hidden",
          ...paperSx,
        },
      }}
    >
      {title != null && (
        <DialogTitle
          sx={{
            flex: "0 0 auto",
            borderBottom: "1px solid",
            borderColor: "divider",
            ...titleSx,
          }}
        >
          {title}
        </DialogTitle>
      )}

      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          px: 3,
          py: 2.5,
          "& .MuiTextField-root": {
            backgroundColor: "transparent",
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
          },
          "& .MuiFormHelperText-root": {
            minHeight: 18,
            lineHeight: 1.2,
            mt: 0.5,
          },
          ...contentSx,
        }}
      >
        {children}
      </Box>

      {actions != null && (
        <Box
          sx={{
            flex: "0 0 auto",
            borderTop: "1px solid",
            borderColor: "divider",
            px: 3,
            py: 1.5,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            bgcolor: "background.paper",
            ...actionsSx,
          }}
        >
          {actions}
        </Box>
      )}
    </Dialog>
  );
}
