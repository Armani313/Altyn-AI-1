# Luminify

Luminify — B2B SaaS-продукт для e-commerce команд. Платформа помогает превратить фото товара в AI lifestyle-изображения, карточки для маркетплейсов, улучшенные версии снимков и быстрые редакторские сценарии без студийного продакшна.

Сейчас в проекте поддерживаются две локали:
- `en` — локаль по умолчанию, без префикса в URL
- `ru` — доступна под `/ru/...`

## Что Уже Есть В Продукте

- AI lifestyle-генерация для каталожных фото
- Генерация 2x2 contact sheet с серверным разрезанием на 4 отдельных результата
- Генерация карточек товара и template-based card flows
- Библиотека, история, биллинг и настройки внутри dashboard
- Удаление фона и встроенный фото-редактор
- Публичные SEO tool-страницы вроде `background-remover`, `white-background`, `add-background`, `blur-background`, `change-background-color` и `photo-enhancer`
- FAQ-страница и локализованные landing pages

## Актуальный Стек

| Слой | Технология |
| --- | --- |
| Framework | Next.js 16.2.1 App Router |
| UI | React 19, TypeScript, Tailwind CSS, shadcn/ui |
| i18n | `next-intl` |
| State / Forms | Zustand, React Hook Form, Zod |
| Auth / DB / Storage | Supabase Auth, Postgres, Storage |
| AI Generation | Google Gemini |
| Image Enhancement / Tooling | Topaz Labs Image API |
| Image Editing | Fabric.js |
| Background Removal | `@imgly/background-removal`, `onnxruntime-web` |
| Billing | Polar |
| Deployment | Docker standalone build + nginx |

## Архитектура

Приложение сейчас устроено вокруг трёх основных поверхностей:

1. Маркетинговые и SEO-страницы в [`app/[locale]`](/Users/aro/Altyn-AI-1/app/[locale])
2. Авторизованные dashboard-флоу в [`app/[locale]/(dashboard)`](/Users/aro/Altyn-AI-1/app/[locale]/(dashboard))
3. API routes в [`app/api`](/Users/aro/Altyn-AI-1/app/api)

Ключевые группы маршрутов:

- Auth: `login`, `register`, `forgot-password`, `reset-password`
- Dashboard: `dashboard`, `generate`, `cards`, `editor`, `remove-bg`, `library`, `history`, `settings`
- Публичные tools: [`app/[locale]/tools`](/Users/aro/Altyn-AI-1/app/[locale]/tools)
- FAQ: [`app/[locale]/faq`](/Users/aro/Altyn-AI-1/app/[locale]/faq)

Ключевые API routes:

- [`app/api/generate`](/Users/aro/Altyn-AI-1/app/api/generate) — основная авторизованная AI-генерация
- [`app/api/generate/demo`](/Users/aro/Altyn-AI-1/app/api/generate/demo) — демо-генерация
- [`app/api/generations/[generationId]`](/Users/aro/Altyn-AI-1/app/api/generations/[generationId]) — статус генерации и polling
- [`app/api/tools/upscale`](/Users/aro/Altyn-AI-1/app/api/tools/upscale) — публичный photo-enhancer flow
- [`app/api/tools/topaz-image`](/Users/aro/Altyn-AI-1/app/api/tools/topaz-image) — общий route для Topaz image-tools
- [`app/api/models`](/Users/aro/Altyn-AI-1/app/api/models) — управление custom model images
- [`app/api/checkout`](/Users/aro/Altyn-AI-1/app/api/checkout) — Polar checkout
- [`app/api/webhooks/polar`](/Users/aro/Altyn-AI-1/app/api/webhooks/polar) — billing webhook
- [`app/api/cron/cleanup`](/Users/aro/Altyn-AI-1/app/api/cron/cleanup) — cleanup job

## AI И Очереди

### Gemini

Gemini используется в основном generation flow.

- Provider: [`lib/ai/providers/gemini-provider.ts`](/Users/aro/Altyn-AI-1/lib/ai/providers/gemini-provider.ts)
- Queue registration: [`lib/queue/index.ts`](/Users/aro/Altyn-AI-1/lib/queue/index.ts)
- Текущие лимиты очереди:
  - `rpm: 40`
  - `rpd: 1000`
  - `maxConcurrent: 2`

Основное поведение генерации:

- пользователь загружает исходное фото товара
- создаётся generation job и попадает в очередь
- Gemini возвращает итоговое изображение
- для contact-sheet сценариев сервер разрезает 2x2 sheet на 4 отдельные панели
- результаты сохраняются в Supabase Storage и показываются в dashboard и library

### Topaz

Topaz используется для улучшения изображений и публичных image-tools.

