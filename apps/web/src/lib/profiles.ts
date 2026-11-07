// Pure helpers over the profile list. Persistence (encrypted, per user) lives in vault.ts.
import type { ResolvedTime } from "./tz";

export interface CalcSettings {
  ayanamsha: string;
  nodes: "mean" | "true";
  houseSystem: "whole_sign";
}

export interface BirthProfile {
  id: string;
  version: number;
  name: string;
  gender: "" | "male" | "female" | "other";
  dob: string; // DD/MM/YYYY as entered
  time: { h: number; m: number; s: number };
  place: { text: string; country: string; state: string; city: string; lat: number; lon: number; tz: string };
  resolved: ResolvedTime;
  settings: CalcSettings;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
}

export function upsert(list: BirthProfile[], p: BirthProfile): BirthProfile[] {
  const i = list.findIndex((x) => x.id === p.id);
  const now = new Date().toISOString();
  if (i >= 0) {
    const next = [...list];
    next[i] = { ...p, version: list[i].version + 1, updatedAt: now };
    return next;
  }
  return [{ ...p, createdAt: now, updatedAt: now }, ...list];
}

export function remove(list: BirthProfile[], id: string): BirthProfile[] {
  return list.filter((x) => x.id !== id);
}

export function duplicate(list: BirthProfile[], id: string): BirthProfile[] {
  const src = list.find((x) => x.id === id);
  if (!src) return list;
  const now = new Date().toISOString();
  return [{ ...src, id: newId(), name: src.name + " (copy)", version: 1, createdAt: now, updatedAt: now }, ...list];
}

/** Merge imported profiles; existing ids are kept (imported copies get new ids). */
export function mergeImported(list: BirthProfile[], incoming: BirthProfile[]): BirthProfile[] {
  const ids = new Set(list.map((p) => p.id));
  const add = incoming.map((p) => (ids.has(p.id) ? { ...p, id: newId() } : p));
  return [...add, ...list];
}
