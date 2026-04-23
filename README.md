# Map Grid

Printable OpenStreetMap with a British National Grid overlay, built with Vite, React, TypeScript, Leaflet, and `proj4`.

## Features

- British National Grid overlay in EPSG:27700
- Adjustable grid spacing
- Centre-point grid reference readout
- Click-to-drop ping with grid reference
- Print-friendly A4 landscape layout

## Local Development

Install dependencies:

```bash
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Start the production server locally:

```bash
npm start
```

The production server uses [server.mjs](server.mjs) and listens using this order:

- `PORT` (host-injected, if set)
- `START_PORT` (manual fallback)
- `4173` (default fallback)
- `HOST` (bind address, defaults to `0.0.0.0`)

Host binding examples:

- `HOST=0.0.0.0` listens on all interfaces.
- `HOST=127.0.0.1` listens on localhost only.

## Pelican Deployment

This repo includes a custom Pelican egg at [pelican/egg-map-grid-nodejs.json](pelican/egg-map-grid-nodejs.json).

Why this custom egg exists:

- The generic Node.js egg installs production dependencies only.
- This app needs a full install plus `npm run build` before startup.
- The app is served by `node server.mjs`, not by `vite dev`.

### Import The Egg

Import [pelican/egg-map-grid-nodejs.json](pelican/egg-map-grid-nodejs.json) into Pelican as a custom egg.

### Recommended Variable Values

- `GIT_ADDRESS`: your repository URL
- `BRANCH`: your deploy branch, if not the default branch
- `MAIN_FILE`: `server.mjs`
- `AUTO_UPDATE`: `0` or `1` depending on whether you want `git pull` on startup
- `NODE_ARGS`: leave blank unless you need extra Node arguments
- `NODE_PACKAGES`: leave blank unless you intentionally need extra packages
- `UNNODE_PACKAGES`: leave blank
- `USER_UPLOAD`: `0`

### Startup Behavior

The custom egg does this automatically:

1. Clones or updates the repo.
2. Runs `npm install`.
3. Runs `npm run build`.
4. Starts the app with `node server.mjs`.

### Port Handling

The host decides the actual port. Pelican should inject `PORT`, and [server.mjs](server.mjs) binds to that port automatically.
If `PORT` is not set in your environment, set `START_PORT` to the port you want (for example `4173`).

For access from outside your private network, host binding alone is not enough. You also need:

1. Firewall rule allowing inbound traffic on the chosen port.
2. Router/NAT port forwarding to the server if it is behind a home router.
3. Public DNS or IP routing to the server (or a reverse proxy/tunnel).

## Stack

- React 19
- TypeScript
- Vite
- Leaflet
- proj4
- serve-handler
