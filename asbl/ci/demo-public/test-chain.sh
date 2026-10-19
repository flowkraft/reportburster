#!/bin/bash
# Throwaway test of the public demo's two nginx hops, with TLS and a real browser, before anything is put on a gateway.
#
#   browser -> door (the storefront's vhost) -> origin (the bkstg gateway's vhost) -> a running DataPallas server
#
# It starts two nginx containers of the gateways' own image on the docker network, configured with the REAL files of this folder (only the
# certificates, the host names behind them and the backend are swapped), then:
#   1. opens the three dashboards in headless Chrome through the door and presses everything (check-frames.mjs) - any request the
#      allowlist or the origin refuses fails the test, and so does a Country Sales page without its "Take the Tour" button;
#   2. checks what must NOT work: the sign-in page, the admin API, a POST to a dashboard, a path walked out of /dashboard/, the
#      origin asked directly by anybody but the door;
#   3. checks the door's rate limit and what it says about caching and framing.
# Nothing of production is touched. The tokens are read from a file and never printed.
#
#   bash asbl/ci/demo-public/test-chain.sh
#
# Settings (environment):
#   DEMO_TEST_BACKEND      host:port of a running DataPallas server on the network       (default datapallas-dev:9090, the dev one)
#   DEMO_TEST_TOKENS_FILE  a file with DEMO_TOKEN_COUNTRY_SALES / _DASHBOARD_DEMOS / _CUBE_STORIES lines  (default: the dev website's .env.local)
#   DEMO_TEST_NET          the docker network                                           (default bridge_current_host_cross_containers_net)
# The last line says what happened: DEMO_CHAIN result=pass|fail
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../.." && pwd)
NET=${DEMO_TEST_NET:-bridge_current_host_cross_containers_net}
BACKEND=${DEMO_TEST_BACKEND:-datapallas-dev:9090}
TOKENS_FILE=${DEMO_TEST_TOKENS_FILE:-$(dirname "$(dirname "$REPO")")/company-biz/flowkraft/www/reportburster.com/.env.local}
GATEWAY_CONF=${DEMO_TEST_GATEWAY_CONF:-/var/kraft-internalsystems/rproxy-gateway-bkstg/config/nginx}   # for nginxconfig.io/*.conf
NGINX_IMAGE=${DEMO_TEST_NGINX_IMAGE:-nginx:1.21.6-alpine}                                               # what both gateways run
PW_IMAGE=${DEMO_TEST_PW_IMAGE:-custom-virgil-pers-apps-agent-browser-playwright:latest}
DOOR=demo-test-door
ORIGIN=demo-test-origin

say() { echo "$(date -u +%H:%M:%S) $*"; }
fail=0
check() {  # check <what> <expected> <got>
  if [ "$2" = "$3" ]; then say "ok    $1 -> $3"; else say "FAIL  $1 -> $3 (expected $2)"; fail=1; fi
}

TMP=$(mktemp -d /tmp/demo-chain.XXXXXX)
chmod 755 "$TMP"
cleanup() { docker rm -f "$DOOR" "$ORIGIN" >/dev/null 2>&1; rm -rf "$TMP"; }
trap cleanup EXIT

token() { grep -m1 "^$1=" "$TOKENS_FILE" | cut -d= -f2-; }
T_COUNTRY=$(token DEMO_TOKEN_COUNTRY_SALES); T_DEMOS=$(token DEMO_TOKEN_DASHBOARD_DEMOS); T_STORIES=$(token DEMO_TOKEN_CUBE_STORIES)
[ -n "$T_COUNTRY" ] && [ -n "$T_DEMOS" ] && [ -n "$T_STORIES" ] || { say "the three DEMO_TOKEN_* lines are not all in $TOKENS_FILE"; echo "DEMO_CHAIN result=fail reason=no-tokens"; exit 1; }
docker run --rm --network "$NET" --entrypoint sh "$PW_IMAGE" -c "curl -s -o /dev/null -m 10 http://$BACKEND/api/auth/first-run" ||
  { say "no DataPallas server answers on $BACKEND"; echo "DEMO_CHAIN result=fail reason=no-backend"; exit 1; }

