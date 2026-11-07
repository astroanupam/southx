"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/lib/i18n";
import { login, register, restoreSession, validUsername, type Session } from "@/lib/vault";

export default function AuthGate({ children }: { children: (s: Session, signOut: () => void) => ReactNode }) {
  const { t } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    restoreSession().then((s) => {
      setSession(s);
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  if (session) return <>{children(session, () => { import("@/lib/vault").then((v) => v.logout()); setSession(null); setPw(""); setPw2(""); })}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (mode === "up") {
      if (!validUsername(user)) return setErr(t("badName"));
      if (pw.length < 8) return setErr(t("passwordShort"));
      if (pw !== pw2) return setErr(t("passwordMismatch"));
    }
    setBusy(true);
    const r = mode === "up" ? await register(user, pw) : await login(user, pw);
    setBusy(false);
    if (r.session) return setSession(r.session);
    setErr(r.error === "exists" ? t("userExists") : r.error === "short" ? t("passwordShort") : r.error === "badName" ? t("badName") : t("badLogin"));
  }

  return (
    <main className="authwrap">
      <form className="card auth" onSubmit={submit} noValidate>
        <h2>{mode === "in" ? t("signIn") : t("createAccount")}</h2>
        <div className="field">
          <label htmlFor="u">{t("username")}</label>
          <input id="u" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="p">{t("password")}</label>
          <input id="p" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        {mode === "up" && (
          <div className="field">
            <label htmlFor="p2">{t("confirmPassword")}</label>
            <input id="p2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        )}
        {err && <div className="err" role="alert">{err}</div>}
        <div className="row">
          <button type="submit" className="primary" disabled={busy}>{mode === "in" ? t("signIn") : t("createAccount")}</button>
          <button type="button" className="link" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); }}>
            {mode === "in" ? t("noAccount") : t("haveAccount")}
          </button>
        </div>
        <p className="muted">{t("authNote")}</p>
      </form>
    </main>
  );
}
