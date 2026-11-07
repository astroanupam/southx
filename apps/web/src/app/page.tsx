"use client";
/* eslint-disable react-hooks/set-state-in-effect -- load encrypted profiles / recompute chart on selection */

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, type Lang } from "@/lib/i18n";
import AuthGate from "@/components/AuthGate";
import BirthForm from "@/components/BirthForm";
import { NorthChart, SouthChart, type PlanetInfo } from "@/components/Charts";
import PlanetTable from "@/components/PlanetTable";
import { computeChart, fmtDms, placementFor, type ChartError, type ChartResult } from "@/lib/api";
import { duplicate, mergeImported, remove, upsert, type BirthProfile } from "@/lib/profiles";
import { deleteAccount, exportBackup, loadProfiles, parseBackup, saveProfiles, type Session } from "@/lib/vault";

const AYAN_NAME: Record<string, string> = { true_chitra: "True Chitra" };

function short(deg: number) {
  return `${Math.floor(deg)}°${String(Math.floor((deg % 1) * 60)).padStart(2, "0")}′`;
}

function Dashboard({ session, signOut }: { session: Session; signOut: () => void }) {
  const { t, lang, setLang, theme, toggleTheme, planets, signs, nakshatras } = useApp();
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<"north" | "south">("north");
  const [div, setDiv] = useState<"d1" | "d9">("d1");
  const [chart, setChart] = useState<ChartResult | null>(null);
  const [chartErr, setChartErr] = useState<ChartError | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingEngine, setLoadingEngine] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfiles(session).then(setProfiles).catch(() => setProfiles([]));
  }, [session]);

  const active = profiles.find((p) => p.id === activeId) ?? null;
  const shown = profiles.filter((p) => (p.name + p.place.text).toLowerCase().includes(query.toLowerCase()));

  async function commit(next: BirthProfile[]) {
    setProfiles(next);
    await saveProfiles(session, next);
  }
  function save(p: BirthProfile) {
    commit(upsert(profiles, p));
    setActiveId(p.id);
  }

  useEffect(() => {
    setPicked(null);
    if (!active) {
      setChart(null);
      setChartErr(null);
      return;
    }
    let live = true;
    setBusy(true);
    computeChart(active, () => live && setLoadingEngine(true)).then((r) => {
      if (!live) return;
      setBusy(false);
      setLoadingEngine(false);
      setChart(r.chart ?? null);
      setChartErr(r.error ?? null);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.version]);

  const info: PlanetInfo[] | undefined = useMemo(
    () =>
      chart?.planets.map((p) => ({
        deg: div === "d1" ? p.degree_in_sign : ((p.longitude % 30) % (30 / 9)) * 9,
        retro: p.retrograde && p.body !== "Rahu" && p.body !== "Ketu",
      })),
    [chart, div],
  );

  function download() {
    const blob = new Blob([exportBackup(profiles)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `astrosutras-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const list = parseBackup(await f.text());
    if (!list) return setNote(t("importBad"));
    await commit(mergeImported(profiles, list));
    setNote(t("importOk"));
  }

  const chartLabel = `${style === "north" ? t("north") : t("south")} ${div === "d1" ? t("rashiChart") : t("navamshaChart")}`;
  const Chart = style === "north" ? NorthChart : SouthChart;
  const sun = chart?.planets[0];
  const moon = chart?.planets[1];
  const placeLabel = active ? active.place.text || active.place.tz : "";

  return (
    <>
      <header className="top">
        <div className="brand">
          <div className="logo" aria-hidden="true">✦</div>
          <div>
            <div className="kicker">{t("tagline")}</div>
            <h1>AstroSutras</h1>
            <div className="sub">{t("subtitle")}</div>
          </div>
        </div>
        <div className="tools">
          <span className="muted who">{t("signedInAs")} {session.username}</span>
          <label className="sr" htmlFor="lang">{t("language")}</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="gu">ગુજરાતી</option>
          </select>
          <button type="button" onClick={toggleTheme} aria-label={t("theme")}>
            {theme === "dark" ? "☀ " + t("light") : "🌙 " + t("dark")}
          </button>
          <button type="button" onClick={signOut}>{t("signOut")}</button>
        </div>
      </header>

      <div className="wrap">
        <section className="card">
          <div className="head">
            <div className="icon" aria-hidden="true">❖</div>
            <div className="grow">
              <h3>{t("savedCharts")}</h3>
              <p>{t("authNote")}</p>
            </div>
            <button type="button" className="primary" onClick={() => setActiveId(null)}>＋ {t("newProfile")}</button>
          </div>
          <div className="row">
            <input aria-label={t("search")} placeholder={t("search")} value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 320 }} />
            <button type="button" onClick={download}>{t("exportData")}</button>
            <button type="button" onClick={() => fileRef.current?.click()}>{t("importData")}</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("confirmDeleteAccount"))) {
                  deleteAccount(session);
                  signOut();
                }
              }}
            >
              {t("deleteAccount")}
            </button>
            {note && <span className="muted" role="status">{note}</span>}
          </div>
          {shown.length === 0 && <p className="muted">{t("noProfiles")}</p>}
          <div className="chips">
            {shown.map((p) => (
              <div key={p.id} className={"chip " + (p.id === activeId ? "on" : "")}>
                <button type="button" className="link" onClick={() => setActiveId(p.id)}>
                  <b>{p.name}</b>
                  <span className="muted" style={{ display: "block" }}>{p.dob} · {p.place.text || p.place.tz}</span>
                </button>
                <div className="acts">
                  <button type="button" onClick={() => commit(duplicate(profiles, p.id))}>{t("duplicate")}</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("confirmDelete"))) {
                        commit(remove(profiles, p.id));
                        if (activeId === p.id) setActiveId(null);
                      }
                    }}
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="two">
          <section className="panel">
            <div className="head">
              <div className="icon" aria-hidden="true">◎</div>
              <div>
                <h2>{t("birthDetails")}</h2>
                <p>{t("birthDataDesc")}</p>
              </div>
            </div>
            <BirthForm initial={active} onSave={save} />
          </section>

          <section className="panel">
            <div className="head">
              <div className="icon" aria-hidden="true">☉</div>
              <div className="grow">
                <h2>{t("lagnaChart")} ({div === "d1" ? "D-1" : "D-9"}) · {style === "north" ? t("north") : t("south")}</h2>
                <p>{[placeLabel, chart ? `${signs[chart.ascendant.sign]} ${t("ascendant")}` : "", t("wholeSign")].filter(Boolean).join(" · ")}</p>
              </div>
              {style === "north" && <span className="pill">{t("housesRun")}</span>}
            </div>
            <div className="row">
              <button type="button" className={style === "north" ? "on" : ""} onClick={() => setStyle("north")}>{t("north")}</button>
              <button type="button" className={style === "south" ? "on" : ""} onClick={() => setStyle("south")}>{t("south")}</button>
              <span className="grow" />
              <button type="button" className={div === "d1" ? "on" : ""} onClick={() => setDiv("d1")}>D-1</button>
              <button type="button" className={div === "d9" ? "on" : ""} onClick={() => setDiv("d9")}>D-9</button>
            </div>
            <div className="chartgrid">
              <div>
                <Chart
                  placement={chart ? placementFor(chart, div) : null}
                  ascSign={chart ? (div === "d1" ? chart.ascendant.sign : chart.ascendant.navamsha_sign) : null}
                  label={chartLabel}
                  info={info}
                  onPlanet={(i) => setPicked(i)}
                />
                {busy && <p className="muted center">{loadingEngine ? t("engineLoading") : t("computing")}</p>}
                {chartErr === "engineFail" && <p className="err center">{t("engineFail")}</p>}
                {chartErr === "notValidated" && <p className="warn center">{t("optionNotValidated")}</p>}
                {chartErr === "range" && <p className="err center">{t("rangeNote")}</p>}
                {!chart && !chartErr && !busy && <p className="muted center">{t("rangeNote")}</p>}
              </div>
              <div>
                <div className="legend">
                  <h4>{t("readingChart").toUpperCase()}</h4>
                  <p>{t("legendSign")}</p>
                  <p>{t("legendHouse")}</p>
                  <p>{t("legendRetro")}</p>
                </div>
                <div className="legend" style={{ marginTop: 10 }}>
                  {picked !== null && chart ? (
                    <>
                      <h4>{planets[picked].toUpperCase()}</h4>
                      <p>
                        {fmtDms(chart.planets[picked].longitude)} · {signs[chart.planets[picked].sign]} · {t("house")} {chart.planets[picked].house}
                        {chart.planets[picked].retrograde ? " · ʀ" : ""}
                      </p>
                      <p>{nakshatras[chart.planets[picked].nakshatra]} {t("pada")} {chart.planets[picked].pada} · {t("navamsha")} {signs[chart.planets[picked].navamsha_sign]}</p>
                    </>
                  ) : (
                    <p>{t("tapHint")}</p>
                  )}
                </div>
              </div>
            </div>

            {chart && sun && moon && active && (
              <div className="tiles">
                <div className="tile"><div className="k">{t("tLagna")}</div><div className="v">{signs[chart.ascendant.sign]} <small>{short(chart.ascendant.degree_in_sign)}</small></div></div>
                <div className="tile"><div className="k">{t("tMoon")}</div><div className="v">{signs[moon.sign]} <small>{short(moon.degree_in_sign)}</small></div></div>
                <div className="tile"><div className="k">{t("tStar")}</div><div className="v">{nakshatras[moon.nakshatra]} <small>{t("pada")} {moon.pada}</small></div></div>
                <div className="tile"><div className="k">{t("tSun")}</div><div className="v">{signs[sun.sign]} <small>{short(sun.degree_in_sign)}</small></div></div>
                <div className="tile"><div className="k">{t("tAyan")}</div><div className="v">{AYAN_NAME[chart.ayanamsha.code] ?? chart.ayanamsha.code} <small>{short(chart.ayanamsha.value)}</small></div></div>
                <div className="tile"><div className="k">{t("tInstant")}</div><div className="v">{active.resolved.utcIso.slice(0, 16).replace("T", " ")}</div></div>
              </div>
            )}
          </section>
        </div>

        {chart && (
          <details className="card" open>
            <summary>{t("placements")}</summary>
            <p className="muted">{t("ayanamshaUsed")}: {chart.ayanamsha.code} {fmtDms(chart.ayanamsha.value)} · {t("engineOn")}</p>
            <PlanetTable chart={chart} selected={picked} onSelect={setPicked} />
          </details>
        )}

        <div className="cards3">
          {(["dignity", "yogi", "dagdha", "karma", "dasha", "transit"] as const).map((k) => (
            <div className="card" key={k}>
              <h3>{t(k)} <span className="badge">{t("pending")}</span></h3>
              <div className="muted">{t("notEnabled")}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return <AuthGate>{(session, signOut) => <Dashboard session={session} signOut={signOut} />}</AuthGate>;
}
