"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional: hydrate from browser storage / reset form on selection */

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/i18n";
import { formatOffset, isValidTimeZone, parseOffset, resolveCivilTime, type ResolvedTime } from "@/lib/tz";
import { newId, type BirthProfile, type CalcSettings } from "@/lib/profiles";

const AYANAMSHAS = [
  ["true_chitra", "True Chitra Paksha (Spica 0° Libra)"],
  ["lahiri", "Lahiri / Chitrapaksha"],
  ["raman", "Raman"],
  ["kp", "Krishnamurti (KP)"],
  ["yukteswar", "Yukteswar"],
  ["pushya_paksha", "Pushya Paksha"],
  ["fagan_bradley", "Fagan-Bradley"],
] as const;

interface Props {
  initial: BirthProfile | null;
  onSave: (p: BirthProfile) => void;
}

function parseDob(text: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}

function F({ id, label, err, children }: { id: string; label: string; err?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {err && <div className="err" role="alert">{err}</div>}
    </div>
  );
}

export default function BirthForm({ initial, onSave }: Props) {
  const { t } = useApp();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<BirthProfile["gender"]>("");
  const [dob, setDob] = useState("");
  const [clock, setClock] = useState<"24" | "12">("24");
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");
  const [ss, setSs] = useState("0");
  const [ampm, setAmpm] = useState<"am" | "pm">("am");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [tz, setTz] = useState("Asia/Kolkata");
  const [useManual, setUseManual] = useState(false);
  const [manualOffset, setManualOffset] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [ayanamsha, setAyanamsha] = useState("true_chitra");
  const [nodes, setNodes] = useState<"mean" | "true">("mean");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");
    setErrors({});
    if (!initial) {
      setName(""); setGender(""); setDob(""); setHh(""); setMm(""); setSs("0"); setClock("24");
      setCountry(""); setState(""); setCity(""); setLat(""); setLon(""); setTz("Asia/Kolkata");
      setUseManual(false); setManualOffset(""); setManualReason("");
      setAyanamsha("true_chitra"); setNodes("mean"); setNotes("");
      return;
    }
    setName(initial.name); setGender(initial.gender); setDob(initial.dob);
    setClock("24"); setHh(String(initial.time.h)); setMm(String(initial.time.m)); setSs(String(initial.time.s));
    setCountry(initial.place.country); setState(initial.place.state); setCity(initial.place.city);
    setLat(String(initial.place.lat)); setLon(String(initial.place.lon)); setTz(initial.place.tz);
    const man = initial.resolved.source === "manual";
    setUseManual(man);
    setManualOffset(man ? formatOffset(initial.resolved.offsetSec) : "");
    setManualReason(initial.resolved.manualReason ?? "");
    setAyanamsha(initial.settings.ayanamsha); setNodes(initial.settings.nodes); setNotes(initial.notes);
  }, [initial]);

  // Convert entered clock to 24h integers
  const time24 = useMemo(() => {
    const h = Number(hh), m = Number(mm), s = Number(ss || 0);
    if (hh === "" || mm === "" || ![h, m, s].every(Number.isInteger)) return null;
    if (m < 0 || m > 59 || s < 0 || s > 59) return null;
    if (clock === "12") {
      if (h < 1 || h > 12) return null;
      return { h: (h % 12) + (ampm === "pm" ? 12 : 0), m, s };
    }
    if (h < 0 || h > 23) return null;
    return { h, m, s };
  }, [hh, mm, ss, clock, ampm]);

  const { resolved, resolveError } = useMemo(() => {
    const d = parseDob(dob);
    if (!d || !time24 || !isValidTimeZone(tz)) return { resolved: null as ResolvedTime | null, resolveError: "" };
    if (d.y < 1850 || d.y > 2149) return { resolved: null, resolveError: t("dateRange") };
    let manual: { offsetSec: number; reason: string } | undefined;
    if (useManual) {
      const off = parseOffset(manualOffset);
      if (off === null) return { resolved: null, resolveError: t("invalidOffset") };
      manual = { offsetSec: off, reason: manualReason };
    }
    try {
      return {
        resolved: resolveCivilTime({ year: d.y, month: d.m, day: d.d, hour: time24.h, minute: time24.m, second: time24.s }, tz, manual),
        resolveError: "",
      };
    } catch {
      return { resolved: null, resolveError: t("invalidTz") };
    }
  }, [dob, time24, tz, useManual, manualOffset, manualReason, t]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!name.trim()) er.name = t("required");
    if (!parseDob(dob)) er.dob = t("invalidDate");
    if (!time24) er.time = t("invalidTime");
    const la = Number(lat), lo = Number(lon);
    if (lat === "" || lon === "" || !(la >= -90 && la <= 90) || !(lo >= -180 && lo <= 180)) er.coords = t("invalidCoords");
    if (!isValidTimeZone(tz)) er.tz = t("invalidTz");
    if (useManual && parseOffset(manualOffset) === null) er.offset = t("invalidOffset");
    if (resolveError) er.tz = er.tz ?? resolveError;
    setErrors(er);
    if (Object.keys(er).length || !resolved || !time24) return;

    const settings: CalcSettings = { ayanamsha, nodes, houseSystem: "whole_sign" };
    const now = new Date().toISOString();
    onSave({
      id: initial?.id ?? newId(),
      version: initial?.version ?? 1,
      name: name.trim(),
      gender,
      dob: dob.trim(),
      time: time24,
      place: { text: [city, state, country].filter(Boolean).join(", "), country, state, city, lat: la, lon: lo, tz },
      resolved,
      settings,
      notes,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
    setMsg(t("saved"));
  }


  return (
    <form onSubmit={submit} noValidate>
      <div className="card">
        <h3>{t("birthDetails")}</h3>
        <F id="name" label={t("name")} err={errors.name}><input id="name" value={name} onChange={(e) => setName(e.target.value)} /></F>
        <F id="gender" label={t("gender")}>
          <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as BirthProfile["gender"])}>
            <option value="">—</option><option value="male">{t("male")}</option><option value="female">{t("female")}</option><option value="other">{t("other")}</option>
          </select>
        </F>
        <F id="dob" label={t("dob")} err={errors.dob}><input id="dob" placeholder="DD/MM/YYYY" inputMode="numeric" value={dob} onChange={(e) => setDob(e.target.value)} /></F>
        <div className="row">
          <button type="button" className={clock === "24" ? "on" : ""} onClick={() => setClock("24")}>{t("clock24")}</button>
          <button type="button" className={clock === "12" ? "on" : ""} onClick={() => setClock("12")}>{t("clock12")}</button>
        </div>
        <div className="row3">
          <F id="hh" label={t("hours")}><input id="hh" inputMode="numeric" value={hh} onChange={(e) => setHh(e.target.value)} /></F>
          <F id="mm" label={t("minutes")}><input id="mm" inputMode="numeric" value={mm} onChange={(e) => setMm(e.target.value)} /></F>
          <F id="ss" label={t("seconds")}><input id="ss" inputMode="numeric" value={ss} onChange={(e) => setSs(e.target.value)} /></F>
        </div>
        {clock === "12" && (
          <div className="row">
            <button type="button" className={ampm === "am" ? "on" : ""} onClick={() => setAmpm("am")}>{t("am")}</button>
            <button type="button" className={ampm === "pm" ? "on" : ""} onClick={() => setAmpm("pm")}>{t("pm")}</button>
          </div>
        )}
        {errors.time && <div className="err" role="alert">{errors.time}</div>}
      </div>

      <div className="card">
        <h3>{t("place")}</h3>
        <F id="country" label={t("country")}><input id="country" value={country} onChange={(e) => setCountry(e.target.value)} /></F>
        <F id="state" label={t("state")}><input id="state" value={state} onChange={(e) => setState(e.target.value)} /></F>
        <F id="city" label={t("city")}><input id="city" value={city} onChange={(e) => setCity(e.target.value)} /></F>
        <div className="row3">
          <F id="lat" label={t("latitude")}><input id="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} /></F>
          <F id="lon" label={t("longitude")}><input id="lon" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} /></F>
        </div>
        {errors.coords && <div className="err" role="alert">{errors.coords}</div>}
        <F id="tz" label={t("timezone")} err={errors.tz}><input id="tz" value={tz} onChange={(e) => setTz(e.target.value)} /></F>
        <div className="muted">{t("tzHelp")}</div>
      </div>

      <div className="card">
        <h3>{t("tzCard")}</h3>
        {resolved ? (
          <dl className="kv">
            <dt>{t("localCivil")}</dt><dd>{resolved.localCivil}</dd>
            <dt>{t("utcOffset")}</dt><dd>{formatOffset(resolved.offsetSec)}</dd>
            <dt>{t("dst")}</dt><dd>{resolved.source === "manual" ? "—" : resolved.dstActive ? t("dstYes") : t("dstNo")}</dd>
            <dt>{t("source")}</dt><dd>{resolved.source === "manual" ? t("manual") : t("auto")}</dd>
            <dt>{t("utcResult")}</dt><dd>{resolved.utcIso}</dd>
          </dl>
        ) : (
          <div className="muted">{resolveError || "—"}</div>
        )}
        {resolved?.warnings.length ? <div className="warn">{resolved.warnings.join(" · ")}</div> : null}
        <label className="check"><input type="checkbox" checked={useManual} onChange={(e) => setUseManual(e.target.checked)} /> {t("useManual")}</label>
        {useManual && (
          <>
            <F id="mo" label={t("manualOffset")} err={errors.offset}><input id="mo" placeholder="+05:30" value={manualOffset} onChange={(e) => setManualOffset(e.target.value)} /></F>
            <F id="mr" label={t("manualReason")}><input id="mr" value={manualReason} onChange={(e) => setManualReason(e.target.value)} /></F>
          </>
        )}
      </div>

      <div className="card">
        <h3>{t("settings")}</h3>
        <F id="ayan" label={t("ayanamsha")}>
          <select id="ayan" value={ayanamsha} onChange={(e) => setAyanamsha(e.target.value)}>
            {AYANAMSHAS.map(([k, n]) => <option key={k} value={k}>{n}{k === "true_chitra" ? "" : " — " + t("pendingTag")}</option>)}
          </select>
        </F>
        <F id="nodes" label={t("nodes")}>
          <select id="nodes" value={nodes} onChange={(e) => setNodes(e.target.value as "mean" | "true")}>
            <option value="mean">{t("meanNode")}</option><option value="true">{t("trueNode")}</option>
          </select>
        </F>
        <div className="muted">{t("houseSystem")}: {t("wholeSign")}</div>
        <div className="muted">{t("settingsNote")}</div>
      </div>

      <div className="card">
        <F id="notes" label={t("notes")}><textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></F>
        <div className="row">
          <button type="submit" className="primary">{initial ? t("update") : t("save")}</button>
          {msg && <span className="ok">{msg}</span>}
        </div>
      </div>
    </form>
  );
}
