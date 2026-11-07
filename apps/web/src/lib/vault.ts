// Browser-only accounts and encrypted storage. Nothing leaves the device.
// - Password -> PBKDF2-SHA256 (310k iterations) -> 64 bytes: first 32 = login verifier, last 32 = AES-GCM key.
// - Each user's data is stored encrypted (AES-GCM) in localStorage; the password is never stored.
// - The data key is kept in sessionStorage so a page reload does not log you out; closing the tab does.
import type { BirthProfile } from "./profiles";

const ITER = 310_000;
const USERS = "as_users_v2";
const SESSION = "as_session_v2";
const dataKey = (u: string) => `as_data_v2_${u}`;

export interface Session {
  username: string;
  key: CryptoKey;
}

interface UserRecord {
  salt: string;
  verifier: string;
  created: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const x of a) s += String.fromCharCode(x);
  return btoa(s);
}
function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function store(): Storage {
  return globalThis.localStorage;
}
function readUsers(): Record<string, UserRecord> {
  try {
    return JSON.parse(store().getItem(USERS) ?? "{}");
  } catch {
    return {};
  }
}
function normalize(u: string) {
  return u.trim().toLowerCase();
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<{ verifier: string; key: CryptoKey; raw: Uint8Array<ArrayBuffer> }> {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITER }, base, 512));
  const raw = bits.slice(32);
  const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  return { verifier: b64(bits.slice(0, 32)), key, raw };
}

export type AuthError = "exists" | "badLogin" | "short" | "badName";

export function validUsername(u: string) {
  return /^[a-z0-9._-]{3,32}$/.test(normalize(u));
}

export async function register(username: string, password: string): Promise<{ session?: Session; error?: AuthError }> {
  const u = normalize(username);
  if (!validUsername(u)) return { error: "badName" };
  if (password.length < 8) return { error: "short" };
  const users = readUsers();
  if (users[u]) return { error: "exists" };
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const { verifier, key, raw } = await derive(password, salt);
  users[u] = { salt: b64(salt), verifier, created: new Date().toISOString() };
  store().setItem(USERS, JSON.stringify(users));
  const session = { username: u, key };
  await saveProfiles(session, []);
  rememberSession(u, raw);
  return { session };
}

export async function login(username: string, password: string): Promise<{ session?: Session; error?: AuthError }> {
  const u = normalize(username);
  const rec = readUsers()[u];
  if (!rec) return { error: "badLogin" };
  const { verifier, key, raw } = await derive(password, unb64(rec.salt));
  if (verifier !== rec.verifier) return { error: "badLogin" };
  rememberSession(u, raw);
  return { session: { username: u, key } };
}

function rememberSession(username: string, raw: Uint8Array) {
  try {
    sessionStorage.setItem(SESSION, JSON.stringify({ u: username, k: b64(raw) }));
  } catch {
    /* session storage unavailable: user will log in again after reload */
  }
}

export async function restoreSession(): Promise<Session | null> {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION) ?? "null");
    if (!s || !readUsers()[s.u]) return null;
    const key = await crypto.subtle.importKey("raw", unb64(s.k), "AES-GCM", true, ["encrypt", "decrypt"]);
    return { username: s.u, key };
  } catch {
    return null;
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION);
  } catch {
    /* ignore */
  }
}

export async function loadProfiles(s: Session): Promise<BirthProfile[]> {
  const raw = store().getItem(dataKey(s.username));
  if (!raw) return [];
  const { iv, ct } = JSON.parse(raw) as { iv: string; ct: string };
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, s.key, unb64(ct));
  return JSON.parse(dec.decode(plain)) as BirthProfile[];
}

export async function saveProfiles(s: Session, list: BirthProfile[]): Promise<void> {
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, s.key, enc.encode(JSON.stringify(list)));
  store().setItem(dataKey(s.username), JSON.stringify({ iv: b64(iv), ct: b64(ct) }));
}

export function deleteAccount(s: Session) {
  const users = readUsers();
  delete users[s.username];
  store().setItem(USERS, JSON.stringify(users));
  store().removeItem(dataKey(s.username));
  logout();
}

/** Plain JSON backup (unencrypted) the user can save and re-import on any device. */
export function exportBackup(list: BirthProfile[]): string {
  return JSON.stringify({ app: "astrosutras", version: 1, exportedAt: new Date().toISOString(), profiles: list }, null, 2);
}

export function parseBackup(text: string): BirthProfile[] | null {
  try {
    const j = JSON.parse(text);
    if (j?.app !== "astrosutras" || !Array.isArray(j.profiles)) return null;
    return j.profiles as BirthProfile[];
  } catch {
    return null;
  }
}
