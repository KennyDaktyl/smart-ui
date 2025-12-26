import { Button, ButtonProps } from "@mui/material";

interface Props extends ButtonProps {
  loading?: boolean;
}

export default function FormSubmitButton({
  loading,
  children,
  ...props
}: Props) {
  return (
    <Button
      variant="contained"
      disabled={loading}
      sx={{ mt: 1 }}
      {...props}
    >
      {children}
    </Button>
  );
}
