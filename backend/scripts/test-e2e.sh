#!/usr/bin/env bash
# End-to-End-Smoke-Test für alle Backend-Endpoints aus Phase 2.
# Voraussetzung: dev server läuft auf http://localhost:3000 (npm run dev)
# Aufruf:        bash scripts/test-e2e.sh
#
# Das Skript verlangt einen Supabase-Test-User. Wenn du noch keinen hast:
#   Supabase Dashboard → Authentication → Users → "Add user"
#   E-Mail + Passwort eingeben, "Auto Confirm User" anhaken.

set -uo pipefail

# ── Setup ────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# .env laden (für SUPABASE_URL + SUPABASE_ANON_KEY)
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "FATAL: $BACKEND_DIR/.env nicht gefunden."
  exit 1
fi
set -a
source "$BACKEND_DIR/.env"
set +a

API="http://localhost:3000"

# Farben
RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BLUE=$'\033[34m'; BOLD=$'\033[1m'; RESET=$'\033[0m'

PASS=0
FAIL=0
FAIL_NAMES=()

# JSON-Wert via Python extrahieren (kein jq nötig).
function jval() {
  python3 -c "import json,sys
try:
  d=json.load(sys.stdin)
  for k in '$1'.split('.'):
    if k.isdigit(): d=d[int(k)]
    else: d=d[k]
  print(d if d is not None else '')
except Exception as e:
  sys.exit(2)"
}

