#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT"
ADMIN="$(cd "$ROOT/../admin" && pwd)"
BASE="http://127.0.0.1:3000"
FAIL=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAIL=1; }

echo "=== client: lint ==="
(cd "$WEB" && npm run lint) && pass "tsc --noEmit" || fail "tsc --noEmit"

echo ""
echo "=== client: build ==="
(cd "$WEB" && npm run build) && pass "next build" || fail "next build"

echo ""
echo "=== client: smoke (dev server) ==="
(cd "$WEB" && npm run dev) &
WEB_PID=$!
trap 'kill $WEB_PID 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  if curl -sf "$BASE/api/platform/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -sf "$BASE/api/platform/health" >/dev/null 2>&1; then
  fail "dev server did not become ready on :3000"
  exit 1
fi
pass "dev server ready"

check_status() {
  local name="$1"
  local method="$2"
  local url="$3"
  local expect="$4"
  local data="${5:-}"
  local code
  if [ "$method" = "GET" ]; then
    code=$(curl -s -o /tmp/meridian_test_body.txt -w "%{http_code}" "$url")
  else
    code=$(curl -s -o /tmp/meridian_test_body.txt -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
  fi
  if [ "$code" = "$expect" ]; then
    pass "$name → HTTP $code"
  else
    fail "$name → expected $expect, got $code (body: $(head -c 200 /tmp/meridian_test_body.txt))"
  fi
}

check_status "GET /" GET "$BASE/" "200"
check_status "GET /app" GET "$BASE/app" "200"
check_status "GET /api/platform/health" GET "$BASE/api/platform/health" "200"

HEALTH=$(cat /tmp/meridian_test_body.txt)
if echo "$HEALTH" | grep -q '"ok":true'; then
  pass "health JSON ok:true"
else
  fail "health JSON missing ok:true"
fi

check_status "POST login (bad creds)" POST "$BASE/api/auth/login" "401" '{"email":"nobody@example.com","password":"wrong"}'

REGISTER_EMAIL="smoke-$(date +%s)@example.com"
REGISTER_BODY="{\"name\":\"Smoke Test\",\"email\":\"$REGISTER_EMAIL\",\"password\":\"testpass1\"}"
check_status "POST register" POST "$BASE/api/auth/register" "200" "$REGISTER_BODY"

TOKEN=$(node -e "const j=JSON.parse(require('fs').readFileSync('/tmp/meridian_test_body.txt','utf8')); if(!j.token) process.exit(1); process.stdout.write(j.token);")
if [ -n "$TOKEN" ]; then
  pass "register returned token"
else
  fail "register missing token"
fi

ME_CODE=$(curl -s -o /tmp/meridian_test_body.txt -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE/api/auth/me")
if [ "$ME_CODE" = "200" ]; then
  pass "GET /api/auth/me with token → 200"
else
  fail "GET /api/auth/me → expected 200, got $ME_CODE"
fi

check_status "GET /invite/fake-token" GET "$BASE/api/invite/not-a-real-token" "404"

kill $WEB_PID 2>/dev/null || true
trap - EXIT
wait $WEB_PID 2>/dev/null || true

echo ""
echo "=== admin: lint ==="
(cd "$ADMIN" && npm run lint) && pass "tsc --noEmit" || fail "tsc --noEmit"

echo ""
echo "=== admin: build ==="
(cd "$ADMIN" && npm run build) && pass "next build" || fail "next build"

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "All tests passed."
  exit 0
else
  echo "Some tests failed."
  exit 1
fi
