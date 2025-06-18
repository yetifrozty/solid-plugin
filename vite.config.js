// vite.config.js
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const ssr = process.env.SSR === 'true';

export default defineConfig({
  plugins: [
    solidPlugin()
  ],
  build: {
    lib: {
      entry: ssr ? ['src/server/registerPlugins.ts', 'src/server/server.ts'] : 'src/client/client.tsx',
      name: 'SolidPlugin',
      formats: ['es'],
      fileName: (format) => ssr ? `${format}.js` : 'client.js',
    },
    rollupOptions: {
      external: [
        'solid-js',
        '@yetifrozty/base-plugin-system',
        '@yetifrozty/express-plugin',
        '@yetifrozty/vite-plugin',
      ],
      input: ssr ? ['src/server/registerPlugins.ts', 'src/server/server.ts'] : 'src/client/client.tsx',      
    },
    outDir: ssr ? 'dist/server' : 'dist/client',
    ssr,
    target: "esnext",
  },
});
