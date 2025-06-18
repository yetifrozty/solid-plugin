# SolidJS Plugin

This plugin has been converted from Svelte to SolidJS. It provides both client-side and server-side rendering capabilities for SolidJS applications.

## Features

- **Client-side rendering**: SolidJS components with hydration support
- **Server-side rendering**: SolidJS SSR with express integration
- **Plugin system**: Modular architecture for extending functionality
- **Navigation**: Client-side routing with history management
- **Context API**: SolidJS context for sharing state across components

## Key Components

### Client Side
- `App.tsx`: Main SolidJS app component with context provider
- `clientApi.ts`: Client API implementation using SolidJS signals
- `client.tsx`: Core client plugin setup and configuration

### Server Side
- `ssr.ts`: Server-side rendering implementation using SolidJS
- `server.ts`: Express server integration
- `types.ts`: TypeScript type definitions

## Usage

```typescript
import { CoreClientPlugin, CoreServerPlugin } from '@yetifrozty/solid-plugin';

// Client-side usage
const clientPlugin = CoreClientPlugin();

// Server-side usage
const serverPlugin = CoreServerPlugin();
```

## Dependencies

- `solid-js`: Core SolidJS library
- `solid-js/web`: SolidJS web utilities for rendering

## Migration from Svelte

This plugin was originally built for Svelte and has been converted to SolidJS. Key changes include:

- Replaced Svelte components with SolidJS components
- Updated state management from Svelte stores to SolidJS signals
- Converted SSR from Svelte server rendering to SolidJS renderToString
- Updated context system to use SolidJS context API 