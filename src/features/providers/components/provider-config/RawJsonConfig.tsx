import { Box } from "@mui/material";

export default function RawJsonConfig({ data }: { data: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        mt: 1,
        p: 1.5,
        borderRadius: 1,
        bgcolor: "grey.100",
        fontSize: 12,
        fontFamily: "monospace",
        overflowX: "auto",
        maxHeight: 300,
      }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );
}
