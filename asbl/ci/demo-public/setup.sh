#!/bin/bash
# Puts in place everything the public demo (https://demo.datapallas.com, framed by https://datapallas.com) needs besides the DataPallas
# image itself:
#
#   visitor -> Cloudflare -> DOOR (storefront gateway: allowlist, rate limit) -> ORIGIN (bkstg gateway: only the door may call it)
#           -> datapallas-demo-public (the instance, on internalsystems; its own data folder, never touched by an e2e run)
#
# Safe to run again: it changes only what differs, checks nginx before every reload, and puts the old files back when the check fails.
# Run as root on internalsystems, from the repository:
#
#   bash asbl/ci/demo-public/setup.sh            the instance's folders, its ORIGIN vhost on the bkstg gateway, the publish settings file
#   bash asbl/ci/demo-public/setup.sh --door     the DOOR vhost on the storefront gateway (over ssh)
#   bash asbl/ci/demo-public/setup.sh --check    changes nothing: what is in place, and whether the door reaches the origin
#
# What it does NOT do: publish the instance (dp-ci.sh publish-demo-datapallas.com <TAG>, which also feeds the website), renew the
# storefront's certificate (scripts/certbot-renew-datapallas.com.sh on the storefront), deploy the website (apy plcuw).
# The last line says what happened: DEMO_SETUP result=ok|changed|failed
#
# Places (environment; the defaults are the real ones):
#   DEMO_SETUP_COMPOSE_DIR  the instance's compose folder     (default /var/kraft-internalsystems/apps/program-files/custom-datapallas-demo-public)
#   DEMO_SETUP_DATA_DIR     the instance's data folder        (default /var/kraft-internalsystems/apps/cvs/custom-datapallas-demo-public)
#   DEMO_SETUP_SETTINGS     the publish settings file         (default /var/kraft-internalsystems/config/datapallas-ci/demo-datapallas-com.env)
#   DEMO_SETUP_BKSTG_CONF   the bkstg gateway's nginx folder  (default /var/kraft-internalsystems/rproxy-gateway-bkstg/config/nginx)
#   DEMO_SETUP_BKSTG        the bkstg gateway's container     (default ints-rproxy-gateway-bkstg)
#
# Where the storefront is (its address, its login, its folders) is not in the repository, which is public. It is in a root-only file,
# like win-ci.env: /var/kraft-internalsystems/config/datapallas-ci/demo-public-storefront.env (DEMO_SETUP_STOREFRONT_ENV), with
#   DEMO_SETUP_DOOR_SSH      user@host of the storefront, for ssh; its address is also what the origin lets in
#   DEMO_SETUP_DOOR_CONF     the storefront gateway's nginx folder
#   DEMO_SETUP_DOOR          the storefront gateway's container                 (default rproxy-gateway-storefront)
#   DEMO_SETUP_SITE_ENV      the file the public website reads the demo's share links from (DEMO_SETTINGS_FILE of the website;
#                            it sits in the website's data folder, so the website reads it on every request and needs no restart)
# A variable already set in the environment wins over the file.
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
COMPOSE_DIR=${DEMO_SETUP_COMPOSE_DIR:-/var/kraft-internalsystems/apps/program-files/custom-datapallas-demo-public}
DATA_DIR=${DEMO_SETUP_DATA_DIR:-/var/kraft-internalsystems/apps/cvs/custom-datapallas-demo-public}
SETTINGS=${DEMO_SETUP_SETTINGS:-/var/kraft-internalsystems/config/datapallas-ci/demo-datapallas-com.env}
BKSTG_CONF=${DEMO_SETUP_BKSTG_CONF:-/var/kraft-internalsystems/rproxy-gateway-bkstg/config/nginx}
BKSTG=${DEMO_SETUP_BKSTG:-ints-rproxy-gateway-bkstg}
STOREFRONT_ENV=${DEMO_SETUP_STOREFRONT_ENV:-/var/kraft-internalsystems/config/datapallas-ci/demo-public-storefront.env}
if [ -r "$STOREFRONT_ENV" ]; then
  while IFS='=' read -r k v; do
    case "$k" in
      DEMO_SETUP_DOOR_SSH|DEMO_SETUP_DOOR_CONF|DEMO_SETUP_DOOR|DEMO_SETUP_SITE_ENV) [ -n "${!k:-}" ] || export "$k=$v" ;;
    esac
  done < "$STOREFRONT_ENV"
