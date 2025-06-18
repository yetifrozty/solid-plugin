import { type Component } from "solid-js";
import { render, hydrate } from 'solid-js/web'
import App from './App.jsx'

import type { ClientAPI, SolidClientHooks, SolidClientPlugin, LinkAction } from "./types.js";
import { ClientAPIImpl } from "./clientApi.js";

export default function CoreClientPlugin(): SolidClientPlugin {
  let plugins!: any[];
  let initialComponent: Component | undefined;
  let clientAPI: ClientAPI | undefined;
  async function getClientAPI(_publicData?: Record<string, any>, _privateData?: Record<string, any>, preload?: (module: string) => void) {
    if (clientAPI) {
      return clientAPI;
    }
    const privateData = _privateData ?? {cookies: "", origin: "", host: ""}
    const clientPage = _publicData ?? JSON.parse(document.getElementById("cms-ssr")?.textContent!)
    initialComponent = plugins.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.component;
    const clientData = await plugins.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.clientLoad?.(clientPage.data, preload ?? (() => {})) ?? {};
    const _clientAPI = new ClientAPIImpl(plugins, privateData, clientPage, initialComponent, clientData);
    if (!import.meta.env.SSR) {
      clientAPI = _clientAPI;
    }
    return _clientAPI;
  }
  
  let plugin: SolidClientPlugin = {
    name: "core-solid-client",
    init: async (_plugins: any[]) => {
      plugins = _plugins;

      if (import.meta.env.SSR) {
        plugin._ssrGetClientAPI = (_publicData, _privateData, preload) => {
          return getClientAPI(_publicData, _privateData, preload);
        };
      }
    },
    postInit: async () => {
      if (typeof window === "undefined") return;
      
      const rootElement = document.getElementById('app')!;
      const api = await getClientAPI();
      
      // Use hydrate if there's existing server-rendered content, otherwise use render
      if (rootElement.innerHTML) {
        hydrate(() => <App clientAPI={api} />, rootElement);
      } else {
        render(() => <App clientAPI={api} />, rootElement);
      }
    },
  } 

  return plugin;
}

export { type ClientAPI, type SolidClientHooks, type SolidClientPlugin, type LinkAction };
export { useClientAPI } from "./App.js";