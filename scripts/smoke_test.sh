#!/usr/bin/env bash
set -e

BASE_URL="${BASE_URL:-http://127.0.0.1:8003}"
APP_DIR="${APP_DIR:-$HOME/vibeloop-app}"
ENV_FILE="$APP_DIR/backend/.env"

ADMIN_API_KEY_VALUE="${ADMIN_API_KEY:-}"

if [ -z "$ADMIN_API_KEY_VALUE" ] && [ -f "$ENV_FILE" ]; then
  ADMIN_API_KEY_VALUE=$(grep "^ADMIN_API_KEY=" "$ENV_FILE" | cut -d= -f2-)
fi

PASS=0
FAIL=0

test_get() {
  local name="$1"
  local url="$2"
  local header="${3:-}"

  echo "Testing: $name"

  if [ -n "$header" ]; then
    status=$(curl -s -o /tmp/vibeloop_test.json -w "%{http_code}" "$url" -H "$header" || true)
  else
    status=$(curl -s -o /tmp/vibeloop_test.json -w "%{http_code}" "$url" || true)
  fi

  if [ "$status" = "200" ]; then
    echo "PASS: $name"
    PASS=$((PASS+1))
  else
    echo "FAIL: $name HTTP $status"
    cat /tmp/vibeloop_test.json || true
    echo ""
    FAIL=$((FAIL+1))
  fi
}

test_post() {
  local name="$1"
  local url="$2"
  local body="$3"
  local header="${4:-}"

  echo "Testing: $name"

  if [ -n "$header" ]; then
    status=$(curl -s -o /tmp/vibeloop_test.json -w "%{http_code}" \
      -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "$header" \
      -d "$body" || true)
  else
    status=$(curl -s -o /tmp/vibeloop_test.json -w "%{http_code}" \
      -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$body" || true)
  fi

  if [ "$status" = "200" ]; then
    echo "PASS: $name"
    PASS=$((PASS+1))
  else
    echo "FAIL: $name HTTP $status"
    cat /tmp/vibeloop_test.json || true
    echo ""
    FAIL=$((FAIL+1))
  fi
}

echo "Running VibeLoop smoke tests..."
echo "Base URL: $BASE_URL"

test_get "Route Health" "$BASE_URL/api/v1/route-health"
test_get "Home Live" "$BASE_URL/api/v1/content/home-live"
test_get "Reels Live" "$BASE_URL/api/v1/content/reels-live"
test_get "Stories Live" "$BASE_URL/api/v1/content/stories-live"
test_get "Profile Dynamic" "$BASE_URL/api/v1/profile-dynamic?username=@you"
test_get "Search All" "$BASE_URL/api/v1/search/all?q=mira"
test_get "Messages Threads" "$BASE_URL/api/v1/messages/threads"
test_get "Notification Summary" "$BASE_URL/api/v1/notification-summary"
test_get "Wallet" "$BASE_URL/api/v1/wallet"
test_get "Ads" "$BASE_URL/api/v1/ads"
test_get "Verification Requests" "$BASE_URL/api/v1/verification-requests"

test_post "Create Test Post" "$BASE_URL/api/v1/content/post" '{"title":"Smoke Test Post","caption":"Backend smoke test post","mediaUrl":"","mediaType":"image"}'
test_post "Admin Login" "$BASE_URL/api/v1/auth/admin-login" '{"email":"admin@vibeloop.app","password":"Admin@12345"}' || true

if [ -n "$ADMIN_API_KEY_VALUE" ]; then
  test_get "Admin Users Protected" "$BASE_URL/api/v1/admin/users" "X-Admin-Api-Key: $ADMIN_API_KEY_VALUE"
  test_get "Admin QA Protected" "$BASE_URL/api/v1/admin/system/qa" "X-Admin-Api-Key: $ADMIN_API_KEY_VALUE"
  test_get "Admin Audit Protected" "$BASE_URL/api/v1/admin/audit-logs" "X-Admin-Api-Key: $ADMIN_API_KEY_VALUE"
else
  echo "Skipping admin protected tests because ADMIN_API_KEY was not found."
fi

echo "--------------------------------"
echo "Smoke test finished."
echo "PASS: $PASS"
echo "FAIL: $FAIL"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

exit 0
