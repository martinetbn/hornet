# Hornet

An API client that supports HTTP, WS, Socket.IO and gRPC, made in Electron with React and Tailwind 4, powered by Bun.

## Installation

Install dependencies:

```bash
bun install
```

## Development

Build and run the app in development mode:

```bash
bun run dev
```

This will build all components (main process, preload script, and renderer) and launch the Electron app with DevTools open.

## Build

Build all components:

```bash
bun run build
```

This creates the `dist/` directory with:
- `dist/main.js` - Electron main process
- `dist/preload.js` - Preload script for security
- `dist/renderer/` - React app with bundled assets

## Package

Create a distributable package:

```bash
bun run package
```

This will create platform-specific packages in the `release/` directory.
