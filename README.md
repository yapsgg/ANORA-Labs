# ANORA Labs - The Open Source Flora.ai Alternative

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

ANORA Labs is the AI-powered canvas for designers, brand teams, and agencies.
Generate, edit, and produce visuals across 300+ models in one workspace.

Wire a concept into an image, drag the image into a video, and codify the whole
process into a repeatable **system** — from concept to finished campaign without
switching tools.

- **One canvas, every model** — text, image, and video through a single
  [OpenRouter](https://openrouter.ai) layer.
- **Codified systems** — save a working process as a reusable workflow and share
  it on the marketplace.
- **Real-time collaboration surface** — flows, nodes, assets, and balances sync
  live through [Convex](https://convex.dev).
- **Prepaid micro-credit billing** — top-ups and marketplace purchases via
  [Polar.sh](https://polar.sh).
- **Durable assets** — every model output is re-hosted on
  [Bunny.net](https://bunny.net) CDN.

Hosted instance: **<https://anora.yaps.gg>**

> Note: the landing page links to workflows on the hosted instance. Workflow IDs
> are deployment-specific, so they will not resolve against your own Convex
> deployment.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Canvas | `@xyflow/react` |
| Client state | Zustand |
| Database / Auth / Realtime | Convex + Convex Auth (Google OAuth) |
| AI routing | OpenRouter |
| File storage | Bunny.net Storage + CDN |
| Payments | Polar.sh |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui |

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full end-to-end design.

## Getting started

### Prerequisites

- Node.js 20+
- A [Convex](https://convex.dev) account
- An [OpenRouter](https://openrouter.ai) API key
- A [Bunny.net](https://bunny.net) storage zone (optional, for asset uploads)
- A [Polar.sh](https://polar.sh) organization (optional, for billing)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`. See
[`.env.example`](./.env.example) for descriptions of every variable. At minimum
you need the Convex URLs, Google OAuth credentials, and `OPENROUTER_API_KEY` to
run the app locally.

### 3. Set up Convex

```bash
npx convex dev
```

This creates a deployment, pushes the schema and functions in `convex/`, and
writes the deployment URLs. Copy them into `.env.local`. Google OAuth
credentials are read by the Convex deployment — set them for your Convex
environment as well.

### 4. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript with no emit |

## Project structure

```
app/          Next.js routes (landing, dashboard, workflow editor, API routes)
components/   Shared UI components (shadcn/ui primitives, navigation, dialogs)
convex/       Convex schema, queries, mutations, HTTP actions
hooks/        Reusable React hooks
lib/          Integrations — OpenRouter, Bunny, Polar, auth helpers
public/       Static assets (fonts, images, logos)
```

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
and our [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) before opening a pull
request.

## Security

Please do not disclose security issues publicly. See
[`SECURITY.md`](./SECURITY.md).

## License

Released under the [MIT License](./LICENSE).
