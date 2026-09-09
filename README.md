# [markometcalfe.com](https://markometcalfe.com)

The source code for my personal portfolio site at [markometcalfe.com](https://markometcalfe.com).

## What it contains

The site is a portfolio and creative playground, including:

- **Home page** — landing page with an interactive 3D visuals background
- **Resume** — dynamically fetched from the `@markometcalfe/resume` package
- **Visuals** — interactive generative graphics using Three.js
- **Doodle** — a multiplayer drawing and guessing game
- **Country Guesser** — a singleplayer and multiplayer country name guessing game
- **Sequencer** — a browser-based music sequencer built with Tone.js

## Architecture

The repo is split into two sub-projects:

### `web/`

The frontend, built with:

- [Nuxt.js](https://nuxt.com/) (Vue 3 framework)
- [Vue 3](https://vuejs.org/) with [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (via Nuxt)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Three.js](https://threejs.org/) and [Tone.js](https://tonejs.github.io/) for creative features

Features are organised as Nuxt modules under `web/modules/`.

### `api/`

A set of [Cloudflare Workers](https://workers.cloudflare.com/) managed with [Wrangler](https://developers.cloudflare.com/workers/wrangler/). Each worker lives in its own subdirectory (`doodle/`, `network-status/`, `resume/`) and has its own `wrangler.jsonc` config.

## Development

1. Install dependencies:

```sh
npm ci
```

2. Start the development server. This also starts the API workers locally:

```sh
npm run dev
```

## Testing

Playwright is used for end-to-end testing. Tests live in `**/tests/e2e/*.spec.ts` files.

Install Playwright browsers if you haven't already:

```sh
npx playwright install
```

Run the tests:

```sh
npm run test
```

## Deployment

The `main` branch is automatically deployed by Cloudflare Pages (frontend) and Cloudflare Workers (API).
