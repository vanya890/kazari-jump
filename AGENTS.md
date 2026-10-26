# AGENTS.md

Kazari Jump is a hypercasual one-tap runner for Telegram. The front-end is Vite +
TypeScript + Canvas (no game engine); the backend is Telegram Serverless
(`tgcloud/`). Read [docs/DEPLOY.md](docs/DEPLOY.md) before deploying and
[docs/tgcloud-sdk.md](docs/tgcloud-sdk.md) for the Serverless SDK reference.

## Layout

| Path | What it is |
| --- | --- |
| `src/` | Mini App front-end. `main.ts` owns flows, `ui.ts` renders from one `UiState`, `game/` is the Canvas engine. |
| `tgcloud/schema.js` | DB tables (named exports). |
| `tgcloud/lib/` | Shared server code: catalog, score checks, profiles, payments, bot i18n. |
| `tgcloud/handlers/` | Telegram updates (`message`, `pre_checkout_query`). |
| `tgcloud/endpoints/` | Functions called by the Mini App via `Telegram.WebApp.Serverless.call`. |
| `docs/` | Deployment and SDK notes. |
| `dist/` | Build output uploaded by `tgcloud push` (gitignored). |

## Commands

```sh
npm run dev       # Vite dev server; local fallback when not inside Telegram
npm run build     # tsc --noEmit && vite build
npm run deploy    # build + tgcloud push
npx tgcloud status / diff / push / migrate / run
```

## Rules that bite

- Import Serverless modules with a relative path **and `.js`**: `../schema.js`,
  `./score.js`. The SDK is imported by name: `sdk`, `sdk/db`.
- Every DB call is async. No foreign keys. Drops only via `.deprecated()`.
- Modules under `tgcloud/` cannot import from `src/` or `node_modules/` at runtime.
  `tgcloud/lib/catalog.js` mirrors `src/data/catalog.ts`; update both together.
- Endpoints receive `(input, ctx)`; use `ctx.initData.user`. Handlers receive the
  update payload, not the full Update.
- Never commit `bot token.txt`, `.tgcloud/`, `.env*`, `dist/`, or
  `.playwright-mcp/`.

## Product invariants

- Score equals distance in metres. One final submission per run, after the optional
  single revive.
- Server-side score/coin/duration bounds live in `tgcloud/lib/score.js`; keep them
  in sync with `src/game/engine.ts` if speed or coin spawn rates change.
- Product ids and grants must match between `src/data/catalog.ts` and
  `tgcloud/lib/catalog.js`: `skin_midnight`, `skin_sakura`, `skin_mint`,
  `skin_ninja`, `skin_gold`, `supporter`, `coins_500`, `coins_1500`, `coins_4000`.
- Stars purchases are granted idempotently by `telegram_payment_charge_id`.
- Ads are off by default. `Rules.txt` forbids ads/external links on custom-URL
  pages; do not enable an ad SDK without checking current Telegram terms.
- UI copy is Russian-first with English support. Add both dictionaries in
  `src/i18n.ts`; bot copy is in `tgcloud/lib/i18n.js`.

## Testing notes

- Headless Chromium throttles `requestAnimationFrame` to ~1 fps. In dev,
  `window.__kazari` exposes the game/state/UI; call
  `window.__kazari.game.update(1 / 60)` in a loop for deterministic gameplay.
- Local mode starts with 250 coins and a guest profile; it never touches the
  server.
- `npm run build` is the TypeScript gate (`noUnusedLocals`, `noUnusedParameters`).
