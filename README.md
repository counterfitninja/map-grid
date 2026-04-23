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

The production server uses [server.mjs](server.mjs) and listens on `process.env.PORT` with a fallback of `3000`.

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

## Stack

- React 19
- TypeScript
- Vite
- Leaflet
- proj4
- serve-handler
