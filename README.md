# FlowPay Frontend

Локальная SPA-панель для управления выплатами через Bybit P2P.

## Стек

- React 19 и TypeScript
- Vite
- TanStack Query
- React Hook Form и Zod
- React Router
- CSS design tokens без внешней UI-библиотеки

## Локальный запуск

Backend должен быть доступен на `http://localhost:8080`.
Перед запуском настройте `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` и
`AUTH_REMEMBER_ME_KEY` в backend.

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`. Vite проксирует запросы `/api` на backend.
При первом открытии появится форма входа. После успешной авторизации браузер
останется авторизованным до явного выхода.

Frontend всегда использует относительные адреса `/api/*`. В dev-режиме Vite проксирует их
на backend, а в production frontend и backend работают через один HTTPS-origin.

Если backend запущен на другом локальном порту, поменяйте только цель dev-прокси:

```dotenv
VITE_DEV_PROXY_TARGET=http://localhost:18080
```

## Проверки

```bash
npm run lint
npm run format:check
npm run build
```

Результат production-сборки создаётся в `dist/`. Инструкция первого ручного деплоя через
Caddy находится в [DEPLOY.md](./DEPLOY.md).

## Docker

```bash
docker build -t flowpay-frontend .
docker run --rm -p 3000:80 -e BACKEND_URL=http://host.docker.internal:8080 flowpay-frontend
```

В Docker Compose значение `BACKEND_URL` по умолчанию равно `http://backend:8080`.

## Структура

```text
src/
  app/       # инициализация, провайдеры, глобальные стили
  pages/     # маршруты приложения
  widgets/   # крупные блоки интерфейса
  features/  # пользовательские действия и бизнес-сценарии
  entities/  # модели, API и UI доменных сущностей
  shared/    # API-клиент, утилиты и переиспользуемый UI
```
