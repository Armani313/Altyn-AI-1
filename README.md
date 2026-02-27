# Nurai AI Studio

B2B SaaS-платформа для ювелирных магазинов Казахстана. Позволяет загрузить фото украшения и за несколько секунд получить профессиональный AI лайфстайл-снимок — без фотосессии, модели и студии.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)
- [API маршруты](#api-маршруты)
- [Система тарифов](#система-тарифов)
- [Безопасность](#безопасность)
- [Деплой (Docker + Cloudflare)](#деплой-docker--cloudflare)
- [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 14 (App Router, TypeScript) |
| Стили | Tailwind CSS + shadcn/ui |
| Анимации | Framer Motion |
| Аутентификация | Supabase Auth (email + password) |
| База данных | Supabase (PostgreSQL) + Row Level Security |
| Хранилище файлов | Supabase Storage |
| AI генерация | Replicate API (img2img, SDXL / ControlNet) |
| Оплата | Kaspi Pay (HMAC-SHA256 webhook) |
| Деплой | Docker (standalone) + Cloudflare Tunnel |
| Шрифты | Playfair Display (заголовки) + DM Sans (текст) |

---

## Архитектура

```
                        ┌─────────────────────┐
                        │      Cloudflare      │
                        │  (CDN / DDoS / SSL)  │
                        └──────────┬──────────┘
                                   │ HTTPS
                        ┌──────────▼──────────┐
                        │   Docker Container   │
                        │   Next.js :3000      │
                        │   (standalone mode)  │
                        └──┬──────────────┬───┘
                           │              │
              ┌────────────▼───┐    ┌─────▼────────────┐
              │  Supabase      │    │  Replicate API   │
              │  ├─ Auth       │    │  (AI img2img)    │
              │  ├─ PostgreSQL │    └──────────────────┘
              │  └─ Storage    │
              └────────────────┘
                           │
              ┌────────────▼───┐
              │   Kaspi Pay    │
              │  (webhook)     │
              └────────────────┘
```

### Поток генерации изображения (авторизованный пользователь)

```
Браузер → POST /api/generate
  1. Проверка JWT (Supabase Auth)
  2. Проверка кредитов из profiles.credits_remaining
  3. Валидация файла (тип, размер, extension)
  4. Загрузка исходника → jewelry-uploads/{user_id}/{ts}-source.jpg
  5. Signed URL (1 ч) → передаётся в Replicate
  6. Replicate img2img (SDXL) → возвращает URL результата
  7. SSRF-проверка URL → скачиваем → re-upload → generated-images/
  8. Запись в таблицу generations (status: completed)
  9. Атомарный декремент credits_remaining (DB function)
 10. Ответ: { outputUrl, creditsRemaining }
```

### Поток демо-генерации (без регистрации)

```
Браузер → POST /api/generate/demo
  1. Cookie-чек (nurai_demo_used) — UX-слой
  2. IP rate-limit (in-memory Map, CF-Connecting-IP) — слой безопасности
  3. Загрузка → jewelry-uploads/demo/{ts}-source.jpg (service role)
  4. Replicate → результат
  5. Re-upload → generated-images/demo/{ts}-result.jpg
  6. Установка httpOnly cookie + запись IP
  7. Ответ: { outputUrl }
     └─ Кнопка скачать заблокирована в UI → CTA на регистрацию
```

### Поток оплаты (Kaspi Pay)

```
Пользователь → POST /api/payment
  1. Создаём запись subscriptions (status: pending)
  2. Вызов Kaspi Pay API → получаем paymentUrl
  3. Редирект на страницу оплаты Kaspi

Kaspi → POST /api/webhooks/kaspi
  1. Верификация HMAC-SHA256 (crypto.timingSafeEqual на Buffer)
  2. Проверка Amount >= ожидаемой цены тарифа
  3. APPROVED → обновляем subscription + plan + credits в profiles
  4. DECLINED/REVERSED → отмена подписки, возврат на free
```

---

## Структура проекта

```
nurai-ai-studio/
│
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Группа маршрутов без layout dashboard
│   │   ├── login/page.tsx        # Форма входа
│   │   └── register/page.tsx     # Форма регистрации
│   │
│   ├── (dashboard)/              # Защищённые маршруты (требуют auth)
│   │   ├── layout.tsx            # Sidebar + общий layout
│   │   ├── dashboard/page.tsx    # Рабочее пространство генерации (3 колонки)
│   │   ├── generate/page.tsx     # Алиас (TODO: расширить)
│   │   ├── library/page.tsx      # История генераций (server component)
│   │   ├── history/page.tsx      # История платежей
│   │   └── settings/
│   │       ├── page.tsx          # Профиль пользователя
│   │       └── billing/page.tsx  # Тарифы и оплата
│   │
│   ├── api/
│   │   ├── generate/
│   │   │   ├── route.ts          # POST — основная генерация (авторизованные)
│   │   │   └── demo/route.ts     # POST — бесплатная демо (без auth, IP rate-limit)
│   │   ├── upload/route.ts       # POST — загрузка файла в Storage
│   │   ├── payment/route.ts      # POST — создание заказа Kaspi Pay
│   │   ├── webhooks/
│   │   │   └── kaspi/route.ts    # POST — webhook от Kaspi (HMAC verified)
│   │   └── health/route.ts       # GET  — healthcheck для Docker
│   │
│   ├── globals.css               # CSS-переменные, design tokens, утилиты
│   ├── layout.tsx                # Root layout (шрифты, провайдеры)
│   └── page.tsx                  # Лендинг (Navbar + Hero + Demo + Features + Pricing)
│
├── components/
│   ├── auth/                     # LoginForm, RegisterForm (react-hook-form + zod)
│   ├── dashboard/                # Header (кредиты, аватар), Sidebar (навигация)
│   ├── generate/                 # UploadZone, TemplatePicker, ResultViewer
│   ├── landing/                  # Navbar, HeroSection, DemoSection, Features, Pricing, Footer
│   └── ui/                       # shadcn/ui компоненты (Button, Input, Dialog, ...)
│
├── lib/
│   ├── ai/
│   │   └── replicate.ts          # Клиент Replicate: промпты по категориям, polling, SSRF-guard
│   ├── config/
│   │   ├── plans.ts              # Тарифы: названия и лимиты кредитов (единственный источник)
│   │   └── routes.ts             # PROTECTED_ROUTES и AUTH_ROUTES для middleware
│   ├── payments/
│   │   └── kaspi.ts              # Kaspi Pay API: создание заказа, верификация webhook
│   ├── supabase/
│   │   ├── client.ts             # Браузерный клиент (createBrowserClient)
│   │   ├── server.ts             # Серверный клиент с cookies (createServerClient)
│   │   ├── service.ts            # Service-role клиент (обходит RLS, только server-side)
│   │   ├── middleware.ts         # Обновление сессии + редиректы по маршрутам
│   │   └── actions.ts            # Server Actions: logout (scope: global)
│   ├── constants.ts              # Типы/размеры файлов (единственный источник)
│   ├── motion.ts                 # Константа EASE для Framer Motion
│   ├── utils.ts                  # cn() — объединение классов Tailwind
│   └── validations.ts            # Zod-схемы для форм (login, register)
│
├── types/
│   └── database.types.ts         # TypeScript-типы, сгенерированные из схемы БД
│
├── supabase/
│   └── migrations/
│       ├── 001_init.sql          # Таблицы, RLS, триггер handle_new_user, decrement_credits
│       ├── 002_storage.sql       # Бакеты Storage и политики RLS для файлов
│       └── 003_security.sql      # Триггер: запрет самостоятельного повышения прав
│
├── middleware.ts                 # Root middleware: вызывает updateSession()
│
├── Dockerfile                   # Multi-stage: deps → builder → alpine runner
├── docker-compose.yml           # Production (порт привязан к 127.0.0.1)
├── docker-compose.dev.yml       # Development (hot-reload, volume mount)
├── .dockerignore
├── .env.example                 # Шаблон для продакшна (Docker)
├── .env.local.example           # Шаблон для локальной разработки
├── next.config.mjs              # standalone output, CSP, HSTS, Cloudflare
├── tailwind.config.ts           # Rose Gold + Cream палитра, кастомные тени
└── tsconfig.json
```

---

## База данных

### Таблицы

```sql
profiles          -- 1:1 с auth.users, создаётся автоматически при регистрации
  id              uuid  PK → auth.users
  business_name   text
  contact_name    text
  phone           text
  plan            text  CHECK IN ('free','starter','pro','enterprise')
  credits_remaining integer ≥ 0

templates         -- Шаблоны поз/стилей, управляются админом
  id              uuid  PK
  name, description, thumbnail_url
  category        CHECK IN ('rings','necklaces','bracelets','earrings','universal')
  is_active, is_premium, sort_order

generations       -- История AI-генераций
  id              uuid  PK
  user_id         → auth.users
  template_id     → templates (nullable)
  input_image_url text  (путь в jewelry-uploads)
  output_image_url text (публичный URL из generated-images)
  status          CHECK IN ('pending','processing','completed','failed')
  error_message   text  (только user-safe текст ≤ 200 символов)
  metadata        jsonb (aspect_ratio, template_category)

subscriptions     -- История платежей Kaspi Pay
  id              uuid  PK  (используется как OrderId)
  user_id         → auth.users
  plan            text
  status          CHECK IN ('pending','active','cancelled','expired')
  kaspi_order_id  text
  amount          numeric
  starts_at, expires_at timestamptz
```

### Ключевые механизмы

**`handle_new_user()`** — триггер на `auth.users INSERT`: создаёт строку в `profiles` с `plan='free'` и `credits_remaining=3`.

**`decrement_credits(p_user_id)`** — атомарная SQL-функция: `UPDATE profiles SET credits_remaining = credits_remaining - 1 WHERE id = p_user_id AND credits_remaining > 0 RETURNING credits_remaining`. Возвращает -1 если кредитов нет.

**`profiles_prevent_privilege_escalation()`** — BEFORE UPDATE триггер: сбрасывает `plan` и `credits_remaining` к старым значениям, если вызывающая роль ≠ `service_role`. Защищает от самостоятельного повышения прав через публичный anon ключ.

### Хранилище (Supabase Storage)

| Бакет | Доступ | Путь | Назначение |
|-------|--------|------|-----------|
| `jewelry-uploads` | Приватный (signed URL) | `{user_id}/{ts}-source.jpg` | Исходные фото |
| `generated-images` | Публичный | `{user_id}/{gen_id}-result.jpg` | Результаты генерации |

Папка `demo/` в обоих бакетах используется для анонимных демо-генераций (через service-role клиент).

---

## API маршруты

### `POST /api/generate`
Требует: JWT-сессия, кредиты > 0
Тело: `multipart/form-data` — `image`, `template_id?`, `template_category?`, `aspect_ratio?`
Ответ: `{ generationId, outputUrl, creditsRemaining }`

### `POST /api/generate/demo`
Публичный. Rate-limit: IP (24 ч, in-memory) + httpOnly cookie.
Тело: `multipart/form-data` — `image`, `template_category?`
Ответ: `{ outputUrl }` + устанавливает `nurai_demo_used` cookie

### `POST /api/upload`
Требует: JWT-сессия
Загружает файл в `jewelry-uploads/{user_id}/` напрямую (без генерации)

### `POST /api/payment`
Требует: JWT-сессия
Тело: `{ planKey: 'starter' | 'pro' }`
Создаёт запись `subscriptions`, вызывает Kaspi Pay API, возвращает `{ paymentUrl }`

### `POST /api/webhooks/kaspi`
Публичный, но защищён HMAC-SHA256 (`X-Kaspi-Signature`).
Активирует подписку при `Status: APPROVED` после проверки суммы.

### `GET /api/health`
Публичный. Ответ: `{ status: 'ok' }`. Используется Docker HEALTHCHECK.

---

## Система тарифов

| Тариф | Кредитов/мес | Цена | Описание |
|-------|-------------|------|---------|
| `free` | 3 | — | При регистрации |
| `starter` | 30 | 9 900 ₸/мес | Тариф Старт |
| `pro` | 150 | 29 900 ₸/мес | Бренд Бизнес |
| `enterprise` | 500 | договорная | — |

Конфигурация — единственный источник: `lib/config/plans.ts`. Kaspi Pay цены — `lib/payments/kaspi.ts`.

---

## Безопасность

| Механизм | Реализация |
|---------|-----------|
| SSRF-защита | `assertSafeOutputUrl()` в `lib/ai/replicate.ts` — allowlist хостов Replicate перед любым `fetch()` |
| RLS эскалация прав | Триггер `003_security.sql` — только `service_role` меняет `plan`/`credits_remaining` |
| Webhook подпись | `crypto.timingSafeEqual` на Buffer (Node.js native), no-secret = always reject |
| IP rate-limit | In-memory Map по `CF-Connecting-IP` в демо-роуте (для multi-instance → Redis) |
| CSP | `Content-Security-Policy` в заголовках Next.js (`unsafe-eval` только в dev) |
| HSTS | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| Входные данные | Allowlists для `templateCategory`, `aspectRatio`; UUID-regex для `templateId` |
| Cookie | `httpOnly`, `sameSite: lax`, `secure: true` в production |
| Logout | `signOut({ scope: 'global' })` — инвалидирует сессию на всех устройствах |

---

## Деплой (Docker + Cloudflare)

### Сборка и запуск

```bash
# 1. Скопировать шаблон переменных
cp .env.example .env
# Заполнить .env реальными значениями

# 2. Собрать образ (NEXT_PUBLIC_* бекаются в JS на этапе сборки)
docker-compose build

# 3. Запустить в фоне
docker-compose up -d

# 4. Проверить
curl http://localhost:3000/api/health
```

### Multi-stage Dockerfile

```
Stage 1 deps    — node:20-alpine, npm ci (все зависимости)
Stage 2 builder — npm run build с NEXT_PUBLIC_* ARG → .next/standalone
Stage 3 runner  — node:20-alpine, non-root user (nextjs:1001)
                  только .next/standalone + .next/static
                  итоговый образ ~180 MB
```

### Cloudflare Tunnel (рекомендуется)

Скрывает IP сервера, не требует открытых портов:

```bash
# Установить cloudflared на сервере
# Создать Named Tunnel в Cloudflare Dashboard → Zero Trust → Tunnels
# В конфиге туннеля: ingress url: http://localhost:3000
```

Без туннеля — порт привязан к `127.0.0.1:3000` (в `docker-compose.yml`), доступ снаружи только через nginx/Cloudflare.

### Разделение переменных

| Тип | Когда нужны | Где передаются |
|-----|------------|----------------|
| `NEXT_PUBLIC_*` | Сборка (бекаются в JS) | `docker-compose build args:` |
| Секреты (ключи API) | Рантайм | `docker-compose environment:` → `.env` |

---

## Локальная разработка

### Требования
- Node.js 20+
- Аккаунт Supabase (создать проект на [supabase.com](https://supabase.com))
- Аккаунт Replicate (API-токен на [replicate.com](https://replicate.com))

### Быстрый старт

```bash
# 1. Клонировать и установить зависимости
git clone <repo>
cd nurai-ai-studio
npm install

# 2. Настроить переменные окружения
cp .env.local.example .env.local
# Заполнить .env.local (см. раздел ниже)

# 3. Применить миграции БД
# Supabase Dashboard → SQL Editor → выполнить по порядку:
#   supabase/migrations/001_init.sql
#   supabase/migrations/002_storage.sql
#   supabase/migrations/003_security.sql

# 4. Запустить
npm run dev
# → http://localhost:3000
```

### Через Docker (dev)

```bash
docker-compose -f docker-compose.dev.yml up
# Монтирует исходники, поддерживает hot-reload
```

---

## Переменные окружения

| Переменная | Тип | Описание |
|-----------|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | build + runtime | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | build + runtime | Публичный anon ключ |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret**, runtime | Service-role ключ (только server-side) |
| `REPLICATE_API_TOKEN` | **secret**, runtime | API-токен Replicate |
| `REPLICATE_MODEL` | runtime | Слаг модели: `owner/name` |
| `REPLICATE_MODEL_VERSION` | runtime | SHA версии (приоритет над `REPLICATE_MODEL`) |
| `KASPI_MERCHANT_ID` | runtime | ID мерчанта Kaspi Pay |
| `KASPI_API_KEY` | **secret**, runtime | API-ключ Kaspi Pay |
| `KASPI_WEBHOOK_SECRET` | **secret**, runtime | HMAC-секрет для верификации webhook (≥32 символа) |
| `NEXT_PUBLIC_APP_URL` | build + runtime | Публичный URL приложения (`https://studio.nurai.kz`) |