fi
DOOR_SSH=${DEMO_SETUP_DOOR_SSH:-}
DOOR_IP=${DOOR_SSH#*@}
DOOR_CONF=${DEMO_SETUP_DOOR_CONF:-}
DOOR=${DEMO_SETUP_DOOR:-rproxy-gateway-storefront}
SITE_ENV=${DEMO_SETUP_SITE_ENV:-}
ORIGIN_HOST=dp-demo-public.bkstg.flowkraft.com
PUBLIC_HOST=demo.datapallas.com
ORIGIN_DIR=$BKSTG_CONF/reverse-proxy-confs/bkstg.flowkraft.com

say() { echo "$(date -u +%H:%M:%S) $*"; }
q() { printf '%q' "$1"; }
# need <VARIABLE>...: they must be set, here or in the storefront file
need() {
  local v miss=""
  for v in "$@"; do [ -n "${!v:-}" ] || miss="$miss $v"; done
  [ -z "$miss" ] && return 0
  say "FAIL  not set:$miss - put them in $STOREFRONT_ENV (root only, not in the repository) or in the environment"
  return 1
}
door() { ssh -o BatchMode=yes -o ConnectTimeout=20 "$DOOR_SSH" "$1"; }
# the door file it replaced is kept one folder up: nginx loads EVERY file of sites-enabled, so a copy next to it would define the same zones twice
door_bak() { echo "$(dirname "$(dirname "$1")")/$(basename "$1").before-demo-public"; }

# ---- files that are put in place (or taken out again when nginx refuses them) --------------------------------------------------
# a "place" is one of: here <file>, door <file>; every place keeps the file it replaced as <file>.before-demo-public (door: one folder up, see door_bak)
PLACED=()       # "<where> <dst>" of every file this run changed
CHANGED=0       # something nginx has to be asked about again
ANY_CHANGED=0   # anything at all

# put_file <where> <dst> <source file>   (the source is read from a file so that it works over ssh too)
put_file() {
  local where=$1 dst=$2 src=$3 now
  if [ "$where" = here ]; then now=$(cat "$dst" 2>/dev/null; echo x); else now=$(door "cat $(q "$dst") 2>/dev/null"; echo x); fi
  if [ "$now" = "$(cat "$src"; echo x)" ]; then say "unchanged: ${where/here/this host}:$dst"; return 0; fi
  if [ "$where" = here ]; then
    [ ! -f "$dst" ] || cp -p "$dst" "$dst.before-demo-public"
    mkdir -p "$(dirname "$dst")" && cat "$src" > "$dst" || return 1
  else
    door "if [ -f $(q "$dst") ]; then cp -p $(q "$dst") $(q "$(door_bak "$dst")"); fi; cat > $(q "$dst")" < "$src" || return 1
  fi
  PLACED+=("$where $dst"); CHANGED=1; ANY_CHANGED=1
  say "written:   ${where/here/this host}:$dst"
}

# the files of this run go back to what they were (or go away when they were new)
put_back() {
  local entry where dst
  for entry in "${PLACED[@]}"; do
    where=${entry%% *}; dst=${entry#* }
    if [ "$where" = here ]; then
      if [ -f "$dst.before-demo-public" ]; then mv "$dst.before-demo-public" "$dst"; else rm -f "$dst"; fi
    else
      door "if [ -f $(q "$(door_bak "$dst")") ]; then mv $(q "$(door_bak "$dst")") $(q "$dst"); else rm -f $(q "$dst"); fi"
    fi
  done
  PLACED=()
}

# nginx_apply <where> <container>: check the configuration; reload when it is good, put the files back when it is not
nginx_apply() {
  local where=$1 container=$2 out
  [ "$CHANGED" = 1 ] || { say "nginx in $container: nothing changed, not reloaded"; return 0; }
  if [ "$where" = here ]; then out=$(docker exec "$container" nginx -t 2>&1); else out=$(door "docker exec $(q "$container") nginx -t 2>&1"); fi || {
    say "FAIL  nginx -t in $container refuses the new files - putting the old ones back:"
    printf '%s\n' "$out" | sed 's/^/        /'
    put_back
    return 1
  }
  if [ "$where" = here ]; then docker exec "$container" nginx -s reload >/dev/null 2>&1; else door "docker exec $(q "$container") nginx -s reload" >/dev/null 2>&1; fi ||
    { say "FAIL  nginx -s reload in $container"; return 1; }
  say "nginx in $container: checked and reloaded"
}

# ---- origin side (this host) ---------------------------------------------------------------------------------------------------
setup_origin() {
  need DEMO_SETUP_DOOR_SSH DEMO_SETUP_SITE_ENV || return 1
  say "== the instance's folders"
  mkdir -p "$COMPOSE_DIR" "$DATA_DIR" || return 1
  put_file here "$COMPOSE_DIR/docker-compose.yml" "$HERE/docker-compose.yml" || return 1
  # the compose folder's .env says which image runs; the first publish writes the real tag (dp-ci.sh publish-demo-datapallas.com)
  if [ ! -f "$COMPOSE_DIR/.env" ]; then
    echo "DATAPALLAS_IMAGE=flowkraft/datapallas-server:not-deployed-yet" > "$COMPOSE_DIR/.env" && say "written:   $COMPOSE_DIR/.env (no image yet)"
  fi
  # these two paths are inside the compose file, so a different folder would not be the one that runs
  case "$DATA_DIR" in
    /var/kraft-internalsystems/apps/cvs/custom-datapallas-demo-public) ;;
    *) say "note: DEMO_SETUP_DATA_DIR is not the folder docker-compose.yml mounts - fine for a test, not for the real site" ;;
  esac

  say "== the origin vhost on the bkstg gateway ($BKSTG)"
  CHANGED=0
  put_file here "$ORIGIN_DIR/_demo-public-allowlist.subdomain.conf" "$HERE/allowlist.http.conf" || return 1
  local tmp; tmp=$(mktemp); sed "s#@DOOR_IP@#$DOOR_IP#" "$HERE/origin.bkstg.conf" > "$tmp"
  put_file here "$ORIGIN_DIR/dp-demo-public.subdomain.conf" "$tmp" || { rm -f "$tmp"; return 1; }
  rm -f "$tmp"
  nginx_apply here "$BKSTG" || return 1

  say "== the publish settings file"
  if [ -f "$SETTINGS" ]; then
    say "exists, left as it is: $SETTINGS"
  else
    mkdir -p "$(dirname "$SETTINGS")" || return 1
    ( umask 077
      cat > "$SETTINGS" <<EOF
# Where dp-ci.sh publish-demo-datapallas.com puts the public demo, and what it feeds afterwards (written by asbl/ci/demo-public/setup.sh).
TARGET_HOST=local
TARGET_COMPOSE_DIR=$COMPOSE_DIR
TARGET_DATA_DIR=$DATA_DIR
TARGET_APP=datapallas-demo-public
# empty: the public door answers 404 on / (only the three dashboards are reachable), and the publish smoke test expects the login redirect
TARGET_URL=

# The website that frames the demo (asbl/ci/demo-links.sh): DEMO_URL and the three tokens are written into DEMO_SITE_ENV on the
# storefront; the website reads that file on every request, so there is nothing to restart.
DEMO_URL=https://$PUBLIC_HOST
DEMO_SITE_SSH=$DOOR_SSH
DEMO_SITE_ENV=$SITE_ENV
DEMO_VERIFY_PUBLIC=1
EOF
    ) && chmod 600 "$SETTINGS" && say "written:   $SETTINGS (root only)"
  fi
}

