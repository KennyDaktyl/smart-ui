import { TextField, TextFieldProps } from "@mui/material";

export default function FormTextField(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      variant="outlined"
      fullWidth
      sx={{
        backgroundColor: "#F5F7F9",
        borderRadius: 2,

        "& .MuiOutlinedInput-input": {
          padding: "14px 16px",
          color: "#102027",
        },

        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(0,0,0,0.12)",
        },

        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "primary.main",
        },
      }}
    />
  );
}
