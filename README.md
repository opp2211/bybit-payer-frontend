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

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`. Vite проксирует запросы `/api` на backend.

Для другого адреса API создайте `.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

При прямом URL backend должен разрешать CORS. Для стандартного локального сценария оставьте
переменную пустой и используйте Vite proxy.

## Проверки

```bash
npm run lint
npm run format:check
npm run build
```

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
