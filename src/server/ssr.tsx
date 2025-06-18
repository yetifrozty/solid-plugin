import App from "../client/App.js";
import { renderToString, createComponent, renderToStream, generateHydrationScript } from "solid-js/web";
import type { SolidClientPlugin } from "../client/types.js";
import { preloadModules } from "./preload.js";
import type { Request, Response } from "express";
import type { Resources, ServerData } from "./types.js";
import type { FetcherData } from "../client/fetch.js";

export function getSolidRequestHandler(plugins: any[], resources: Resources) {
  const { vite, port } = resources;
  return async (req: Request, res: Response, serverData: ServerData) => {
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
    
    const privateData: Partial<FetcherData> = {
      cookies: req.headers.cookie ?? ""
    };
    const url = req.originalUrl
    try {
      const preloadQueue: string[] = [];
      function preload(module: string) {
        preloadQueue.push(module);
      }

      const clientPlugin = plugins.find((p): p is SolidClientPlugin => p.name === "core-solid-client")!;
      const clientAPI = await clientPlugin.getClientAPI(serverData, privateData, preload);
      
      // Generate preload modules for head
      const head = preloadModules(preloadQueue, vite.mode === "dev" ? vite.server : undefined) + generateHydrationScript() +
        `<script id="cms-ssr" type="application/json">${JSON.stringify(serverData)}</script>\n`;

      const rendered = renderToString(() => <App clientAPI={clientAPI} />);
      const html = await vite.generateHTMLTemplate(url, head, rendered);
      res.header("Content-Type", "text/html").send(html);
      // // Set response headers for streaming
      // res.status(200).set({ 
      //   "Content-Type": "text/html",
      //   "Transfer-Encoding": "chunked"
      // });

      // // Get HTML template and split it at the app placeholder
      // const templateHtml = await vite.generateHTMLTemplate(url, head, "<!--app-html-->");
      // const [htmlStart, htmlEnd] = templateHtml.split("<!--app-html-->");
      
      // // Send the opening HTML immediately
      // res.write(htmlStart);

      // // Render the SolidJS component to stream
      // const stream = renderToStream(() => <App clientAPI={clientAPI} />);
      // stream.pipe(res);
    } catch (_e) {
      const e = _e as Error;
      if (vite.mode === "dev" && vite.server) {
        vite.server.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  }
}