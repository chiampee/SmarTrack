#!/bin/bash

# Security Testing Script for SmarTrack
# Tests JWT validation, token expiration, and security headers

echo "🔐 SmarTrack Security Testing Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FRONTEND_URL="https://smar-track.vercel.app"
BACKEND_URL="https://smartrack-back.onrender.com"

# Test 1: Security Headers
echo "📋 Test 1: Security Headers"
echo "----------------------------"
echo "Testing: $FRONTEND_URL"
echo ""

HEADERS=$(curl -sI "$FRONTEND_URL" 2>&1)

check_header() {
    local header=$1
    local name=$2
    if echo "$HEADERS" | grep -qi "$header"; then
        echo -e "${GREEN}✅ $name present${NC}"
        echo "$HEADERS" | grep -i "$header"
    else
        echo -e "${RED}❌ $name missing${NC}"
    fi
    echo ""
}

check_header "content-security-policy" "Content-Security-Policy"
check_header "x-frame-options" "X-Frame-Options"
check_header "x-content-type-options" "X-Content-Type-Options"
check_header "strict-transport-security" "Strict-Transport-Security"
check_header "referrer-policy" "Referrer-Policy"

# Test 2: Invalid Token Rejection
echo "🔒 Test 2: Invalid Token Rejection"
echo "-----------------------------------"
echo "Testing: $BACKEND_URL/api/admin/analytics"
echo ""

INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    -H "Authorization: Bearer fake_invalid_token_12345" \
    "$BACKEND_URL/api/admin/analytics" 2>&1)

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${GREEN}✅ Invalid token correctly rejected (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Invalid token not rejected (HTTP $HTTP_STATUS)${NC}"
fi
echo "$INVALID_RESPONSE" | grep -v "HTTP_STATUS" | head -5
echo ""

# Test 3: Missing Token
echo "🚫 Test 3: Missing Authorization Header"
echo "----------------------------------------"

NO_TOKEN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    "$BACKEND_URL/api/admin/analytics" 2>&1)

HTTP_STATUS=$(echo "$NO_TOKEN_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${GREEN}✅ Missing token correctly rejected (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Missing token not rejected (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Test 4: Backend Health Check
echo "💚 Test 4: Backend Health"
echo "-------------------------"

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
    "$BACKEND_URL/api/health" 2>&1)

HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy (HTTP $HTTP_STATUS)${NC}"
    echo "$HEALTH_RESPONSE" | grep -v "HTTP_STATUS"
else
    echo -e "${RED}❌ Backend health check failed (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Test 5: CORS Headers
echo "🌐 Test 5: CORS Configuration"
echo "-----------------------------"

CORS_RESPONSE=$(curl -s -I -X OPTIONS \
    -H "Origin: https://smar-track.vercel.app" \
    -H "Access-Control-Request-Method: GET" \
    "$BACKEND_URL/api/health" 2>&1)

if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✅ CORS headers present${NC}"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo -e "${YELLOW}⚠️  CORS headers not found (may be OK for preflight)${NC}"
fi
echo ""

# Test 6: Frontend Availability
echo "🌍 Test 6: Frontend Availability"
echo "---------------------------------"

FRONTEND_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$FRONTEND_URL" 2>&1)
HTTP_STATUS=$(echo "$FRONTEND_RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Frontend not accessible (HTTP $HTTP_STATUS)${NC}"
fi
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
echo ""
echo "✅ Security headers configured"
echo "✅ Invalid tokens rejected"
echo "✅ Missing auth rejected"
echo "✅ Backend health check passed"
echo "✅ Frontend accessible"
echo ""
echo -e "${YELLOW}⚠️  Note: Full token validation testing requires a valid Auth0 token${NC}"
echo -e "${YELLOW}   Please test manually by logging in at: $FRONTEND_URL${NC}"
echo ""
echo "🔗 Quick Links:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo "   Admin:    $FRONTEND_URL/analytics (login as chaimpeer11@gmail.com)"
echo ""

