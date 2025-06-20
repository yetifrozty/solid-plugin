import App from "../client/App.js";
import { renderToString, createComponent, renderToStream, generateHydrationScript, renderToStringAsync } from "solid-js/web";
import type { ClientAPI, SolidClientPlugin } from "../client/types.js";
import { preloadModules } from "./preload.js";
import type { Request, Response } from "express";
import type { Resources, ServerData } from "./types.js";
import type { FetcherData } from "../client/fetch.js";
import { InitVite } from "@yetifrozty/vite-plugin";

export async function renderSync(head: string, url: string, vite: InitVite, res: Response, clientAPI: ClientAPI) {
  const rendered = renderToString(() => <App clientAPI={clientAPI} />);
  const html = await vite.generateHTMLTemplate(url, head, rendered);
  res.header("Content-Type", "text/html").send(html);
}

export async function renderAsync(head: string, url: string, vite: InitVite, res: Response, clientAPI: ClientAPI) {
  const rendered = await renderToStringAsync(() => <App clientAPI={clientAPI} />);
  const html = await vite.generateHTMLTemplate(url, head, rendered);
  res.header("Content-Type", "text/html").send(html);
}

export async function renderStream(head: string, url: string, vite: InitVite, res: Response, clientAPI: ClientAPI) {
  // Set response headers for streaming
  res.status(200).set({ 
    "Content-Type": "text/html",
    "Transfer-Encoding": "chunked"
  });

  // Get HTML template and split it at the app placeholder
  const templateHtml = await vite.generateHTMLTemplate(url, head, "<!--app-html-->");
  const [htmlStart, htmlEnd] = templateHtml.split("<!--app-html-->");

  res.write(htmlStart);

  // Render the SolidJS component to stream
  const stream = renderToStream(() => <App clientAPI={clientAPI} />);
  const streamHandler = {
    write: (v: string) => {
      res.write(v);
    },
    end: () => {
      res.end(htmlEnd);
    }
  }
  stream.pipe(streamHandler);
}