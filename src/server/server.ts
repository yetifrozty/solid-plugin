import type { Request, Response } from "express";
import { type SSRBaseHooks, type ViteHooks } from "@yetifrozty/vite-plugin";
import type { Resources, ServerData } from "./types.js";
import { getSolidRequestHandler } from "./ssr.js";

export type CoreSolidServerPlugin = SSRBaseHooks & ViteHooks & {
  name: "core-solid-server";
  handleSolidRequest: (req: Request, res: Response, serverData: ServerData) => Promise<void>;
}

const CoreServerPlugin: () => CoreSolidServerPlugin = () => {
  let plugins!: any[];
  let resources: Resources = {
    port: 3000,
    vite: undefined as any,
  };

  let handleSolidRequest: (req: Request, res: Response, serverData: ServerData) => Promise<void>;

  return {
    name: "core-solid-server",
    init: async (_plugins: any[]) => {
      plugins = _plugins;
    },
    postInit: async (_vite) => {
      resources.vite = _vite;
      const expressPlugin = plugins.find((plugin) => plugin.name === "express");
      if (expressPlugin) {
        resources.port = expressPlugin.port;
      }
      handleSolidRequest = getSolidRequestHandler(plugins, resources);
    },
    handleSolidRequest: async (req, res, serverData) => {
      await handleSolidRequest(req, res, serverData);
    }
  };
}

export default CoreServerPlugin;
export { type ServerData };