# Kazari Jump

Гиперказуальный one-tap раннер для Telegram: котик бежит сам, тап — прыжок, монеты, скины и рекорды друзей. Canvas + TypeScript без игрового движка.

[![Играть в браузере](https://img.shields.io/badge/%E2%96%B6%20%D0%98%D0%B3%D1%80%D0%B0%D1%82%D1%8C-%D0%B2%20%D0%B1%D1%80%D0%B0%D1%83%D0%B7%D0%B5%D1%80%D0%B5-2ee6a8?style=for-the-badge)](https://vanya890.github.io/kazari-jump/)
[![Telegram](https://img.shields.io/badge/Telegram-%40CodyKazari__bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/CodyKazari_bot)
[![Source](https://img.shields.io/badge/GitHub-%D0%98%D1%81%D1%85%D0%BE%D0%B4%D0%BD%D0%B8%D0%BA%D0%B8-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vanya890/kazari-jump)
[![Deploy browser demo](https://github.com/vanya890/kazari-jump/actions/workflows/pages.yml/badge.svg)](https://github.com/vanya890/kazari-jump/actions/workflows/pages.yml)

[▶ Открыть демо](https://vanya890.github.io/kazari-jump/) · [@CodyKazari_bot](https://t.me/CodyKazari_bot) · [Пересобрать в Actions](https://github.com/vanya890/kazari-jump/actions/workflows/pages.yml) · [Скачать ZIP](https://github.com/vanya890/kazari-jump/archive/refs/heads/main.zip)

> Сейчас @CodyKazari_bot открывает статическую демо-версию через кнопку меню. Полный бэкенд (реальный рейтинг, рефералы, Stars) готов в `tgcloud/`, но ещё не развёрнут: для него нужен CLI-токен BotFather.

## Что это

- Бесконечный забег на 30–60 секунд, скорость растёт, счёт равен дистанции в метрах.
- Один тап/клик/пробел — прыжок; удержание — выше прыжок.
- Монеты, пять скинов, ночные/дневные палитры, параллакс, частицы и WebAudio-звуки без единого изображения.
- Экран смерти с одним возрождением, челлендж другу, рейтинг, магазин и настройки RU/EN.

## Две версии

| | Браузер (GitHub Pages) | Telegram Serverless |
| --- | --- | --- |
| Ссылка | [vanya890.github.io/kazari-jump](https://vanya890.github.io/kazari-jump/) | бот [@CodyKazari_bot](https://t.me/CodyKazari_bot) |
| Бэкенд | локальный (`localStorage`) | `tgcloud/`: профили, рейтинг, рефералы, Stars |
| Рейтинг | демо-боты + твой результат на этом устройстве | реальный, глобальный и по приглашённым |
| Покупки | только за монеты | монеты + Telegram Stars |
| Интернет | не нужен после загрузки страницы | нужен |

Браузерная версия собрана с `VITE_LOCAL_ONLY=1`: она никогда не обращается к Telegram Serverless, поэтому запускается мгновенно и работает офлайн. Это витрина игры, а не полноценный бэкенд.

## Управление

- **Тап / клик / Space / ↑ / W** — прыжок (удержание — длиннее прыжок).
- **Pause** в HUD или `Esc` — пауза; `Esc` также закрывает магазин и настройки.
- На экране смерти: возрождение (бесплатно для Kazari+, иначе за rewarded-рекламу, если она подключена), «Завершить» или челлендж другу.

## Локальный запуск

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc --noEmit + vite build
npm run preview  # проверить собранную статику
```

Без Telegram приложение автоматически работает в локальном режиме: 250 стартовых монет, гость, демо-рейтинг. `window.__kazari` в dev-режиме даёт доступ к `game`, `state`, `ui` и основным действиям для отладки.

## Деплой

### Браузер: GitHub Pages

Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) собирает `dist/` и публикует его на GitHub Pages при каждом пуше в `main`. Кнопка **Run workflow** в Actions пересобирает демо вручную. Сборка использует относительные пути (`base: './'`), поэтому сайт работает и из подкаталога, и с обычного статического хостинга.

### Telegram: Serverless

Полная версия с базой, рейтингом и Stars разворачивается в Telegram Serverless:

```sh
npx tgcloud login      # CLI Access token из BotFather
npm run deploy         # build + tgcloud push
npx tgcloud migrate    # применить schema.js
node scripts/configure-bot.mjs https://app<id>.tgcloud.ai/
```

Подробности, BotFather, Stars и диагностика — в [docs/DEPLOY.md](docs/DEPLOY.md). Статическая демо-сборка и Serverless-версия используют один и тот же фронтенд; отличие только в переменных `VITE_LOCAL_ONLY` и наличии `tgcloud/`.

## Структура

| Путь | Назначение |
| --- | --- |
| `src/main.ts` | сценарии приложения: забег, смерть, возрождение, покупки, шаринг |
| `src/ui.ts` | все экраны и модалки из одного `UiState`, доступность, фокус |
| `src/game/` | Canvas-движок: физика, спавн, коллизии, рендер, скины |
| `src/i18n.ts` | словари RU/EN |
| `src/local.ts` | локальный бэкенд для браузера и demo-сборки |
| `src/api.ts` | выбор сервер/локально и общий интерфейс |
| `tgcloud/` | Serverless: схема БД, эндпоинты, хендлеры, платежи |
| `docs/` | деплой и справка по Serverless SDK |

## Правила и приватность

- Реклама выключена по умолчанию; Adsgram подключается только через `VITE_ADSGRAM_BLOCK_ID` и только там, где это разрешено.
- Stars продаются только за цифровые товары (скины, монеты, Kazari+), без вывода средств.
- Приложение не ставит cookies; прогресс демо хранится в `localStorage`.
- `bot token.txt`, `.tgcloud/`, `.env*` и `dist/` не попадают в репозиторий.

## English

Kazari Jump is a one-tap endless runner for Telegram, built with Vite + TypeScript + Canvas. A static, backend-free demo runs on GitHub Pages; the full version (profiles, leaderboards, referrals, Stars) targets Telegram Serverless in `tgcloud/`. See `docs/DEPLOY.md` for deployment and `AGENTS.md` for project conventions.
