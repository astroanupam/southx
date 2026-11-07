/* Runs the Python astronomy engine in the browser (Pyodide + Skyfield + JPL DE440s). ES-module worker.
   Everything is served from this site: no CDN is needed at runtime. */
import { loadPyodide } from "./pyodide/pyodide.mjs";

const base = new URL(".", import.meta.url).href; // .../engine/
const PYODIDE = base + "pyodide/";

let ready = null;

async function bytes(path) {
  const r = await fetch(base + path);
  if (!r.ok) throw new Error("fetch failed: " + path);
  return new Uint8Array(await r.arrayBuffer());
}

async function init() {
  const py = await loadPyodide({ indexURL: PYODIDE });
  await py.loadPackage(["numpy", "micropip"]);
  const manifest = await (await fetch(base + "manifest.json")).json();
  const micropip = py.pyimport("micropip");
  for (const w of manifest.wheels) py.FS.writeFile("/tmp/" + w, await bytes("wheels/" + w));
  await micropip.install(manifest.wheels.map((w) => "emfs:/tmp/" + w), { deps: false });
  py.FS.mkdirTree("/home/pyodide/astroengine");
  for (const f of manifest.py) py.FS.writeFile("/home/pyodide/astroengine/" + f, await bytes("py/astroengine/" + f));
  py.FS.mkdirTree("/data");
  const parts = [];
  for (const p of manifest.data) parts.push(await bytes("data/" + p));
  const total = parts.reduce((n, a) => n + a.length, 0);
  const all = new Uint8Array(total);
  let off = 0;
  for (const a of parts) { all.set(a, off); off += a.length; }
  py.FS.writeFile("/data/de440s.bsp", all);
  py.runPython("import sys; sys.path.insert(0, '/home/pyodide')\nfrom astroengine.bridge import compute");
  return py;
}

self.onmessage = async (e) => {
  const { id, request } = e.data;
  try {
    if (!ready) {
      self.postMessage({ id, status: "loading" });
      ready = init();
    }
    const py = await ready;
    py.globals.set("req_json", JSON.stringify(request));
    const out = py.runPython("compute(req_json)");
    self.postMessage({ id, result: JSON.parse(out) });
  } catch (err) {
    ready = null;
    self.postMessage({ id, fatal: String(err && err.message ? err.message : err) });
  }
};