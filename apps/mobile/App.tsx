import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./src/locales/en.json";
import hi from "./src/locales/hi.json";
import gu from "./src/locales/gu.json";
import { formatOffset, isValidTimeZone, resolveCivilTime } from "./src/lib/tz";

type Lang = "en" | "hi" | "gu";
type Theme = "light" | "dark";
const bundles = { en, hi, gu };
const LANG_NAMES: Record<Lang, string> = { en: "English", hi: "हिन्दी", gu: "ગુજરાતી" };

const palette = {
  light: { bg: "#ffffff", panel: "#f3f4f6", text: "#1b1f27", muted: "#5b6472", line: "#c9ced6", gold: "#a8842a" },
  dark: { bg: "#0f1420", panel: "#171e2d", text: "#e8ebf1", muted: "#9aa5b8", line: "#3a465e", gold: "#d4b25c" },
};

interface Saved {
  id: string;
  name: string;
  dob: string;
  hh: string;
  mm: string;
  ss: string;
  lat: string;
  lon: string;
  tz: string;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [saved, setSaved] = useState<Saved[]>([]);
  const [f, setF] = useState({ name: "", dob: "", hh: "", mm: "", ss: "0", lat: "", lon: "", tz: "Asia/Kolkata" });
  const [msg, setMsg] = useState("");
  const c = palette[theme];
  const b = bundles[lang];
  const t = (k: keyof typeof en.ui) => (b.ui as Record<string, string>)[k] ?? en.ui[k];

  useEffect(() => {
    (async () => {
      try {
        const l = await AsyncStorage.getItem("as_lang");
        if (l === "en" || l === "hi" || l === "gu") setLang(l);
        const th = await AsyncStorage.getItem("as_theme");
        if (th === "light" || th === "dark") setTheme(th);
        const s = await AsyncStorage.getItem("as_profiles_v1");
        if (s) setSaved(JSON.parse(s));
      } catch {
        /* storage unavailable */
      }
    })();
  }, []);

  const resolved = useMemo(() => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(f.dob.trim());
    const h = Number(f.hh), mi = Number(f.mm), s = Number(f.ss || 0);
    if (!m || f.hh === "" || f.mm === "" || !isValidTimeZone(f.tz)) return null;
    if (![h, mi, s].every(Number.isInteger) || h > 23 || mi > 59 || s > 59) return null;
    const y = Number(m[3]);
    if (y < 1850 || y > 2149) return null;
    return resolveCivilTime({ year: y, month: Number(m[2]), day: Number(m[1]), hour: h, minute: mi, second: s }, f.tz);
  }, [f]);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  async function persist(list: Saved[]) {
    setSaved(list);
    try {
      await AsyncStorage.setItem("as_profiles_v1", JSON.stringify(list));
    } catch {
      /* storage unavailable */
    }
  }
  function save() {
    if (!f.name.trim() || !resolved) {
      setMsg(t("required"));
      return;
    }
    persist([{ id: String(Date.now()), ...f }, ...saved]);
    setMsg(t("saved"));
  }
  const choose = async (l: Lang) => {
    setLang(l);
    try { await AsyncStorage.setItem("as_lang", l); } catch { /* ignore */ }
  };
  const flip = async () => {
    const n = theme === "dark" ? "light" : "dark";
    setTheme(n);
    try { await AsyncStorage.setItem("as_theme", n); } catch { /* ignore */ }
  };

  const input = [s.input, { borderColor: c.line, color: c.text, backgroundColor: c.bg }];
  const field = (k: keyof typeof f, label: string, kb?: "numeric" | "decimal-pad") => (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
      <TextInput style={input} value={f[k]} onChangeText={set(k)} keyboardType={kb} placeholderTextColor={c.muted} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />
      <View style={[s.header, { backgroundColor: c.panel, borderColor: c.line }]}>
        <Text style={{ color: c.gold, fontWeight: "700", fontSize: 18, flex: 1 }}>{t("appName")}</Text>
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
          <Pressable key={l} onPress={() => choose(l)} style={[s.chip, { borderColor: l === lang ? c.gold : c.line }]}>
            <Text style={{ color: c.text }}>{LANG_NAMES[l]}</Text>
          </Pressable>
        ))}
        <Pressable onPress={flip} style={[s.chip, { borderColor: c.line }]} accessibilityLabel={t("theme")}>
          <Text style={{ color: c.text }}>{theme === "dark" ? "☀" : "🌙"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Text style={[s.h, { color: c.gold }]}>{t("birthDetails")}</Text>
        {field("name", t("name"))}
        {field("dob", t("dob"), "numeric")}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>{field("hh", t("hours"), "numeric")}</View>
          <View style={{ flex: 1 }}>{field("mm", t("minutes"), "numeric")}</View>
          <View style={{ flex: 1 }}>{field("ss", t("seconds"), "numeric")}</View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>{field("lat", t("latitude"), "decimal-pad")}</View>
          <View style={{ flex: 1 }}>{field("lon", t("longitude"), "decimal-pad")}</View>
        </View>
        {field("tz", t("timezone"))}

        <View style={[s.card, { borderColor: c.line, backgroundColor: c.panel }]}>
          <Text style={[s.h, { color: c.gold }]}>{t("tzCard")}</Text>
          {resolved ? (
            <>
              <Text style={{ color: c.text }}>{t("localCivil")}: {resolved.localCivil}</Text>
              <Text style={{ color: c.text }}>{t("utcOffset")}: {formatOffset(resolved.offsetSec)}</Text>
              <Text style={{ color: c.text }}>{t("dst")}: {resolved.dstActive ? t("dstYes") : t("dstNo")}</Text>
              <Text style={{ color: c.text }}>{t("source")}: {t("auto")}</Text>
              <Text style={{ color: c.text }}>{t("utcResult")}: {resolved.utcIso}</Text>
              {resolved.warnings.length > 0 && <Text style={{ color: c.gold }}>{resolved.warnings.join(" · ")}</Text>}
            </>
          ) : (
            <Text style={{ color: c.muted }}>—</Text>
          )}
        </View>

        <Pressable onPress={save} style={[s.btn, { backgroundColor: c.gold }]}>
          <Text style={{ fontWeight: "700", color: "#111" }}>{t("save")}</Text>
        </Pressable>
        {msg ? <Text style={{ color: c.muted, marginTop: 6 }}>{msg}</Text> : null}
        <Text style={{ color: c.muted, marginTop: 10, fontSize: 12 }}>{t("engineOff")}</Text>

        <Text style={[s.h, { color: c.gold, marginTop: 20 }]}>{t("profiles")}</Text>
        {saved.length === 0 && <Text style={{ color: c.muted }}>{t("noProfiles")}</Text>}
        {saved.map((p) => (
          <View key={p.id} style={[s.card, { borderColor: c.line, backgroundColor: c.panel }]}>
            <Text style={{ color: c.text, fontWeight: "600" }}>{p.name}</Text>
            <Text style={{ color: c.muted }}>{p.dob} · {p.tz}</Text>
            <Pressable onPress={() => persist(saved.filter((x) => x.id !== p.id))}>
              <Text style={{ color: c.gold, marginTop: 4 }}>{t("delete")}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderBottomWidth: 1 },
  chip: { borderWidth: 1, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  h: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12 },
  btn: { marginTop: 14, borderRadius: 6, paddingVertical: 12, alignItems: "center" },
});
