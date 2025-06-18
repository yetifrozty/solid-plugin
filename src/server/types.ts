import type { Request, Response } from "express";
import type { ViteDevServer } from "vite";
import type { InitVite } from "@yetifrozty/vite-plugin";

export interface ServerData {
  pluginName: string;
  data: Record<string, any>;
}

export interface Resources {
  vite_server?: ViteDevServer;
  vite: InitVite;
  port: number;
}

export interface MiddlewareState {
  handleSolidRequest: (req: Request, res: Response, serverData: ServerData) => Promise<void>;
  resources: Resources;
  plugins: any[];
}
