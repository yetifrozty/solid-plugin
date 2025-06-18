import { vitePlugin } from '@yetifrozty/vite-plugin';
import { expressPlugin } from '@yetifrozty/express-plugin';
import solid from 'vite-plugin-solid';

function solidPlugin() {
  let plugins;
  return {
    name: "solid-boot",
    init: async (_plugins) => {
      plugins = _plugins;
      if (!plugins.find((p) => p.name === "express")) {
        const express = expressPlugin();
        plugins.push(express);
        await express.init?.(plugins);
      }
      if (!plugins.find((p) => p.name === "vite")) {
        const vite = vitePlugin();
        plugins.push(vite);
        await vite.init?.(plugins);
      }
    },
    configureVite: async (vite) => {

      vite.clientPluginModules.push("@yetifrozty/solid-plugin/client");
      vite.serverPluginModules.push("@yetifrozty/solid-plugin/server");
    

      if (!vite.config.plugins) vite.config.plugins = [];

      vite.config.plugins.push(solid({ssr: true}));

      // Configure optimizeDeps to exclude solid-plugin
      if (!vite.config.optimizeDeps) vite.config.optimizeDeps = {};
      if (!vite.config.optimizeDeps.exclude) vite.config.optimizeDeps.exclude = [];
      
      vite.config.optimizeDeps.exclude.push(
        '@yetifrozty/solid-plugin',
      );
      return vite;
    },
    initVite: async () => {
    },
    initExpress: async (express) => {
    }
  };
}

export { solidPlugin as default };
