import { type Component } from "solid-js";
import { render, hydrate } from 'solid-js/web'
import App from './App.jsx'

import type { FetcherData } from "./fetch.js";
import getFetcher from "./fetch.js";
import type { ClientAPI, SolidClientHooks, SolidClientPlugin, LinkAction } from "./types.js";
import { ClientAPIImpl } from "./clientApi.js";
import { InitVite } from "@yetifrozty/vite-plugin";
import { ExpressPlugin } from "@yetifrozty/express-plugin";

export default function CoreClientPlugin(): SolidClientPlugin {
  let plugins!: any[];
  let initialComponent: Component | undefined;
  let clientAPI: ClientAPI | undefined;
  let vite: InitVite | undefined;

  async function getClientAPI(_publicData?: Record<string, any>, _privateData?: Record<string, any>, preload?: (module: string) => void) {
    const privateData = _privateData ?? {cookies: "", origin: "", host: ""}
    const clientPage = _publicData ?? JSON.parse(document.getElementById("cms-ssr")?.textContent!)
    initialComponent = plugins.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.component;
    const clientData = await plugins.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.clientLoad?.(clientPage.data, preload ?? (() => {})) ?? {};
    clientAPI = new ClientAPIImpl(plugins, privateData, clientPage, initialComponent, clientData);
    return clientAPI;
  }
  
  return {
    name: "core-solid-client",
    init: async (_plugins: any[]) => {
      plugins = _plugins;
    },
    postInit: async (_vite) => {
      vite = _vite;
      if (typeof window === "undefined") return;
      
      const rootElement = document.getElementById('app')!;
      const api = await getClientAPI();
      
      // Use hydrate if there's existing server-rendered content, otherwise use render
      if (rootElement.innerHTML) {
        hydrate(() => <App clientAPI={api} />, rootElement);
      } else {
        // render(() => <App clientAPI={api} />, rootElement);
      }
    },
    getClientAPI: async (publicData?: Record<string, any>, privateData?: Record<string, any>, preload?: (module: string) => void) => {
      if (!clientAPI || import.meta.env.SSR) {
        await getClientAPI(publicData, privateData, preload);
      }
      return clientAPI!;
    },
    getFetcher: (fetcherData) => {
      if (!fetcherData?.cookies) {
        return fetch;
      }

      if (vite) {
        const expressPlugin = plugins.find((p): p is ExpressPlugin => p.name === "express");
        const origin = `http${vite.mode === "dev" && vite.server?.config.server.https ? "s" : ""}://${vite.mode === "dev" && vite.server?.config.server.host || "localhost"}:${expressPlugin?.port || 3000}`;
        const host = vite.mode === "dev" && vite.server?.config.server.host && vite.server?.config.server.host !== true ? vite.server?.config.server.host : "localhost";
        fetcherData.origin = fetcherData.origin ?? origin;
        fetcherData.host = fetcherData.host ?? host;
      } else {
        fetcherData.origin = fetcherData.origin ?? window.location.origin;
        fetcherData.host = fetcherData.host ?? window.location.host;
      }

      return getFetcher(fetcherData as FetcherData);
    }
  };
}

export { type ClientAPI, type SolidClientHooks, type SolidClientPlugin, type LinkAction };
export { useClientAPI } from "./App.js";