# a certificate for all three names, trusted by the door (that is the door's proxy_ssl_verify on, tested for real)
openssl req -x509 -newkey rsa:2048 -nodes -days 2 -keyout "$TMP/k.pem" -out "$TMP/c.pem" -subj /CN=demo-test \
  -addext "subjectAltName=DNS:demo.datapallas.com,DNS:dp-demo-public.bkstg.flowkraft.com,DNS:$ORIGIN" 2>/dev/null || { echo "DEMO_CHAIN result=fail reason=openssl"; exit 1; }
chmod 644 "$TMP/k.pem" "$TMP/c.pem"

# the real files, with only the certificate paths, the origin's name and the backend swapped
swap_certs() {
  sed -e 's#/etc/letsencrypt/live/[^/]*/fullchain.pem#/t/c.pem#' -e 's#/etc/letsencrypt/live/[^/]*/privkey.pem#/t/k.pem#' -e '/ssl_trusted_certificate  *\/etc\/letsencrypt/d'
}
nginx_conf() {
  printf 'events {}\nhttp {\n  include /etc/nginx/mime.types;\n  resolver 127.0.0.11 valid=5s;\n  include /t/allowlist.conf;\n  include /t/vhost.conf;\n}\n'
}
start_nginx() {  # start_nginx <name> <vhost file>
  mkdir -p "$TMP/$1"
  nginx_conf > "$TMP/$1/nginx.conf"
  docker run -d --rm --name "$1" --network "$NET" \
    -v "$TMP/$1/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$HERE/allowlist.http.conf:/t/allowlist.conf:ro" -v "$2:/t/vhost.conf:ro" \
    -v "$TMP/c.pem:/t/c.pem:ro" -v "$TMP/k.pem:/t/k.pem:ro" -v "$GATEWAY_CONF/nginxconfig.io:/etc/nginx/nginxconfig.io:ro" \
    "$NGINX_IMAGE" >/dev/null
}
ip_of() { docker inspect -f "{{(index .NetworkSettings.Networks \"$NET\").IPAddress}}" "$1"; }

swap_certs < "$HERE/door.storefront.conf" \
  | sed -e "s#proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;#proxy_ssl_trusted_certificate /t/c.pem;#" \
        -e "s#set \$demo_origin_host dp-demo-public.bkstg.flowkraft.com;#set \$demo_origin_host $ORIGIN;#" > "$TMP/door.conf"
start_nginx "$DOOR" "$TMP/door.conf"
DOOR_IP=$(ip_of "$DOOR")

swap_certs < "$HERE/origin.bkstg.conf" \
  | sed -e "s#@DOOR_IP@#$DOOR_IP#" -e "s#http://datapallas-demo-public:9090#http://$BACKEND#" > "$TMP/origin.conf"
start_nginx "$ORIGIN" "$TMP/origin.conf"
sleep 2
for c in "$DOOR" "$ORIGIN"; do
  docker exec "$c" nginx -t >"$TMP/$c.t" 2>&1 || { say "FAIL  nginx -t in $c:"; cat "$TMP/$c.t"; echo "DEMO_CHAIN result=fail reason=nginx-t"; exit 1; }
done
say "both nginx configurations load (door $DOOR_IP, origin $(ip_of "$ORIGIN"), backend $BACKEND)"

curlc() { docker run --rm --network "$NET" --add-host "demo.datapallas.com:$DOOR_IP" --entrypoint curl "$PW_IMAGE" -sk -m 30 "$@"; }

# 1. the browser
say "browser: the three dashboards through the door"
chmod 777 "$TMP"; mkdir -p "$TMP/shots"; chmod 777 "$TMP/shots"
docker run --rm --network "$NET" --add-host "demo.datapallas.com:$DOOR_IP" \
  -e DEMO_BASE=https://demo.datapallas.com -e DEMO_INSECURE=1 -e DEMO_SHOTS=/shots \
  -e DEMO_TOKEN_COUNTRY_SALES="$T_COUNTRY" -e DEMO_TOKEN_DASHBOARD_DEMOS="$T_DEMOS" -e DEMO_TOKEN_CUBE_STORIES="$T_STORIES" \
  -v "$HERE/check-frames.mjs:/app/check-frames.mjs:ro" -v "$TMP/shots:/shots" -w /app "$PW_IMAGE" node check-frames.mjs 2>&1 | sed 's/^/        /'
