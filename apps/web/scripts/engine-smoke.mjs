// Runs the in-browser engine bundle under Node (Pyodide) and compares with JHora REF-002.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide } from "pyodide";

const here = dirname(fileURLToPath(import.meta.url));
const eng = resolve(here, "../public/engine");
const py = await loadPyodide();
await py.loadPackage(["numpy", "micropip"]);
const micropip = py.pyimport("micropip");
const wheels = readdirSync(join(eng, "wheels")).filter((f) => f.endsWith(".whl"));
for (const w of wheels) {
  const bytes = readFileSync(join(eng, "wheels", w));
  py.FS.writeFile(`/tmp/${w}`, bytes);
}
await micropip.install(wheels.map((w) => `emfs:/tmp/${w}`), { deps: false });

py.FS.mkdirTree("/home/pyodide/astroengine");
for (const f of readdirSync(join(eng, "py/astroengine"))) {
  py.FS.writeFile(`/home/pyodide/astroengine/${f}`, readFileSync(join(eng, "py/astroengine", f)));
}
py.FS.mkdirTree("/data");
py.FS.writeFile("/data/de440s.bsp", Buffer.concat(["part0", "part1"].map((p) => readFileSync(join(eng, `data/de440s.bsp.${p}`)))));

py.runPython("import sys; sys.path.insert(0, '/home/pyodide')");
const t0 = Date.now();
const out = py.runPython(`
from astroengine.bridge import compute
compute('{"utc_instant":"1947-08-14T18:31:00Z","latitude":28.666667,"longitude":77.216667}')
`);
const res = JSON.parse(out);
if (!res.chart) throw new Error("engine error: " + out);
const by = Object.fromEntries(res.chart.planets.map((p) => [p.body, p]));
const dms = (d) => `${Math.floor(d % 30)}° ${Math.floor(((d % 30) % 1) * 60)}′`;
console.log("ms:", Date.now() - t0, "ayanamsha", res.chart.ayanamsha.value.toFixed(5));
console.log("Sun", dms(by.Sun.longitude), "Moon", dms(by.Moon.longitude), "Lagna", dms(res.chart.ascendant.longitude));
// JHora REF-002: Sun 28 Cn 00' 37.52", Moon 4 Cn 00' 33.71"
const sunErr = Math.abs(by.Sun.longitude - (90 + 28 + 0 / 60 + 37.52 / 3600)) * 3600;
const moonErr = Math.abs(by.Moon.longitude - (90 + 4 + 33.71 / 3600)) * 3600;
console.log("Sun err arcsec", sunErr.toFixed(2), "Moon err arcsec", moonErr.toFixed(2));
if (sunErr > 1 || moonErr > 1) throw new Error("engine mismatch vs JHora REF-002");
console.log("OK");
