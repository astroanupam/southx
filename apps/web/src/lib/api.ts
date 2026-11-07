import type { BirthProfile } from "./profiles";

export interface PlanetRow {
  body: string;
  longitude: number;
  sign: number;
  degree_in_sign: number;
  nakshatra: number;
  pada: number;
  navamsha_sign: number;
  retrograde: boolean;
  house: number;
}

export interface ChartResult {
  engine: string;
  ayanamsha: { code: string; value: number };
  nodes: string;
  ascendant: PlanetRow;
  planets: PlanetRow[];
}

export type ChartError = "notValidated" | "range" | "other" | "engineFail";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The engine (Python + Skyfield + JPL ephemeris) runs in a Web Worker inside the browser.
let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: { chart?: ChartResult; error?: ChartError }) => void; onLoading?: () => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(`${BASE_PATH}/engine/worker.js`, { type: "module" });
    worker.onmessage = (e: MessageEvent) => {
      const { id, status, result, fatal } = e.data as { id: number; status?: string; result?: { chart?: ChartResult; error?: string }; fatal?: string };
      const p = pending.get(id);
      if (!p) return;
      if (status === "loading") return p.onLoading?.();
      pending.delete(id);
      if (fatal) return p.resolve({ error: "engineFail" });
      p.resolve(result?.chart ? { chart: result.chart } : { error: (result?.error as ChartError) ?? "other" });
    };
    worker.onerror = () => {
      for (const p of pending.values()) p.resolve({ error: "engineFail" });
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

export function computeChart(p: BirthProfile, onLoading?: () => void): Promise<{ chart?: ChartResult; error?: ChartError }> {
  return new Promise((resolve) => {
    const id = ++seq;
    pending.set(id, { resolve, onLoading });
    getWorker().postMessage({
      id,
      request: {
        utc_instant: p.resolved.utcIso,
        latitude: p.place.lat,
        longitude: p.place.lon,
        ayanamsha: p.settings.ayanamsha,
        nodes: p.settings.nodes,
      },
    });
  });
}

/** Planets grouped by sign index for the chart components (D-1 or D-9). */
export function placementFor(chart: ChartResult, div: "d1" | "d9"): number[][] {
  const out: number[][] = Array.from({ length: 12 }, () => []);
  chart.planets.forEach((p, i) => out[div === "d1" ? p.sign : p.navamsha_sign].push(i));
  return out;
}

export function fmtDms(deg: number): string {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = ((mf - m) * 60).toFixed(2).padStart(5, "0");
  return `${d}° ${String(m).padStart(2, "0")}′ ${s}″`;
}
