"use client";

import { useApp } from "@/lib/i18n";
import locEn from "@/locales/en.json";
import locHi from "@/locales/hi.json";
import locGu from "@/locales/gu.json";
import { fmtDms, type ChartResult, type PlanetRow } from "@/lib/api";

const NAK = { en: locEn.astro.nakshatras, hi: locHi.astro.nakshatras, gu: locGu.astro.nakshatras };

export default function PlanetTable({ chart, selected, onSelect }: { chart: ChartResult; selected: number | null; onSelect: (i: number) => void }) {
  const { t, lang, signs, planets } = useApp();
  const nak = NAK[lang];
  const rows: [string, PlanetRow, number | null][] = [
    [t("ascendant"), chart.ascendant, null],
    ...chart.planets.map((p, i) => [planets[i], p, i] as [string, PlanetRow, number]),
  ];
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>{t("planet")}</th><th>{t("longitude")}</th><th>{t("rashi")}</th><th>{t("degree")}</th>
            <th>{t("house")}</th><th>{t("nakshatra")}</th><th>{t("pada")}</th><th>{t("navamsha")}</th><th>{t("retro")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, p, idx]) => (
            <tr key={label} className={idx !== null && idx === selected ? "sel" : ""} onClick={() => idx !== null && onSelect(idx)}>
              <td>{label}</td>
              <td>{fmtDms(p.longitude)}</td>
              <td>{signs[p.sign]}</td>
              <td>{fmtDms(p.degree_in_sign)}</td>
              <td>{p.house}</td>
              <td>{nak[p.nakshatra]}</td>
              <td>{p.pada}</td>
              <td>{signs[p.navamsha_sign]}</td>
              <td>{p.retrograde ? "R" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
