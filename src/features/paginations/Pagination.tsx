import { Button, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface Props {
  offset: number;
  limit: number;
  total: number;
  count: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({
  offset,
  limit,
  total,
  count,
  onPrev,
  onNext,
}: Props) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Button
          startIcon={<ChevronLeftIcon />}
          onClick={onPrev}
          disabled={offset === 0}
        >
          Prev
        </Button>

        <Button
          endIcon={<ChevronRightIcon />}
          onClick={onNext}
          disabled={count < limit}
        >
          Next
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Showing {count} of {total}
      </Typography>
    </Stack>
  );
}