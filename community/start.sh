#!/bin/sh
set -eu
mkdir -p /data
chown nginx:nginx /data
chmod 700 /data
su -s /bin/sh nginx -c 'exec python3 /opt/morph-community/server.py' &
api_pid=$!
nginx -g 'daemon off;' &
nginx_pid=$!
trap 'kill "$api_pid" "$nginx_pid" 2>/dev/null || true; wait; exit 0' TERM INT
while kill -0 "$api_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do sleep 2; done
kill "$api_pid" "$nginx_pid" 2>/dev/null || true
wait || true
exit 1
