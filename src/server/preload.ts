import path from "path";
import type { ViteDevServer } from "vite";
import fs from "fs";

const cwd = process.cwd();
const manifest = fs.existsSync(path.join(cwd, ".vite/dist/client/.vite/ssr-manifest.json")) ? fs.readFileSync(path.join(cwd, ".vite/dist/client/.vite/ssr-manifest.json"), "utf-8") : "{}";
const manifestJson: Record<string, string[]> = Object.fromEntries(Object.entries(JSON.parse(manifest)).map(([key, value]) => [path.join(cwd, ".vite", key), value])) as any;

function collectDeps(viteDevServer: ViteDevServer, entryId: string, seen = new Set<string>()) {
  const mod = viteDevServer.moduleGraph.getModuleById(entryId);
  if (!mod || !mod.id || seen.has(mod.id)) return;
  seen.add(mod.id);
  for (const dep of mod.importedModules) {
    if (dep.id) {
      collectDeps(viteDevServer, dep.id, seen);
    }
  }
  return seen;
}


export function preloadModules(modules: string[], viteDevServer?: ViteDevServer) {
  let modulesToPreload: string[] = [];
  for (const module of modules) {
    if (import.meta.env.PROD) { 
      const manifestModules = manifestJson[module];
      if (manifestModules) {
        modulesToPreload.push(...manifestModules);
      }
    } else if (viteDevServer) {
      const deps = collectDeps(viteDevServer, module);
      if (!deps) continue;
      const assets = [...deps].map(id => path.join("/@fs/", id));
      modulesToPreload.push(...assets);
    }
  }
  
  modulesToPreload = [...new Set(modulesToPreload)];
  
  let head = "";

  // preload css first

  modulesToPreload.filter(module => module.endsWith(".css")).forEach((module) => {
    if (module.split("?")[0].endsWith(".css")) {
      head += `<link rel="stylesheet" href="${module}">`;
    } else {
      head += `<link rel="modulepreload" href="${module}" as="script">`;
    }
  });

  head += `<script type="module">
  ${modulesToPreload.filter(module => module.endsWith(".css")).map(module => `import "${module}";`).join("\n")}
</script>`

  // preload js & other assets
  // modulesToPreload.filter(module => !module.endsWith(".css") && (module.split("?")[0].endsWith(".js") || module.split("?")[0].endsWith(".svelte"))).forEach((module) => {
  //   head += `<link rel="modulepreload" href="${module}" as="script">`;
  // });

  return head;
}