# ---- door side (the storefront) ------------------------------------------------------------------------------------------------
setup_door() {
  need DEMO_SETUP_DOOR_SSH DEMO_SETUP_DOOR_CONF DEMO_SETUP_SITE_ENV || return 1
  say "== the door vhost on the storefront gateway ($DOOR on $DOOR_SSH)"
  door "docker exec $(q "$DOOR") nginx -t" >/dev/null 2>&1 || { say "FAIL  the storefront gateway is not answering to ssh or its nginx is not healthy before we start"; return 1; }
  CHANGED=0
  put_file door "$DOOR_CONF/sites-enabled/_demo-public-allowlist.conf" "$HERE/allowlist.http.conf" || return 1
  put_file door "$DOOR_CONF/sites-enabled/demo.datapallas.com.conf" "$HERE/door.storefront.conf" || return 1
  nginx_apply door "$DOOR" || return 1
  # the file the public website reads the share links from; the publish fills it (demo-links.sh), and a missing one is an error there
  if [ -n "$SITE_ENV" ]; then
    if door "test -e $(q "$SITE_ENV")"; then say "unchanged: door:$SITE_ENV"
    else door "mkdir -p $(q "$(dirname "$SITE_ENV")") && : > $(q "$SITE_ENV") && chmod 644 $(q "$SITE_ENV")" && say "written:   door:$SITE_ENV (empty, filled by the publish)"; ANY_CHANGED=1; fi
  fi
  cert_report
}

