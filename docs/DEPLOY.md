# Kazari Jump — deployment

A one-tap runner that lives entirely on **Telegram Serverless**: the Vite build is
served as the Mini App, database/auth/Bot API live in `tgcloud/`. No other hosting
or backend is required.

## Static browser demo (no backend)

`.github/workflows/pages.yml` builds the same front-end with `VITE_LOCAL_ONLY=1`
and publishes `dist/` to GitHub Pages. That build skips Telegram Serverless and
stores progress in the browser, so leaderboards and Stars are demo-only. Use it
for a quick link; the steps below are required for the real product.

## What you need

- Node.js 18+ and `npm install` in this folder.
- A bot created in **@BotFather**.
- A **Telegram Serverless CLI access token**: BotFather → your bot → *Serverless* →
  *CLI Access*. The CLI stores it locally — never commit it.
- A Telegram client recent enough to support Bot API 10.x Mini Apps / Serverless.

## 1. Build the front-end

```sh
npm run build
```

`dist/` is uploaded by `tgcloud push`; the command does not build for you.
`npm run deploy` does build + push.

## 2. Link the project

```sh
npx tgcloud login
```

When prompted, paste the CLI access token. This creates `.tgcloud/`, which is
gitignored. Do not copy it between machines.

Check what will change:

```sh
npx tgcloud status
npx tgcloud diff
```

## 3. Deploy code and database

```sh
npx tgcloud push     # uploads tgcloud/ modules and dist/
npx tgcloud migrate  # applies tgcloud/schema.js (interactive)
```

Order matters: `push` first, then `migrate`. A push reports pending schema changes
but never applies them. Migrations are safe to re-run; only additive changes are
applied automatically (drops require `.deprecated()` in the schema).

The first push prints the Mini App URL (`https://app<id>.tgcloud.ai/`). Keep it.

If the bot webhook drifts, repair it with `npx tgcloud webhook sync`.

## 4. Configure the bot

Either use BotFather manually or run:

```sh
node scripts/configure-bot.mjs https://app<id>.tgcloud.ai/
```

The script reads `bot token.txt` (gitignored) or `BOT_TOKEN` from the environment,
then sets the bot name, descriptions, command list, and the menu button that opens
the Mini App. Set `APP_URL` instead of the argument if you prefer.

BotFather checklist:

- **Bot Settings → Menu Button** → the Mini App URL (the script does this too).
- **Bot Settings → Configure Mini App** → enable the Mini App, use the same URL.
- **Commands** → `/start`, `/play`, `/terms`, `/support`, `/paysupport`, `/help`.
- **Payments** → nothing to connect for Telegram Stars; `XTR` invoices need no
  provider token. Refunds are handled per Telegram's Stars policy.

## 5. First checks

Open the bot, send `/start`, then tap the play button. Verify:

1. The menu shows the player profile and top-3 preview.
2. A run finishes and the result sheet shows the banked coins.
3. **Skins** → buy with coins → the skin equips.
4. **Leaders** → both **World** and **Squad** tabs load.
5. **Skins → Support** → Stars invoice opens and the purchase lands after payment.
6. A friend opens `https://t.me/<bot>?startapp=ch-123` and sees the challenge banner.

Server-side logs for a single function:

```sh
npx tgcloud run endpoints/bootstrap '{"lang":"ru"}' \
  --ctx '{ initData: { user: { id: 1, first_name: "Test" } } }'
```

This bypasses init-data verification and should only be used in development.

## How it is put together

| Path | Purpose |
| --- | --- |
| `src/` | Vite + TypeScript front-end, Canvas game, DOM UI |
| `tgcloud/schema.js` | `profiles`, `runs`, `purchases`, `referrals` |
| `tgcloud/lib/` | catalog, score validation, profile helpers, payments, i18n |
| `tgcloud/endpoints/` | `bootstrap`, `submitScore`, `leaderboard`, `buyWithCoins`, `equipSkin`, `createInvoice`, `claimDouble` |
| `tgcloud/handlers/` | `message` (commands + successful payments), `pre_checkout_query` |

### Run validation

`tgcloud/lib/score.js` enforces:

- `score === distance`; non-negative integers within sane limits.
- Distance cannot exceed ~52 m per second of run time, with a small buffer.
- Coins cannot exceed ~5 per second, with a small buffer.
- Runs shorter than 250 ms are rejected.
- At most 3 runs per 10 s and 300 per day per player.

If the game gets faster, update the constants in that file first.

### Economy

- New players start with 250 coins and the `classic` skin.
- Coin pickups are banked server-side once per final run.
- `claimDouble` grants the run's coins once, within 10 minutes of submission.
- Skins bought with coins or Stars; Stars purchases are idempotent by
  `telegram_payment_charge_id`.
- `Kazari+` (249 Stars) grants the `supporter` skin, a badge and a free revive per
  run (`profile.freeRevive`).

### Ads

Ads are **off by default**: `VITE_ADSGRAM_BLOCK_ID` is empty, so production never
loads an ad SDK. The local demo ad only appears in dev/local mode.

`Rules.txt` forbids ads and external links on custom-URL pages. Leave the block id
empty unless Telegram's current monetization terms explicitly allow ads for your
Mini App. Do not add external links or payment solicitations to the page.

### Privacy

The Mini App sets no cookies. It uses Telegram init data (verified by the platform
for every endpoint call), `localStorage` for language/sound settings and a local
fallback mode, and the database fields listed in `tgcloud/schema.js`. No data is
sent to third parties. If you enable a third-party ad SDK later, update the Terms
screen and this document first.

## Local development

```sh
npm run dev
```

Without Telegram, the app falls back to `src/local.ts`: a seeded leaderboard and
localStorage profile. This is deliberate, so UI work does not need a bot. The
fallback never writes to the server and cannot grant Stars.

Relevant env values (see `.env.example`):

| Variable | Meaning |
| --- | --- |
| `VITE_ADSGRAM_BLOCK_ID` | Optional Adsgram block id. Empty = ads off. |
| `VITE_BOT_USERNAME` | Fallback username for share links if `getMe` fails. |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Not linked to a bot yet` | Run `npx tgcloud login` with the BotFather CLI token. |
| UI loads but calls fail | `push` the latest `tgcloud/` modules; check `npx tgcloud status`. |
| `ENDPOINT_TIMEOUT` in the app | Client fell back to local mode; check the endpoint logs with `tgcloud run`. |
| Stars invoice fails | Ensure the client is current and the bot is launched inside Telegram; `XTR` prices must be integers. |
| Purchases do not arrive | Inspect `purchases` rows and the `successful_payment` update; replays are ignored by charge id. |
| Share link opens the wrong bot | Set `VITE_BOT_USERNAME` or confirm `getMe` works (`tgcloud run endpoints/bootstrap`). |
| Leaderboard has duplicate “you” rows | Deploy the current `leaderboard` endpoint; it now flags `isMe` in the top-100 query. |

Never commit `bot token.txt`, `.tgcloud/`, `.env*`, or `dist/`.