- Provider: [`lib/ai/providers/topaz-provider.ts`](/Users/aro/Altyn-AI-1/lib/ai/providers/topaz-provider.ts)
- Upscale / enhancer core: [`lib/ai/topaz-upscale.ts`](/Users/aro/Altyn-AI-1/lib/ai/topaz-upscale.ts)
- Shared image tools: [`lib/ai/topaz-image-tools.ts`](/Users/aro/Altyn-AI-1/lib/ai/topaz-image-tools.ts)
- Текущие лимиты очереди:
  - `rpm: 60`
  - `maxConcurrent: 2`

## Тарифы

Pricing определяется в [`lib/config/plans.ts`](/Users/aro/Altyn-AI-1/lib/config/plans.ts).

| Тариф | Цена / месяц | Генераций |
| --- | --- | --- |
| Free | `$0` | `5` |
| Starter | `$1` | `20` |
| Pro | `$10` | `150` |
| Business | `$25` | `500` |

Текущий billing provider — Polar. Checkout создаётся через [`app/api/checkout/route.ts`](/Users/aro/Altyn-AI-1/app/api/checkout/route.ts), а подписочные события обрабатываются в [`app/api/webhooks/polar/route.ts`](/Users/aro/Altyn-AI-1/app/api/webhooks/polar/route.ts).

Примечание: в базе и отдельных служебных местах ещё могут встречаться legacy-названия полей, но активный платёжный контур сейчас именно через Polar.

## Структура Проекта

```text
app/
  [locale]/
    (auth)/
    (dashboard)/
    faq/
    tools/
  api/
  portal/
  terms/

components/
  auth/
  cards/
  dashboard/
  editor/
  faq/
  generate/
  landing/
  library/
  tools/
  ui/

lib/
  ai/
  config/
  generate/
  payments/
  queue/
  supabase/

messages/
supabase/
  migrations/
nginx/
```

## Локальная Разработка

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить переменные окружения

Создай `.env.local` и заполни его актуальными значениями.

Минимальный набор для запуска основного приложения:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
TOPAZ_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Если локально нужен billing flow, добавь ещё:

```bash
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_STARTER=
POLAR_PRODUCT_ID_PRO=
POLAR_PRODUCT_ID_BUSINESS=
POLAR_ENVIRONMENT=sandbox
```

Полный шаблон переменных лежит в [`.env.example`](/Users/aro/Altyn-AI-1/.env.example).
Для production-окружения используй `POLAR_ENVIRONMENT=production`.

### 3. Запустить проект

```bash
npm run dev
```

После этого открой [http://localhost:3000](http://localhost:3000).

## База Данных И Миграции

Все изменения схемы Supabase лежат в [`supabase/migrations`](/Users/aro/Altyn-AI-1/supabase/migrations).

Текущий набор миграций:

- `001_init.sql` — базовая схема
- `002_storage.sql` — storage buckets и политики
- `003_security.sql` и `006_security2.sql` — security hardening
- `004_user_models.sql` и `005_custom_model_urls.sql` — поддержка custom model
- `007_card_templates.sql` — данные шаблонов карточек
- `008_panel_variants.sql` — panel variants
- `009_free_credits.sql` — free-plan кредиты
- `010_google_oauth_profile.sql` — обновления Google OAuth profile
- `011_plan_business.sql` — поддержка business plan
- `012_security3.sql` — общий rate limiting и security follow-up

## Безопасность

Что уже есть в текущем коде:

- private storage для custom model photos
- signed URL access для чувствительных медиа
- общий rate limiting через Supabase RPC с in-memory fallback
- CSP и security headers в [`next.config.mjs`](/Users/aro/Altyn-AI-1/next.config.mjs)
- валидация подписи Polar webhook

## Деплой

В репозитории уже есть production deployment assets:

- [`Dockerfile`](/Users/aro/Altyn-AI-1/Dockerfile)
- [`docker-compose.yml`](/Users/aro/Altyn-AI-1/docker-compose.yml)
- [`docker-compose.dev.yml`](/Users/aro/Altyn-AI-1/docker-compose.dev.yml)
- [`nginx/`](/Users/aro/Altyn-AI-1/nginx)

`next.config.mjs` uses `output: 'standalone'`, so the production image can run as a self-contained Next.js server behind nginx.

## Что Отражает Этот README

Этот README теперь отражает текущее состояние проекта по таким зонам:

- Next.js 16 / React 19
- Supabase auth, storage, and migrations
- Gemini generation queue
- Topaz enhancement tools
- Polar billing

Если в коде меняются тарифы, env vars, очередь, маршруты или биллинг, этот файл лучше обновлять сразу вместе с кодом.
