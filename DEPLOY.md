# Ручной деплой frontend

Production-сборка всегда обращается к backend по относительным адресам `/api/*`.
Каталог результата сборки: `dist/`. Каталог сайта на VPS: `/var/www/bybit-payer`.

Локальные команды ниже рассчитаны на PowerShell:

```powershell
$SSH_KEY = "$HOME\.ssh\LightsailDefaultKey-eu-central-1.pem"
$VPS = "ubuntu@51.102.86.38"
```

## 1. Локальная сборка

В корне frontend-проекта:

```powershell
npm ci
npm run lint
npm run format:check
npm run build
```

## 2. Копирование сборки

Сначала копируем файлы во временный каталог пользователя:

```powershell
ssh -i $SSH_KEY $VPS 'rm -rf /tmp/bybit-payer-frontend && mkdir -p /tmp/bybit-payer-frontend'
scp -i $SSH_KEY -r dist/. "${VPS}:/tmp/bybit-payer-frontend/"
```

Затем заменяем каталог сайта, сохраняя предыдущую версию и автоматически восстанавливая
её при ошибке:

```powershell
$deployScript = @'
set -euo pipefail

release="/var/www/bybit-payer.release"
current="/var/www/bybit-payer"
backup="/var/www/bybit-payer.previous"

rollback() {
  if [ ! -d "$current" ] && [ -d "$backup" ]; then
    mv "$backup" "$current"
  fi
}
trap rollback EXIT

rm -rf "$release"
install -d -m 0755 "$release"
cp -a /tmp/bybit-payer-frontend/. "$release"/
chown -R root:root "$release"
find "$release" -type d -exec chmod 0755 {} +
find "$release" -type f -exec chmod 0644 {} +

rm -rf "$backup"
if [ -d "$current" ]; then
  mv "$current" "$backup"
fi
mv "$release" "$current"
rm -rf /tmp/bybit-payer-frontend
trap - EXIT
'@ -replace "`r", ""

$deployScript | ssh -i $SSH_KEY $VPS 'sudo bash -se'
```

Для отката файлов frontend:

```powershell
$rollbackScript = @'
set -euo pipefail
test -d /var/www/bybit-payer.previous
rm -rf /var/www/bybit-payer.failed
mv /var/www/bybit-payer /var/www/bybit-payer.failed
mv /var/www/bybit-payer.previous /var/www/bybit-payer
'@ -replace "`r", ""

$rollbackScript | ssh -i $SSH_KEY $VPS 'sudo bash -se'
```

## 3. Caddy

Готовая конфигурация находится в `deploy/Caddyfile`:

```caddyfile
bypayer.maltsev.fun {
    encode zstd gzip

    handle /api/* {
        reverse_proxy 127.0.0.1:8080
    }

    handle {
        root * /var/www/bybit-payer
        try_files {path} /index.html
        file_server
    }

    log
}
```

Скопируйте его на VPS и безопасно примените:

```powershell
scp -i $SSH_KEY deploy/Caddyfile "${VPS}:/tmp/Caddyfile.bybit-payer"
$caddyScript = @'
set -euo pipefail

cp -a /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.backup.$(date +%Y%m%d-%H%M%S)"
install -o root -g root -m 0644 /tmp/Caddyfile.bybit-payer /etc/caddy/Caddyfile.candidate
caddy validate --config /etc/caddy/Caddyfile.candidate --adapter caddyfile
mv /etc/caddy/Caddyfile.candidate /etc/caddy/Caddyfile
systemctl reload caddy
systemctl is-active --quiet caddy
rm -f /tmp/Caddyfile.bybit-payer
'@ -replace "`r", ""

$caddyScript | ssh -i $SSH_KEY $VPS 'sudo bash -se'
```

Проверка на VPS:

```powershell
ssh -i $SSH_KEY $VPS 'sudo journalctl -u caddy -n 50 --no-pager'
ssh -i $SSH_KEY $VPS 'curl -fsS http://127.0.0.1:8080/api/auth/csrf >/dev/null && echo backend-ok'
```

## 4. Проверка с клиентской стороны

```powershell
curl.exe -fsSI https://bypayer.maltsev.fun/
curl.exe -fsSI https://bypayer.maltsev.fun/favicon.svg
$spa = curl.exe -fsS https://bypayer.maltsev.fun/withdrawals/123
if ($spa -match '<div id="root"></div>') { "spa-routing-ok" } else { throw "SPA fallback failed" }
curl.exe -fsS -D - -o NUL https://bypayer.maltsev.fun/api/auth/csrf
```

В браузере дополнительно проверьте:

- `/` и прямое открытие `/withdrawals/123`;
- отсутствие запросов к `localhost`, IP VPS или отдельному API-домену;
- запросы к `/api/auth/csrf`, `/api/auth/me` и `/api/system/status`;
- cookie `JSESSIONID` и `FLOWPAY_REMEMBER_ME` после входа;
- заголовок `X-CSRF-TOKEN` у изменяющих запросов.
