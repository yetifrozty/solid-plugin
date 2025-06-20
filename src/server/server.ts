import type { Request, Response } from "express";
import { InitVite, type SSRBaseHooks, type ViteHooks } from "@yetifrozty/vite-plugin";
import type { ServerData } from "./types.js";
import { generateHydrationScript, renderToStream, renderToStringAsync, renderToString } from "solid-js/web";
import { preloadModules } from "./preload.js";
import type { FetcherData } from "../client/fetch.js";
import type { SolidClientPlugin } from "../client/types.js";
import { renderAsync, renderStream, renderSync } from "./ssr.js";

export type CoreSolidServerPlugin = SSRBaseHooks & ViteHooks & {
  name: "core-solid-server";
  handleSolidRequest: (
    req: Request,
    res: Response,
    serverData: ServerData,
    mode?: "sync" | "async" | "stream"
  ) => Promise<void>;
}

const CoreServerPlugin: () => CoreSolidServerPlugin = () => {
  let plugins!: any[];
  let port!: number;
  let vite!: InitVite;

  return {
    name: "core-solid-server",
    init: async (_plugins: any[]) => {
      plugins = _plugins;
    },
    postInit: async (_vite) => {
      vite = _vite;
      const expressPlugin = plugins.find((plugin) => plugin.name === "express");
      if (expressPlugin) {
        port = expressPlugin.port;
      }
    },
    handleSolidRequest: async (req: Request, res: Response, serverData: ServerData, mode: "sync" | "async" | "stream" = "stream") => {
      if (!req.headers.accept?.includes("text/html")) {
        res.status(200)
          .set({
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          })
          .send(serverData);
        return;
      }
      
      const origin = `http${vite.mode === "dev" && vite.server?.config.server.https ? "s" : ""}://${vite.mode === "dev" && vite.server?.config.server.host || "localhost"}:${port || 3000}`;
      const host = vite.mode === "dev" && vite.server?.config.server.host && vite.server?.config.server.host !== true ? vite.server?.config.server.host : "localhost";
      const privateData: FetcherData = {
        cookies: req.headers.cookie ?? "",
        origin,
        host
      };
      const url = req.originalUrl
      try {
        const preloadQueue: string[] = [];
        function preload(module: string) {
          preloadQueue.push(module);
        }
  
        const clientPlugin = plugins.find((p): p is SolidClientPlugin => p.name === "core-solid-client")!;
        const clientAPI = await clientPlugin._ssrGetClientAPI?.(serverData, privateData, preload)!;
        
        // Generate preload modules for head
        const head = preloadModules(preloadQueue, vite.mode === "dev" ? vite.server : undefined) + generateHydrationScript() +
        `<script id="cms-ssr" type="application/json">${JSON.stringify(serverData)}</script>\n`;
        
        let renderFunction: (head: string, url: string, vite: InitVite, res: Response, clientAPI: any) => Promise<void>;
        
        if (mode === "sync") {
          renderFunction = renderSync
        } else if (mode === "async") {
          renderFunction = renderAsync
        } else if (mode === "stream") {
          renderFunction = renderStream
        } else {
          throw new Error(`Invalid mode: ${mode}`);
        }

        await renderFunction(head, url, vite, res, clientAPI);
      } catch (_e) {
        const e = _e as Error;
        if (vite.mode === "dev" && vite.server) {
          vite.server.ssrFixStacktrace(e);
        }
        console.log(e);
        res.status(500).end(e.stack);
      }
    }
  };
}

export default CoreServerPlugin;
export { type ServerData };