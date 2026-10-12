import { useEffect, useState } from "react";
import { ensureDataTodayLoaded, getDataToday, hasDataToday } from "./rb-api";

/**
 * The day a relative date filter counts from on this connection (`getDataToday`), and whether it
 * is known yet. A component that builds SQL waits for `ready`, so the first SQL it builds already
 * counts from the data's today and not from the browser's.
 */
export function useDataToday(connectionId: string | null | undefined): { today: string | undefined; ready: boolean } {
  const [, setLoaded] = useState(0);
  const ready = hasDataToday(connectionId);
  useEffect(() => {
    if (hasDataToday(connectionId)) return;
    let cancelled = false;
    ensureDataTodayLoaded(connectionId).then(() => { if (!cancelled) setLoaded((n) => n + 1); });
    return () => { cancelled = true; };
  }, [connectionId]);
  return { today: getDataToday(connectionId), ready };
}
