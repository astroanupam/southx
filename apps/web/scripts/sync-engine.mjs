// Prepares the in-browser engine bundle in public/engine:
//  1. copies the Python engine (single source of truth: services/api/app/engine)
//  2. copies the Pyodide runtime + the three Python packages it needs from node_modules/pyodide
//     (downloading the packages from the Pyodide CDN at build time if not cached), so the deployed
//     site has no runtime dependency on any CDN
//  3. writes manifest.json (wheels, python files, ephemeris parts)
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public/engine");
const src = resolve(here, "../../../services/api/app/engine");
const dst = join(pub, "py/astroengine");
const pyo = resolve(here, "../node_modules/pyodide");
const out = join(pub, "pyodide");

if (existsSync(src)) {
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src)) if (f.endsWith(".py") && f !== "__init__.py") copyFileSync(join(src, f), join(dst, f));
  writeFileSync(join(dst, "__init__.py"), "");
}

mkdirSync(out, { recursive: true });
for (const f of ["pyodide.js", "pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"]) {
  copyFileSync(join(pyo, f), join(out, f));
}
const lock = JSON.parse(readFileSync(join(pyo, "pyodide-lock.json"), "utf8"));
const version = JSON.parse(readFileSync(join(pyo, "package.json"), "utf8")).version;
for (const name of ["numpy", "micropip", "certifi"]) {
  const file = lock.packages[name].file_name;
  const local = join(pyo, file);
  if (existsSync(local)) copyFileSync(local, join(out, file));
  else {
    const r = await fetch(`https://cdn.jsdelivr.net/pyodide/v${version}/full/${file}`);
    if (!r.ok) throw new Error("could not download " + file);
    writeFileSync(join(out, file), Buffer.from(await r.arrayBuffer()));
  }
}

const wheels = readdirSync(join(pub, "wheels")).filter((f) => f.endsWith(".whl")).sort();
const py = readdirSync(dst).filter((f) => f.endsWith(".py")).sort();
const data = readdirSync(join(pub, "data")).filter((f) => f.startsWith("de440s.bsp.part")).sort();
writeFileSync(join(pub, "manifest.json"), JSON.stringify({ wheels, py, data }, null, 2));
console.log("sync-engine: engine bundle ready");