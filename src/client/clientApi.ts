import { type Component, createSignal, batch } from "solid-js";
import getFetcher, { type FetcherData } from "./fetch.js";
import type { ClientAPI, SolidClientHooks, LinkAction } from "./types.js";

export class ClientAPIImpl implements ClientAPI {
  private pluginNameSignal = createSignal("");
  private serverDataSignal = createSignal<Record<string, any>>({});
  private clientDataSignal = createSignal<Record<string, any>>({});
  private componentSignal = createSignal<Component | undefined>(undefined);
  private currentHistoryIndexSignal = createSignal("");
  
  private privateData: FetcherData;
  fetch: typeof fetch;

  constructor(public pluginManager: any[], privateData: any, clientPage: any, initialComponent: Component | undefined, clientData: Record<string, any>) {
    this.privateData = privateData;
    this.pluginNameSignal[1](clientPage.pluginName);
    this.serverDataSignal[1](clientPage.data);
    this.clientDataSignal[1](clientData);
    this.componentSignal[1](() => initialComponent);
    this.fetch = getFetcher(this.privateData);

    if (typeof window !== "undefined") {
      window.addEventListener('popstate', async (event) => {
        this.setHistoryState(this.currentHistoryIndex, "scroll", { x: window.scrollX, y: window.scrollY });

        const url = window.location.pathname + window.location.search + window.location.hash;
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        if (!response.ok) {
          // Optionally handle error
          console.error('Failed to fetch page data on popstate');
          return;
        }

        if (response.redirected) {
          window.history.replaceState({ ...window.history.state }, '', response.url);
        }

        const clientPage = await response.json();
        const newComponent = this.pluginManager.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.component;
        const newClientData = await this.pluginManager.find((p): p is SolidClientHooks => p.name === clientPage.pluginName)?.clientLoad?.(clientPage.data, () => { }) ?? {};
        
        batch(() => {
          this.componentSignal[1](() => newComponent);
          this.pluginNameSignal[1](clientPage.pluginName);
          this.serverDataSignal[1](clientPage.data);
          this.clientDataSignal[1](newClientData);
        });

        // Restore scroll position if available
        const scroll = this.getHistoryState(event.state?.historyIndex || "", "scroll");
        if (scroll) {
          history.scrollRestoration = "manual";
          window.scrollTo(scroll.x, scroll.y);
        }

        this.currentHistoryIndexSignal[1](event.state?.historyIndex || "");
      });
    }
  }

  get pluginName() { return this.pluginNameSignal[0](); }
  get serverData() { return this.serverDataSignal[0](); }
  get clientData() { return this.clientDataSignal[0](); }
  get component() { return this.componentSignal[0](); }
  get currentHistoryIndex() { return this.currentHistoryIndexSignal[0](); }

  setHistoryState(historyIndex: string, key: string, value: any) {
    const storedHistory = window.sessionStorage.getItem("history");
    if (!storedHistory) {
      window.sessionStorage.setItem("history", JSON.stringify({}));
    }
    const history = JSON.parse(storedHistory || "{}");
    history[historyIndex] = history[historyIndex] || {};
    history[historyIndex][key] = value;
    window.sessionStorage.setItem("history", JSON.stringify(history));
  }

  getHistoryState(historyIndex: string, key: string) {
    const storedHistory = window.sessionStorage.getItem("history");
    if (!storedHistory) {
      return null;
    }
    const history = JSON.parse(storedHistory);
    return history[historyIndex]?.[key];
  }

  async goto(url: string, replace: boolean = false) {
    if (typeof window === "undefined") return;

    const state = {
      historyIndex: Date.now(),
    };

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](state, '', url);

    // Trigger a popstate event to handle the navigation
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }

  link: LinkAction = (node: HTMLAnchorElement) => {
    const handleClick = async (e: MouseEvent) => {
      // Only handle left clicks without modifier keys
      if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
        return;
      }

      const href = node.getAttribute('href');
      if (!href) return;

      // Don't handle external links or anchor links
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#')) {
        return;
      }

      e.preventDefault();
      await this.goto(href);
    };

    node.addEventListener('click', handleClick);

    return {
      destroy() {
        node.removeEventListener('click', handleClick);
      }
    };
  };
} 