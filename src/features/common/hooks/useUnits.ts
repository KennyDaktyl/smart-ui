import { useEffect, useState } from "react";
import { enumsApi } from "@/api/enumsApi";
import { EnumOption } from "@/features/common/types/enumOption";
import { parseApiError, ParsedApiError } from "@/api/parseApiError";

export function useUnits() {
  const [data, setData] = useState<EnumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await enumsApi.getUnits();
        if (mounted) {
          setData(res.data);
        }
      } catch (err) {
        if (mounted) {
          setError(parseApiError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