[ "${PIPESTATUS[0]}" = 0 ] && say "ok    the frames work through both hops" || { say "FAIL  the frames do not work through both hops"; fail=1; }
[ -n "${DEMO_TEST_SHOTS:-}" ] && cp -r "$TMP/shots/." "$DEMO_TEST_SHOTS/" 2>/dev/null

# 2. what must not work
code() { curlc -o /dev/null -w '%{http_code}' "$@"; }
D=https://demo.datapallas.com
check "GET /"                                   404 "$(code "$D/")"
check "GET /api/auth/first-run"                 404 "$(code "$D/api/auth/first-run")"
check "GET /api/users"                          404 "$(code "$D/api/users")"
check "GET /actuator/health"                    404 "$(code "$D/actuator/health")"
check "POST /dashboard/g-cube-country-sales"    404 "$(code -X POST "$D/dashboard/g-cube-country-sales?token=$T_COUNTRY")"
check "a dashboard that is not one of the three" 404 "$(code "$D/dashboard/g-dd-sales-overview?token=$T_COUNTRY")"
check "a path walked out of /dashboard/"        404 "$(code --path-as-is "$D/dashboard/g-cube-country-sales/../../api/auth/first-run")"
check "the origin asked directly (not the door)" 403 "$(docker run --rm --network "$NET" --entrypoint curl "$PW_IMAGE" -sk -m 30 -o /dev/null -w '%{http_code}' -H 'Host: demo.datapallas.com' "https://$ORIGIN/dashboard/g-cube-country-sales?token=$T_COUNTRY")"
check "a dashboard with the right link"         200 "$(code "$D/dashboard/g-cube-country-sales?token=$T_COUNTRY")"
WRONG=$(code "$D/dashboard/g-cube-country-sales?token=not-a-link")
[ "$WRONG" != 200 ] && say "ok    a dashboard with a wrong link -> $WRONG (the application's answer, not 200)" || { say "FAIL  a wrong link opens the dashboard"; fail=1; }
check "a POST from another site's origin"        403 "$(code -X POST -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{}' "$D/api/analytics/pivot")"

# 3. headers and the rate limit
HEADERS=$(curlc -D - -o /dev/null "$D/dashboard/g-cube-country-sales?token=$T_COUNTRY" | tr -d '\r')
printf '%s\n' "$HEADERS" | grep -i '^content-security-policy:' | grep -q "frame-ancestors[^;]*https://datapallas.com" &&
  say "ok    the application's frame-ancestors reaches the browser (datapallas.com may frame)" || { say "FAIL  no frame-ancestors with https://datapallas.com in the response"; fail=1; }
printf '%s\n' "$HEADERS" | grep -qi '^cache-control: no-cache' && say "ok    Cache-Control: no-cache" || { say "FAIL  no Cache-Control: no-cache"; fail=1; }
printf '%s\n' "$HEADERS" | grep -qi '^x-frame-options' && { say "FAIL  an X-Frame-Options header would stop the framing"; fail=1; } || say "ok    no X-Frame-Options"
LIMITED=$(docker run --rm --network "$NET" --add-host "demo.datapallas.com:$DOOR_IP" --entrypoint sh "$PW_IMAGE" -c \
  "seq 1 600 | xargs -P 60 -I{} curl -sk -m 20 -o /dev/null -w '%{http_code}\n' $D/rb-webcomponents/themes.css | sort | uniq -c | tr '\n' ' '")
say "600 quick requests to one file: $LIMITED"
case "$LIMITED" in *" 429 "*) say "ok    the rate limit answers 429 when one address floods" ;; *) say "FAIL  no 429 in a flood of 600"; fail=1 ;; esac

if [ "$fail" = 0 ]; then echo "DEMO_CHAIN result=pass"; else echo "DEMO_CHAIN result=fail"; exit 1; fi
