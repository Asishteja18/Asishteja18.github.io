// Runs every AI-90 day inside real Pyodide (same harness the site's worker uses).
//   node tests/ai90_pyodide.mjs <pyodide-dir> [solutions|starters] [days e.g. 1-90] [wheel-dir]
import { readFileSync, readdirSync } from "node:fs";
const [dir, mode = "solutions", range = "1-90", wheels = ""] = process.argv.slice(2);
const { loadPyodide } = await import(dir + "/pyodide.mjs");
const data = JSON.parse(readFileSync(new URL("../content/ai90.json", import.meta.url)));
const byMod = Object.fromEntries(data.lessons.map((l) => [l.exercise.module, l]));
const py = await loadPyodide({ indexURL: dir + "/" });
await py.loadPackage("micropip");
const [lo, hi] = range.split("-").map(Number);
let tot = { pass: 0, fail: 0, todo: 0, error: 0 }, bad = [];
const t00 = Date.now();
for (const l of data.lessons.filter((l) => l.day >= lo && l.day <= (hi || lo))) {
  const ex = l.exercise, t0 = Date.now();
  try { py.FS.mkdirTree("/ai90"); } catch (_) {}
  for (const f of py.FS.readdir("/ai90")) if (/\.py$/.test(f)) py.FS.unlink("/ai90/" + f);
  const own = mode === "starters" ? ex.starter : ex.solution;
  py.FS.writeFile(`/ai90/${ex.module}.py`, own);
  py.FS.writeFile(`/ai90/test_${ex.module}.py`, ex.tests_code);
  let all = own + "\n" + ex.tests_code;
  for (const d of ex.deps) { py.FS.writeFile(`/ai90/${d}.py`, byMod[d].exercise.solution); all += "\n" + byMod[d].exercise.solution; }
  await py.loadPackagesFromImports(all, { messageCallback: () => {} });
  if (/\bopenpyxl\b|to_excel|read_excel/.test(all) && wheels) {
    for (const w of readdirSync(wheels)) py.FS.writeFile("/tmp/" + w, readFileSync(wheels + "/" + w));
    await py.runPythonAsync(`import micropip\nfor w in ${JSON.stringify(readdirSync(wheels))}:\n    await micropip.install("emfs:/tmp/" + w, deps=False)`);
  }
  py.globals.set("TEST", "test_" + ex.module);
  const r = JSON.parse(py.runPython(data.harness));
  const c = { pass: 0, fail: 0, todo: 0, error: 0 };
  r.results.forEach(([n, s, m]) => { c[s]++; tot[s]++; if (s === "fail" || s === "error") bad.push(`Day ${l.day} ${n}: ${m}`); });
  console.log(`Day ${String(l.day).padStart(2)} ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ` +
    Object.entries(c).filter(([, v]) => v).map(([k, v]) => k + " " + v).join("  "));
}
console.log("\nTOTAL", JSON.stringify(tot), ((Date.now() - t00) / 1000).toFixed(0) + "s");
bad.forEach((b) => console.log("  ✗ " + b));
process.exit(mode === "solutions" ? (tot.fail + tot.error + tot.todo ? 1 : 0) : (tot.error ? 1 : 0));
