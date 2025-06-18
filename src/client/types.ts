import type { Component } from "solid-js";
import type { FetcherData } from "./fetch.js";
import { ClientBaseHooks } from "@yetifrozty/vite-plugin";

export interface SolidClientPlugin extends ClientBaseHooks {
  name: "core-solid-client";
  getClientAPI: (publicData?: Record<string, any>, privateData?: Record<string, any>, preload?: (module: string) => void) => Promise<ClientAPI>;
  getFetcher: (fetcherData?: Partial<FetcherData>) => typeof fetch;
}

export interface SolidClientHooks {
  component: Component;
  clientLoad?: (serverData: Record<string, any>, preload: (module: string) => void) => Promise<Record<string, any>> | Record<string, any>;
}

export type LinkAction = (node: HTMLAnchorElement) => void

export interface ClientAPI {
  pluginManager: any[];
  pluginName: string;
  component: Component | undefined;
  serverData: Record<string, any>;
  clientData: Record<string, any>;
  currentHistoryIndex: string;
  fetch: typeof fetch;
  goto: (url: string, replace?: boolean) => Promise<void>;
  link: LinkAction;
  setHistoryState: (historyIndex: string, key: string, value: any) => void;
  getHistoryState: (historyIndex: string, key: string) => any;
}
