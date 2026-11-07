"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional: hydrate from browser storage / reset form on selection */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import gu from "@/locales/gu.json";

export type Lang = "en" | "hi" | "gu";
export type Theme = "light" | "dark";
type UiKey = keyof typeof en.ui;

const bundles = { en, hi, gu } as const;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: (key: UiKey) => string;
  planets: string[];
  planetAbbr: string[];
  signs: string[];
  nakshatras: string[];
}

const C = createContext<Ctx | null>(null);

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const l = read("as_lang");
    if (l === "en" || l === "hi" || l === "gu") setLangState(l);
    const th = read("as_theme");
    if (th === "light" || th === "dark") setTheme(th);
    else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setTheme("dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write("as_lang", l);
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((p) => {
      const n = p === "dark" ? "light" : "dark";
      write("as_theme", n);
      return n;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const b = bundles[lang];
    return {
      lang,
      setLang,
      theme,
      toggleTheme,
      t: (k) => (b.ui as Record<string, string>)[k] ?? (en.ui as Record<string, string>)[k] ?? k,
      planets: b.astro.planets,
      planetAbbr: b.astro.planetAbbr,
      signs: b.astro.signs,
      nakshatras: b.astro.nakshatras,
    };
  }, [lang, theme, setLang, toggleTheme]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp(): Ctx {
  const v = useContext(C);
  if (!v) throw new Error("useApp must be used inside Providers");
  return v;
}
