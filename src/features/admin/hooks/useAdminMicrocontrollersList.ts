import { useCallback, useEffect, useState } from "react";

import { adminApi } from "@/api/adminApi";
import { parseApiError } from "@/api/parseApiError";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

type Params = {
  limit: number;
  offset: number;
  search?: string;
};

export function useAdminMicrocontrollersList({ limit, offset, search }: Params) {
  const [items, setItems] = useState<MicrocontrollerResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await adminApi.getMicrocontrollers({
        limit,
        offset,
        search: search?.trim() ? search : undefined,
      });

      setItems(res.data.items);
      setTotal(res.data.meta.total);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, search]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    total,
    loading,
    error,
    reload: load,
  };
}
