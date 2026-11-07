"use client";

import { useApp } from "@/lib/i18n";

/** planets per zodiac sign (index 0 = Aries); null until a chart is computed. */
export type Placement = number[][] | null;
export interface PlanetInfo {
  deg: number; // degree within the sign shown in this chart
  retro: boolean;
}

interface Props {
  placement: Placement;
  ascSign: number | null;
  label: string;
  info?: PlanetInfo[];
  onPlanet?: (planet: number) => void;
}

// Planet text centre per house (North Indian) and the position of the numbered sign circle.
const NORTH_CENTERS: Record<number, [number, number]> = {
  1: [200, 100], 2: [100, 40], 3: [38, 100], 4: [95, 200], 5: [38, 300], 6: [100, 360],
  7: [200, 300], 8: [300, 360], 9: [362, 300], 10: [305, 200], 11: [362, 100], 12: [300, 40],
};
const NORTH_SIGN_AT: Record<number, [number, number]> = {
  1: [200, 183], 2: [112, 90], 3: [88, 112], 4: [183, 200], 5: [88, 288], 6: [112, 310],
  7: [200, 217], 8: [288, 310], 9: [312, 288], 10: [217, 200], 11: [312, 112], 12: [288, 90],
};
const HOUSE_LABEL_AT: Record<number, [number, number]> = {
  1: [200, 16], 2: [95, 18], 3: [16, 100], 4: [16, 205], 5: [16, 300], 6: [100, 388],
  7: [200, 388], 8: [300, 388], 9: [384, 300], 10: [384, 205], 11: [384, 100], 12: [300, 18],
};

// South Indian: fixed signs; Pisces top-left, clockwise.
const SOUTH_CELL: Record<number, [number, number]> = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3],
  5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0],
};

function Planets({ si, x, y, p, info, onPlanet }: { si: number; x: number; y: number; p: Placement; info?: PlanetInfo[]; onPlanet?: (n: number) => void }) {
  const { planetAbbr } = useApp();
  return (
    <>
      {(p?.[si] ?? []).map((pl, i) => {
        const d = info?.[pl];
        return (
          <text
            key={pl}
            x={x}
            y={y + i * 15}
            textAnchor="middle"
            className="pl"
            onClick={() => onPlanet?.(pl)}
            style={{ cursor: onPlanet ? "pointer" : "default" }}
          >
            {planetAbbr[pl]}
            {d && <tspan className="deg"> {Math.floor(d.deg)}°{d.retro ? " ʀ" : ""}</tspan>}
          </text>
        );
      })}
    </>
  );
}

export function NorthChart({ placement, ascSign, label, info, onPlanet }: Props) {
  const { t } = useApp();
  const lag = ascSign ?? 0;
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} className="chart">
      <rect className="ln" x="5" y="5" width="390" height="390" />
      <path className="ln" d="M5 5L395 395M395 5L5 395M200 5L5 200L200 395L395 200Z" />
      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
        const si = (lag + h - 1) % 12;
        const [x, y] = NORTH_CENTERS[h];
        const [sx, sy] = NORTH_SIGN_AT[h];
        const [hx, hy] = HOUSE_LABEL_AT[h];
        return (
          <g key={h}>
            <text className="hl" x={hx} y={hy} textAnchor="middle">H{h}</text>
            <circle className={"sc" + (h === 1 ? " sc1" : "")} cx={sx} cy={sy} r="11" />
            <text className={"sn" + (h === 1 ? " sn1" : "")} x={sx} y={sy + 4} textAnchor="middle">{si + 1}</text>
            <Planets si={si} x={x} y={y + 10} p={placement} info={info} onPlanet={onPlanet} />
            {h === 1 && <text className="asc" x={x} y={y - 12} textAnchor="middle">{t("ascendant")}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function SouthChart({ placement, ascSign, label, info, onPlanet }: Props) {
  const { signs } = useApp();
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} className="chart">
      <rect className="ln" x="5" y="5" width="390" height="390" />
      <path className="ln" d="M102 5V395M200 5V105M200 295V395M298 5V395M5 102H395M5 200H105M295 200H395M5 298H395" />
      {Object.entries(SOUTH_CELL).map(([k, [r, c]]) => {
        const si = Number(k);
        const x = 5 + c * 97.5;
        const y = 5 + r * 97.5;
        return (
          <g key={k}>
            <text className="sg" x={x + 5} y={y + 14}>{signs[si]}</text>
            <Planets si={si} x={x + 48} y={y + 42} p={placement} info={info} onPlanet={onPlanet} />
            {ascSign === si && <path className="asc-mark" d={`M${x} ${y}l16 0l-16 16z`} />}
          </g>
        );
      })}
    </svg>
  );
}