# Test-Helper. Args: NAME, EXPECTED_STATUS, METHOD, PATH, BODY (opt), TOKEN (opt)
# Wichtig: Content-Type: application/json wird NUR gesetzt, wenn ein Body
# vorhanden ist — sonst lehnt Fastifys Body-Parser leere Bodies ab.
function api_test() {
  local name="$1"
  local expected="$2"
  local method="$3"
  local path="$4"
  local body="${5:-}"
  local token="${6:-}"

  local -a args=(-s -o /tmp/e2e_body -w "%{http_code}" -X "$method" "$API$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local code
  code=$(curl "${args[@]}")
  if [ "$code" = "$expected" ]; then
    echo "  ${GREEN}✓${RESET} $name ${BLUE}(HTTP $code)${RESET}"
    PASS=$((PASS+1))
    return 0
  else
    echo "  ${RED}✗${RESET} $name ${RED}(HTTP $code, erwartet $expected)${RESET}"
    echo "    Body: $(cat /tmp/e2e_body | head -c 200)"
    FAIL=$((FAIL+1))
    FAIL_NAMES+=("$name")
    return 1
  fi
}

# ── 0. Server lebt ───────────────────────────────────────────────────────────

echo "${BOLD}== 0. Server-Check ==${RESET}"
if ! curl -s -f "$API/health" > /dev/null; then
  echo "${RED}FATAL: Server antwortet nicht auf $API/health.${RESET}"
  echo "Starte den Server in einem anderen Terminal mit: cd $BACKEND_DIR && npm run dev"
  exit 1
fi
echo "  ${GREEN}✓${RESET} Server erreichbar"

# ── 1. Auth: Token via Supabase holen ────────────────────────────────────────

echo ""
echo "${BOLD}== 1. Auth: Token holen ==${RESET}"
if [ -z "${TEST_EMAIL:-}" ]; then
  read -r -p "  Test-User E-Mail: " TEST_EMAIL
fi
if [ -z "${TEST_PASSWORD:-}" ]; then
  read -r -s -p "  Passwort: " TEST_PASSWORD
  echo ""
fi

AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | jval "access_token" 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
  echo "  ${RED}✗ Login fehlgeschlagen.${RESET} Antwort:"
  echo "  $AUTH_RESPONSE"
  exit 1
fi
echo "  ${GREEN}✓${RESET} Token erhalten (${#TOKEN} Zeichen)"

# ── 2. /auth/sync — Profil anlegen ───────────────────────────────────────────

echo ""
echo "${BOLD}== 2. Auth-Sync (Profil anlegen) ==${RESET}"
api_test "POST /auth/sync" 200 POST "/auth/sync" '{"name":"E2E-Tester"}' "$TOKEN"

# ── 3. /me — Profil lesen ────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 3. /me Endpoints ==${RESET}"
api_test "GET  /me"        200 GET   "/me"    "" "$TOKEN"
api_test "PATCH /me"       200 PATCH "/me"    '{"name":"E2E-Tester","alter":24,"kurzbeschreibung":"Smoke-Test"}' "$TOKEN"
api_test "GET  /me ohne Auth = 401" 401 GET   "/me"    "" ""

# ── 4. Katalog (öffentlich) ──────────────────────────────────────────────────

echo ""
echo "${BOLD}== 4. Katalog (sollten alle 200 sein, auch ohne Token) ==${RESET}"
api_test "GET /unis (anon)" 200 GET "/unis" "" ""

# Erste Uni mit mindestens einem Studiengang finden (Seed füllt nur TUB,
# LMU bleibt leer — naives "erste Uni" greift sonst eine ohne Studiengänge).
UNI_ID=""
STUDIENGANG_ID=""
for uid in $(curl -s "$API/unis" | python3 -c "import json,sys
for u in json.load(sys.stdin)['universitaeten']: print(u['id'])"); do
  sid=$(curl -s "$API/unis/$uid/studiengaenge" | python3 -c "import json,sys
sg = json.load(sys.stdin)['studiengaenge']
print(sg[0]['id'] if sg else '')")
  if [ -n "$sid" ]; then
    UNI_ID=$uid
    STUDIENGANG_ID=$sid
    break
  fi
done
if [ -z "$UNI_ID" ] || [ -z "$STUDIENGANG_ID" ]; then
  echo "  ${RED}FATAL: keine Uni mit Studiengängen gefunden. Seed ggf. fehlgeschlagen.${RESET}"
  exit 1
fi
echo "  → Uni mit Daten: $UNI_ID"
echo "  → Studiengang: $STUDIENGANG_ID"

api_test "GET /unis/:id/studiengaenge" 200 GET "/unis/$UNI_ID/studiengaenge" "" ""
api_test "GET /studiengang/:id/moduldatenbank" 200 GET "/studiengang/$STUDIENGANG_ID/moduldatenbank" "" ""

# Erstes Modul aus dem Baum holen — auch hier nicht naiv bereiche.0.module.0,
# weil ein Bereich nur Kinder ohne eigene Module haben kann.
MODUL_ID=$(curl -s "$API/studiengang/$STUDIENGANG_ID/moduldatenbank" | python3 -c "import json,sys
def walk(node):
  for m in node.get('module', []): yield m['id']
  for k in node.get('kinder', []):
    yield from walk(k)
d = json.load(sys.stdin)
for b in d['bereiche']:
  for mid in walk(b):
    print(mid); sys.exit(0)")
echo "  → erstes Modul: $MODUL_ID"
if [ -z "$MODUL_ID" ]; then
  echo "  ${RED}FATAL: kein Modul im Studiengang-Baum.${RESET}"
  exit 1
fi

api_test "GET /modul/:id" 200 GET "/modul/$MODUL_ID" "" ""
api_test "GET /modul/INVALID-UUID = 400" 400 GET "/modul/INVALID" "" ""

# ── 5. /me/kurse — Modul belegen/abwählen ────────────────────────────────────

echo ""
echo "${BOLD}== 5. /me/kurse ==${RESET}"
api_test "POST  /me/kurse (Modul belegen)"  200 POST   "/me/kurse"           "{\"modulId\":\"$MODUL_ID\",\"semester\":3}" "$TOKEN"
api_test "GET   /me/kurse (sollte 1 Eintrag)" 200 GET   "/me/kurse"           ""                                          "$TOKEN"
api_test "POST  /me/kurse erneut (Upsert, kein 409)" 200 POST "/me/kurse"     "{\"modulId\":\"$MODUL_ID\",\"semester\":4}" "$TOKEN"
api_test "DELETE /me/kurse/:id (idempotent)" 204 DELETE "/me/kurse/$MODUL_ID" ""                                          "$TOKEN"
api_test "DELETE /me/kurse/:id erneut (idempotent, 204)" 204 DELETE "/me/kurse/$MODUL_ID" ""                              "$TOKEN"

# ── 6. /personen ─────────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 6. Personen ==${RESET}"
api_test "GET /personen (eigene ausgeschlossen)" 200 GET "/personen" "" "$TOKEN"
api_test "GET /personen ohne Auth = 401"         401 GET "/personen" "" ""

# ── 7. Aktivitäten ───────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 7. Aktivitäten ==${RESET}"
AKT_BODY=$(cat <<EOF
{
  "titel": "E2E-Test-Treffen",
  "beschreibung": "Wird vom Smoke-Test erzeugt — kann nach dem Test gelöscht werden.",
  "bilder": ["https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400"],
  "adresseStrasse": "Auguststraße 24",
  "adressePlzOrt": "10117 Berlin",
  "ortKurz": "E2E-Test",
  "koordinatenLat": 52.5265,
  "koordinatenLng": 13.3952,
  "startAt": "2026-12-31T18:00:00.000Z",
  "dauerMinuten": 120,
  "maxPlaetze": 5,
  "sichtbarkeit": "PUBLIC"
}
EOF
)
api_test "POST /aktivitaeten" 200 POST "/aktivitaeten" "$AKT_BODY" "$TOKEN"
AKT_ID=$(curl -s -X POST "$API/aktivitaeten" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$AKT_BODY" | jval "aktivitaet.id" 2>/dev/null || echo "")
echo "  → erstellte Aktivität: $AKT_ID"

api_test "GET   /aktivitaeten (Liste)"   200 GET "/aktivitaeten"           "" "$TOKEN"
api_test "GET   /aktivitaeten/:id"        200 GET "/aktivitaeten/$AKT_ID"   "" "$TOKEN"
api_test "PATCH /aktivitaeten/:id"        200 PATCH "/aktivitaeten/$AKT_ID" '{"beschreibung":"Aktualisiert via E2E-Test."}' "$TOKEN"
api_test "POST  /aktivitaeten/:id/join (schon Admin) = 400" 400 POST "/aktivitaeten/$AKT_ID/join"   "" "$TOKEN"
api_test "POST  /aktivitaeten/:id/leave (Admin) = 400"       400 POST "/aktivitaeten/$AKT_ID/leave" "" "$TOKEN"

# ── 8. Chats ─────────────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 8. Chats (auto-erzeugt aus Aktivität) ==${RESET}"
CHAT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$API/aktivitaeten/$AKT_ID" | jval "aktivitaet.chatId" 2>/dev/null || echo "")
echo "  → Chat-ID des Treffens: $CHAT_ID"

api_test "GET  /me/chats"                200 GET  "/me/chats"                       "" "$TOKEN"
api_test "POST /chats/:id/messages"      200 POST "/chats/$CHAT_ID/messages"        '{"text":"Hallo aus dem E2E-Test"}' "$TOKEN"
api_test "GET  /chats/:id/messages"      200 GET  "/chats/$CHAT_ID/messages"        "" "$TOKEN"
api_test "POST /chats/:id/read"          200 POST "/chats/$CHAT_ID/read"            "" "$TOKEN"
api_test "POST nachricht ohne Auth"      401 POST "/chats/$CHAT_ID/messages"        '{"text":"sneaky"}' ""

# ── 9. Matching ──────────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 9. Matching ==${RESET}"
api_test "GET /personen/swipe"            200 GET  "/personen/swipe"     "" "$TOKEN"
api_test "GET /me/matches (leer)"         200 GET  "/me/matches"          "" "$TOKEN"
api_test "POST /likes auf sich selbst = 400" 400 POST "/likes"           "{\"likedId\":\"$(echo $AUTH_RESPONSE | jval user.id)\"}" "$TOKEN"

# ── 10. Einladungen ──────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== 10. Einladungen ==${RESET}"
api_test "GET /me/einladungen (leer)"     200 GET  "/me/einladungen"     "" "$TOKEN"

# ── Zusammenfassung ──────────────────────────────────────────────────────────

echo ""
echo "${BOLD}== Zusammenfassung ==${RESET}"
echo "  ${GREEN}Passed:${RESET} $PASS"
echo "  ${RED}Failed:${RESET} $FAIL"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "  ${RED}Fehlgeschlagene Tests:${RESET}"
  for n in "${FAIL_NAMES[@]}"; do echo "    - $n"; done
  exit 1
fi
echo ""
echo "${GREEN}${BOLD}Alle Tests grün. Phase 2 ist bereit zum Mergen.${RESET}"
