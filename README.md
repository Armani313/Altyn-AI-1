# Luminify

B2B SaaS-платформа для магазинов Казахстана. Позволяет загрузить фото товара и за несколько секунд получить профессиональный AI лайфстайл-снимок или товарную карточку — без фотосессии, модели и студии.

Поддерживаемые категории товаров: **украшения, часы, сумки, платки, головные уборы, верхняя одежда, брюки/юбки**.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [AI-генерация](#ai-генерация)
- [Очередь генерации](#очередь-генерации)
- [Структура проекта](#структура-проекта)
- [База данных](#база-данных)
- [API маршруты](#api-маршруты)
- [Система тарифов](#система-тарифов)
- [Безопасность](#безопасность)
- [Продакшн сервер](#продакшн-сервер)
- [Деплой](#деплой)
- [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Фреймворк | Next.js 14.2 (App Router, TypeScript) |
| Стили | Tailwind CSS + shadcn/ui (Rose Gold дизайн-система) |
| Анимации | Framer Motion |
| Аутентификация | Supabase Auth (email + password) |
| База данных | Supabase (PostgreSQL) + Row Level Security |
| Хранилище файлов | Supabase Storage |
| AI генерация | Google Gemini `gemini-3.1-flash-image-preview` (Nano Banana 2) |
| Оплата | Kaspi Pay (HMAC-SHA256 webhook) |
| Деплой | Docker (standalone) + nginx + VPS |
| Шрифты | Playfair Display (заголовки) + DM Sans (текст) |
| Формы | react-hook-form + zod |

---

## Архитектура

```
                        ┌─────────────────────┐
                        │      Cloudflare      │
                        │  (CDN / DDoS / SSL)  │
                        └──────────┬──────────┘
                                   │ HTTPS
                        ┌──────────▼──────────┐
                        │      nginx           │
                        │  (reverse proxy)     │
                        │  ports 80 / 443      │
                        └──────────┬──────────┘
                                   │ http://127.0.0.1:3000
                        ┌──────────▼──────────┐
                        │   Docker Container   │
                        │   Next.js :3000      │
                        │   (standalone mode)  │
                        └──┬──────────────┬───┘
                           │              │
              ┌────────────▼───┐    ┌─────▼────────────┐
              │  Supabase      │    │  Google Gemini   │
              │  ├─ Auth       │    │  Flash Image     │
              │  ├─ PostgreSQL │    │  (Nano Banana 2) │
              │  └─ Storage    │    └──────────────────┘
              └────────────────┘
                           │
              ┌────────────▼───┐
              │   Kaspi Pay    │
              │  (webhook)     │
              └────────────────┘
```

### Поток генерации (авторизованный пользователь)

```
Браузер → POST /api/generate
  1.  Проверка JWT (Supabase Auth)
  2.  Rate-limit: 10 запросов / 60 сек на пользователя
  3.  Проверка credits_remaining > 0
  4.  Валидация файла (тип, размер ≤10 МБ, magic bytes)
  5.  Загрузка → jewelry-uploads/{user_id}/{ts}-source.jpg
  6.  Создание записи generations (status: processing)
  7.  Атомарный декремент кредитов ПЕРЕД AI-вызовом
  8.  Постановка в очередь → AI Queue (RPM/RPD rate limiter)
  9.  Gemini generateContent → inline base64 PNG/JPEG
 10.  Re-upload → generated-images/{user_id}/{gen_id}-result.jpg
 11.  Обновление generations (status: completed)
 12.  Ответ: { generationId, outputUrl, creditsRemaining }
      При ошибке: refund_credit RPC, generations (status: failed)
```

### Поток демо-генерации (без регистрации)

```
Браузер → POST /api/generate/demo
  1. Cookie-чек (luminify_demo_used) — UX-слой
  2. IP rate-limit (CF-Connecting-IP, in-memory Map, 24 ч) — слой безопасности
  3. Загрузка → jewelry-uploads/demo/{ts}-source.jpg (service role)
  4. Прямой вызов Gemini (без очереди)
  5. Re-upload → generated-images/demo/{uuid}-result.jpg
  6. Установка httpOnly cookie + запись IP
  7. Ответ: { outputUrl }
```

### Поток оплаты (Kaspi Pay)

```
Пользователь → POST /api/payment
  1. Создаём запись subscriptions (status: pending)
  2. Kaspi Pay API → paymentUrl
  3. Редирект на страницу оплаты

Kaspi → POST /api/webhooks/kaspi
  1. Верификация HMAC-SHA256 (crypto.timingSafeEqual на Buffer)
  2. Проверка Amount >= ожидаемой цены тарифа
  3. APPROVED → subscription (active) + plan + credits в profiles
  4. DECLINED/REVERSED → subscription (cancelled)
```

---

## AI-генерация

### Модель

**Google Gemini `gemini-3.1-flash-image-preview`** (Nano Banana 2)

| Лимит | Значение | Конфиг (80%) |
|-------|---------|-------------|
| RPM   | 100     | 80          |
| TPM   | 200 000 | —           |
| RPD   | 1 000   | 1 000 (hard cap) |

Модель переопределяется через `GEMINI_MODEL` в `.env`.

### Режимы генерации

| `generate_mode` / параметры | Описание | Промт |
|---|---|---|
| Без флагов + `model_id` | Лайфстайл с моделью (2 фото: модель + товар) | `COMPOSITE_PROMPTS[productType]` |
| Без флагов, без `model_id` | Standalone лайфстайл (1 фото: товар) | `STANDALONE_PROMPTS[productType]` |
| `model_id: macro` | Макро-фото крупным планом | `MACRO_PROMPT` |
| `generate_mode: card-free` | Товарная карточка без шаблона (AI выбирает дизайн) | `buildCardFreePrompt()` |
| `template_id: tpl-XX` | Товарная карточка по шаблону | `buildCardTemplatePrompt()` |

### Типы товаров (`product_type`)

`jewelry` · `watches` · `bags` · `scarves` · `headwear` · `outerwear` · `bottomwear`

Каждый тип имеет свой composite-промт (с моделью) и standalone-промт.

### Карточка без шаблона (`card-free`)

AI проходит 4 фазы **молча** (только IMAGE на выходе, без текста):

1. **Product Analysis** — категория, материал, текстуры, цветовая история, Brand Vibe
2. **Dynamic Staging** — выбор одного из 4 стилей:
   - A. Hero Levitation — антигравитация, частицы
   - B. Premium Pedestal — постамент, chiaroscuro
   - C. Macro Infographic — текстура + callout-выноски
   - D. Environmental Lifestyle — естественная среда, боке
3. **Marketing Review** — если передан текст: заголовок + 3 bullet points + trust badge; исправление опечаток и противоречий с фото
4. **Final Render** — 8K, UE5 quality, rim lighting, edge-to-edge

### Параметры карточки (опциональные)

| Поле формы | Макс. длина | Назначение |
|---|---|---|
| `product_name` | 100 | Название товара |
| `brand_name` | 60 | Бренд |
| `product_description` | 500 | Описание / selling points |

---

## Очередь генерации

`lib/queue/` — in-process очередь с rate limiting, concurrency cap и retry.

```
QueueManager
  ├── RateLimiter
  │     ├── Token bucket (RPM)  — refill rpm/60 tokens/sec
  │     └── Daily counter (RPD) — сброс в UTC-полночь
  ├── inFlight Map<ProviderId, number>  — concurrency cap
  └── Retry: isTransient(err) → backoff [3s, 10s, 30s]
```

**RPD exhausted** → джоб немедленно `failed` с сообщением "через ~N ч." (не идёт в retry).

**GeminiProvider config:**

```typescript
rpm:           80   // 80% от лимита 100
rpd:           1000 // hard daily cap
maxConcurrent: 4
retryDelays:   [3_000, 10_000, 30_000]
```

---

## Структура проекта

```
luminify/
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + Header
│   │   ├── dashboard/page.tsx      # Рабочее пространство (3 колонки)
│   │   ├── library/page.tsx        # История генераций
│   │   ├── history/page.tsx        # История платежей
│   │   └── settings/
│   │       ├── page.tsx            # Профиль
│   │       └── billing/page.tsx    # Тарифы и оплата
│   │
│   ├── api/
│   │   ├── generate/
│   │   │   ├── route.ts            # POST — основная генерация (auth required)
│   │   │   └── demo/route.ts       # POST — бесплатное демо (IP rate-limit)
│   │   ├── upload/route.ts
│   │   ├── payment/route.ts
│   │   ├── webhooks/kaspi/route.ts
│   │   └── health/route.ts         # GET → { status: 'ok' }
│   │
│   ├── globals.css                 # CSS-переменные, design tokens
│   ├── layout.tsx
│   └── page.tsx                    # Лендинг
│
├── components/
│   ├── auth/                       # LoginForm, RegisterForm
│   ├── dashboard/                  # Header, Sidebar
│   ├── generate/                   # UploadZone, TemplatePicker, ResultViewer
│   ├── landing/                    # Navbar, Hero, Demo, Features, Pricing, Footer
│   └── ui/                         # shadcn/ui компоненты
│
├── lib/
│   ├── ai/
│   │   ├── gemini.ts               # Gemini клиент: все промты, generateJewelryPhoto()
│   │   ├── moderation.ts           # sanitizePrompt(), checkPrompt()
│   │   ├── replicate.ts            # Legacy (не используется)
│   │   └── providers/
│   │       └── gemini-provider.ts  # AIProvider impl: config rpm/rpd/maxConcurrent
│   │
│   ├── queue/
│   │   ├── index.ts                # aiQueue singleton + GeminiProvider регистрация
│   │   ├── queue-manager.ts        # QueueManager: enqueue, waitForJob, tick loop
│   │   ├── rate-limiter.ts         # Token bucket (RPM) + daily counter (RPD)
│   │   ├── job-store.ts            # In-memory JobStore с TTL
│   │   └── types.ts                # QueueJob, AIProvider, ProviderConfig (rpm, rpd)
│   │
│   ├── card-templates.ts           # CARD_TEMPLATE_MAP: tpl-01..N → imageUrl
│   ├── config/
│   │   ├── plans.ts                # Тарифы: кредиты, цены (единственный источник)
│   │   └── routes.ts               # PROTECTED_ROUTES, AUTH_ROUTES
│   ├── constants.ts                # Типы файлов, MODEL_PHOTO_MAP, VALID_MODEL_IDS
│   ├── payments/kaspi.ts           # Kaspi Pay API + webhook verification
│   ├── rate-limit.ts               # checkRateLimit() — per-user in-memory
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   ├── server.ts               # createServerClient + cookies
│   │   ├── service.ts              # Service-role client (bypasses RLS)
│   │   ├── middleware.ts           # Session refresh
│   │   └── actions.ts              # Server Actions: logout
│   ├── utils/security.ts           # assertSafeStorageUrl, assertSafeImageBytes
│   ├── motion.ts                   # EASE constant для Framer Motion
│   ├── utils.ts                    # cn()
│   └── validations.ts              # Zod-схемы
│
├── types/database.types.ts
│
├── supabase/migrations/
│   ├── 001_init.sql                # Таблицы, RLS, handle_new_user, decrement_credits
│   ├── 002_storage.sql             # Бакеты + RLS политики
│   └── 003_security.sql            # Триггер: запрет самоэскалации прав
│
├── public/
│   ├── models/                     # Фото моделей (1.png .. N.png)
│   └── exCardTemplate/             # Шаблоны карточек (tpl-01 .. N)
│
├── scripts/server-harden.sh        # SSH + firewall hardening для Ubuntu
├── middleware.ts                   # Root middleware
├── Dockerfile                      # Multi-stage: deps → builder → alpine runner
├── docker-compose.yml              # Production
├── docker-compose.dev.yml          # Development (hot-reload)
├── next.config.mjs                 # standalone, CSP, HSTS, images.unoptimized
└── tailwind.config.ts              # Rose Gold + Cream палитра
```

---

## База данных

### Таблицы

```sql
profiles          -- 1:1 с auth.users, создаётся триггером при регистрации
  id                  uuid  PK → auth.users
  business_name       text
  contact_name        text
  phone               text
  plan                text  CHECK IN ('free','starter','pro','enterprise')
  credits_remaining   integer ≥ 0
  custom_model_urls   text[]  -- URL кастомных моделей пользователя

templates         -- Шаблоны поз, управляются админом
  id              uuid  PK
  name, description, thumbnail_url
  category        CHECK IN ('rings','necklaces','bracelets','earrings','universal')
  is_active, is_premium, sort_order

generations       -- История AI-генераций
  id              uuid  PK
  user_id         → auth.users
  template_id     → templates (nullable)
  input_image_url text   (путь в jewelry-uploads)
  output_image_url text  (публичный URL из generated-images)
  status          CHECK IN ('pending','processing','completed','failed')
  error_message   text   (только user-safe текст, ≤ 200 символов)
  metadata        jsonb  (aspect_ratio, template_category, model_id, product_type)

subscriptions     -- История платежей Kaspi Pay
  id              uuid  PK  (используется как OrderId)
  user_id         → auth.users
  plan            text
  status          CHECK IN ('pending','active','cancelled','expired')
  kaspi_order_id  text
  amount          numeric
  starts_at, expires_at timestamptz
```

### Ключевые DB-механизмы

**`handle_new_user()`** — триггер `AFTER INSERT ON auth.users`: создаёт `profiles` с `plan='free'`, `credits_remaining=3`.

**`decrement_credits(p_user_id)`** — атомарная функция:
```sql
UPDATE profiles SET credits_remaining = credits_remaining - 1
WHERE id = p_user_id AND credits_remaining > 0
RETURNING credits_remaining  -- возвращает -1 если кредитов нет
```

**`refund_credit(p_user_id)`** — обратная операция при ошибке AI.

**`profiles_prevent_privilege_escalation()`** — BEFORE UPDATE триггер: сбрасывает `plan`/`credits_remaining` к старым значениям если `current_role ≠ 'service_role'`. Защищает от повышения прав через публичный anon ключ.

### Хранилище

| Бакет | Доступ | Путь | Назначение |
|-------|--------|------|-----------|
| `jewelry-uploads` | Приватный (signed URL, 1ч) | `{user_id}/{ts}-source.{ext}` | Исходные фото |
| `generated-images` | Публичный | `{user_id}/{gen_id}-result.{ext}` | Результаты |

Папка `demo/` в обоих бакетах — для анонимных демо (через service-role).

---

## API маршруты

### `POST /api/generate`
**Auth required.** Кредиты > 0.

Поля `multipart/form-data`:

| Поле | Тип | Описание |
|------|-----|---------|
| `image` | File | Фото товара (JPG/PNG/WebP/HEIC, ≤10 МБ) |
| `model_id` | string? | ID фото-модели, `macro`, или `custom-0..N` |
| `product_type` | string? | `jewelry`\|`watches`\|`bags`\|`scarves`\|`headwear`\|`outerwear`\|`bottomwear` |
| `generate_mode` | string? | `card-free` для карточки без шаблона |
| `template_id` | string? | UUID шаблона БД или `tpl-XX` для карточки |
| `aspect_ratio` | string? | `1:1`\|`9:16`\|`4:5` |
| `user_prompt` | string? | Дополнительный стиль (модерируется) |
| `product_name` | string? | Название для карточки (≤100) |
| `brand_name` | string? | Бренд (≤60) |
| `product_description` | string? | Описание (≤500) |

Ответ: `{ success, generationId, outputUrl, creditsRemaining }`

### `POST /api/generate/demo`
Публичный. Rate-limit: IP (24ч) + httpOnly cookie.
Поля: `image`, `model_id?`
Ответ: `{ success, outputUrl }`

### `POST /api/payment`
Auth required. Тело: `{ planKey: 'starter' | 'pro' }`
Ответ: `{ paymentUrl }`

### `POST /api/webhooks/kaspi`
Публичный, HMAC-SHA256 защита (`X-Kaspi-Signature`).

### `GET /api/health`
`{ status: 'ok' }` — используется Docker HEALTHCHECK.

---

## Система тарифов

| Тариф | Кредитов | Цена | Описание |
|-------|---------|------|---------|
| `free` | 3 | — | При регистрации |
| `starter` | 30 | 9 900 ₸/мес | Старт |
| `pro` | 150 | 29 900 ₸/мес | Бренд Бизнес |
| `enterprise` | 500 | договорная | — |

Единственный источник: `lib/config/plans.ts`.

---

## Безопасность

| Механизм | Файл | Описание |
|---------|------|---------|
| SSRF (Storage URLs) | `lib/utils/security.ts` | `assertSafeStorageUrl()` — allowlist Supabase Storage перед fetch кастомных моделей |
| SSRF (AI output) | `lib/ai/replicate.ts` | `assertSafeOutputUrl()` — legacy guard |
| Magic bytes | `lib/utils/security.ts` | `assertSafeImageBytes()` — проверка реального типа файла по заголовкам |
| RLS эскалация | `supabase/migrations/003_security.sql` | Триггер: только `service_role` меняет `plan`/`credits_remaining` |
| Webhook | `lib/payments/kaspi.ts` | `crypto.timingSafeEqual` на Buffer; нет секрета = всегда reject |
| IP rate-limit | `app/api/generate/demo/route.ts` | In-memory Map по `CF-Connecting-IP` |
| User rate-limit | `lib/rate-limit.ts` | 10 req/60s per user на `/api/generate` |
| Входные данные | `app/api/generate/route.ts` | Allowlists для `product_type`, `aspect_ratio`; UUID-regex для `templateId`; `tpl-\d+` для cardTemplateId |
| Model slug | `lib/ai/gemini.ts` | `MODEL_SLUG_REGEX` — валидация перед URL-интерполяцией |
| CSP / HSTS | `next.config.mjs` | Content-Security-Policy + HSTS preload |
| Prompt moderation | `lib/ai/moderation.ts` | sanitize + blocklist check на user_prompt |
| Cookie | везде | `httpOnly`, `sameSite: lax`, `secure` в production |
| AI error sanitize | `app/api/generate/route.ts` | Ошибка обрезается до 200 символов перед сохранением в БД |
| `/_next/image` DoS | `next.config.mjs` | `images.unoptimized: true` — отключает optimizer endpoint |

**Открытые вопросы:** Next.js 14.x RSC deserialization (GHSA-h25m-26qc-wcjf) — fix требует апгрейда на 15.x.

---

## Продакшн сервер

| Параметр | Значение |
|---------|---------|
| IP | `85.202.193.146` |
| OS | Ubuntu 24.04.4 LTS |
| RAM | 2 GB (swap 2 GB) |
| Диск | 40 GB SSD (~7 GB занято) |
| SSH | `ssh -i ~/.ssh/luminify_deploy ubuntu@85.202.193.146` |
| Контейнер | `luminify-app-1` (healthy, порт `127.0.0.1:3000`) |
| Reverse proxy | nginx (порты 80/443) |
| Cloudflared | установлен, в настоящее время inactive |
| Проект на сервере | `/home/ubuntu/luminify/` |

---

## Деплой

Git-репозитория на сервере нет. Деплой — ручной: scp + docker build.

### Быстрый деплой (изменённые файлы)

```bash
# 1. Скопировать изменённые файлы
scp -i ~/.ssh/luminify_deploy \
  lib/ai/gemini.ts \
  ubuntu@85.202.193.146:/home/ubuntu/luminify/lib/ai/

# 2. Пересобрать и перезапустить
ssh -i ~/.ssh/luminify_deploy ubuntu@85.202.193.146 "
  cd ~/luminify
  docker compose build
  docker compose up -d
"

# 3. Проверить
ssh -i ~/.ssh/luminify_deploy ubuntu@85.202.193.146 \
  "docker ps && curl -s http://localhost:3000/api/health"

# 4. Очистить build cache (накапливает ~18 GB за несколько деплоев)
ssh -i ~/.ssh/luminify_deploy ubuntu@85.202.193.146 \
  "docker builder prune -af"
```

### Multi-stage Dockerfile

```
Stage 1  deps     — node:20-alpine, npm ci (production deps)
Stage 2  builder  — npm run build, NEXT_PUBLIC_* как ARG
Stage 3  runner   — node:20-alpine, non-root user nextjs:1001
                    только .next/standalone + .next/static
                    итоговый образ ~767 MB
```

### Разделение переменных

| Тип | Когда нужны | Где передаются |
|-----|------------|----------------|
| `NEXT_PUBLIC_*` | Build-time (вшиваются в JS) | `docker-compose build args:` |
| Секреты | Runtime | `docker-compose environment:` → `.env` |

---

## Локальная разработка

### Требования
- Node.js 20+
- Аккаунт Supabase
- Google AI Studio API Key (`GEMINI_API_KEY`)

### Быстрый старт

```bash
git clone <repo>
cd luminify
npm install

cp .env.local.example .env.local
# Заполнить .env.local

# Применить миграции (Supabase Dashboard → SQL Editor):
# 1. supabase/migrations/001_init.sql
# 2. supabase/migrations/002_storage.sql
# 3. supabase/migrations/003_security.sql

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
| `NEXT_PUBLIC_APP_URL` | build + runtime | Публичный URL (`https://luminify.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret**, runtime | Service-role ключ (только server-side) |
| `GEMINI_API_KEY` | **secret**, runtime | Google AI Studio API Key |
| `GEMINI_MODEL` | runtime | Переопределить модель (default: `gemini-3.1-flash-image-preview`) |
| `KASPI_MERCHANT_ID` | runtime | ID мерчанта Kaspi Pay |
| `KASPI_API_KEY` | **secret**, runtime | API-ключ Kaspi Pay |
| `KASPI_WEBHOOK_SECRET` | **secret**, runtime | HMAC-секрет для webhook (≥32 символа) |