# the certificate the door presents is the storefront's datapallas.com one
cert_report() {
  local end
  end=$(door "openssl x509 -noout -enddate -in $(q "$(dirname "$DOOR_CONF")/letsencrypt/live/datapallas.com/fullchain.pem") 2>/dev/null" | sed 's/^notAfter=//')
  if [ -z "$end" ]; then say "note: could not read the storefront's datapallas.com certificate"; return 0; fi
  if door "openssl x509 -noout -checkend 0 -in $(q "$(dirname "$DOOR_CONF")/letsencrypt/live/datapallas.com/fullchain.pem") >/dev/null"; then
    say "storefront certificate datapallas.com: valid until $end"
  else
    PROBLEMS=$((PROBLEMS + 1))
    say "!!! storefront certificate datapallas.com EXPIRED $end - renew it (scripts/certbot-renew-datapallas.com.sh on the storefront)"
  fi
}

# ---- read-only look ------------------------------------------------------------------------------------------------------------
PROBLEMS=0
problem() { PROBLEMS=$((PROBLEMS + 1)); say "$*"; }
check_all() {
  local code st
  need DEMO_SETUP_DOOR_SSH DEMO_SETUP_DOOR_CONF || return 1
  say "== this host"
  [ -f "$COMPOSE_DIR/docker-compose.yml" ] && say "ok    $COMPOSE_DIR/docker-compose.yml" || problem "MISSING $COMPOSE_DIR/docker-compose.yml"
  [ -d "$DATA_DIR" ] && say "ok    $DATA_DIR ($(ls -A "$DATA_DIR" | wc -l) entries; empty = nothing published yet)" || problem "MISSING $DATA_DIR"
  [ -f "$SETTINGS" ] && say "ok    $SETTINGS (mode $(stat -c %a "$SETTINGS"))" || problem "MISSING $SETTINGS"
  for f in _demo-public-allowlist dp-demo-public; do
    [ -f "$ORIGIN_DIR/$f.subdomain.conf" ] && say "ok    origin $f.subdomain.conf" || problem "MISSING origin $f.subdomain.conf"
  done
  if st=$(docker inspect -f '{{.State.Status}} {{.Config.Image}}' datapallas-demo-public 2>/dev/null); then say "ok    instance: $st"
  else problem "MISSING instance: no container datapallas-demo-public (not published yet)"; fi
  say "== the storefront"
  for f in _demo-public-allowlist demo.datapallas.com; do
    door "test -f $(q "$DOOR_CONF/sites-enabled/$f.conf")" && say "ok    door $f.conf" || problem "MISSING door $f.conf"
  done
  cert_report
  say "== the way through"
  code=$(door "curl -sk -m 20 -o /dev/null -w '%{http_code}' -H 'Host: $PUBLIC_HOST' https://$ORIGIN_HOST/")
  case "$code" in
    404) say "ok    the storefront reaches the origin and is let in (404 = the allowlist, as it should be for /)" ;;
    403) problem "FAIL  the origin answers 403 to the storefront: it does not see $DOOR_IP as the caller" ;;
    *)   problem "FAIL  the storefront asking the origin for / got '$code' (expected 404)" ;;
  esac
  code=$(curl -sk -m 20 -o /dev/null -w '%{http_code}' --resolve "$PUBLIC_HOST:443:$DOOR_IP" "https://$PUBLIC_HOST/")
  [ "$code" = 404 ] && say "ok    the door answers for $PUBLIC_HOST (404 on /)" || problem "FAIL  the door asked for / got '$code' (expected 404)"
  code=$(curl -s -m 20 -o /dev/null -w '%{http_code}' "https://$PUBLIC_HOST/")
  [ "$code" = 404 ] && say "ok    https://$PUBLIC_HOST/ from the internet: 404 on /" || problem "FAIL  https://$PUBLIC_HOST/ from the internet got '$code' (expected 404)"
}

rc=0
case "${1:-}" in
  "")      setup_origin || rc=1 ;;
  --door)  setup_door || rc=1 ;;
  --check) check_all || { echo "DEMO_SETUP result=failed"; exit 1; }
           if [ "$PROBLEMS" = 0 ]; then echo "DEMO_SETUP result=ok"; else echo "DEMO_SETUP result=problems count=$PROBLEMS"; fi; exit 0 ;;
  *)       echo "usage: setup.sh [--door | --check]"; exit 2 ;;
esac
if [ "$rc" != 0 ]; then echo "DEMO_SETUP result=failed"; exit 1; fi
if [ "$ANY_CHANGED" = 1 ]; then echo "DEMO_SETUP result=changed"; else echo "DEMO_SETUP result=ok"; fi
