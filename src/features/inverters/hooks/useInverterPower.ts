import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { inverterApi } from "@/api/inverterApi";
import { useProviderLive } from "./useProviderLive";

interface UseInverterPowerArgs {
    serial: string | null;
    inverterId: number | null; 
}

interface UseInverterPowerResult {
    power: number | null;
    timestamp: string | null;
    error: string | null;

    hasWs: boolean;
    stale: boolean;
    missingData: boolean;
    countdown: number;

    loadingInitial: boolean;
}

export function useInverterPower({
    serial,
    inverterId,
}: UseInverterPowerArgs): UseInverterPowerResult {
    const { token } = useAuth();

    const [power, setPower] = useState<number | null>(null);
    const [timestamp, setTimestamp] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [hasWs, setHasWs] = useState(false);
    const [stale, setStale] = useState(false);
    const [missingData, setMissingData] = useState(false);
    const [countdown, setCountdown] = useState(180);

    const [loadingInitial, setLoadingInitial] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!token || !inverterId) return;

    const load = async () => {
        try {
            const res = await inverterApi.getDeviceProduction(token, inverterId);
            setPower(res.data?.active_power ?? null);
            setTimestamp(res.data?.timestamp ?? null);
        } catch {
            setError("Power unavailable");
        } finally {
            setLoadingInitial(false);
        }
        };

        load();
    }, [token, inverterId]);

    useProviderLive(serial ?? "", (data: any) => {
        setHasWs(true);
        setStale(false);
        setMissingData(false);
        setCountdown(180);

        if (data.status === "failed") {
        setPower(null);
        setError(data.error_message || "Power unavailable");
        return;
        }

        setPower(data.active_power);
        setTimestamp(data.timestamp ?? null);
        setError(null);
    });

    useEffect(() => {
        timerRef.current = setInterval(() => {
        setCountdown((cur) => {
            if (cur <= 1) {
            if (hasWs) {
                setStale(true);
            } else {
                setMissingData(true);
            }
            return 0;
            }
            return cur - 1;
        });
        }, 1000);
    
        return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [hasWs]);
    

    return {
        power,
        timestamp,
        error,
        hasWs,
        stale,
        missingData,
        countdown,
        loadingInitial,
    };
}
