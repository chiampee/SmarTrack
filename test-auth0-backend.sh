#!/bin/bash

echo "======================================"
echo "  Auth0 Backend Connection Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://smartrack-back.onrender.com"

echo "Testing backend URL: $BACKEND_URL"
echo ""

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH" | grep -q '"success": true'; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH"
fi
echo ""

# Test 2: Protected endpoint without auth (should fail)
echo "2. Testing protected endpoint WITHOUT auth (should fail)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/links")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Protected endpoint correctly requires authentication${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${YELLOW}⚠️  Unexpected response (might be DEBUG mode)${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# Test 3: Protected endpoint with mock token (DEBUG mode)
echo "3. Testing protected endpoint WITH mock token (DEBUG mode)..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer mock-token-for-development" \
    "$BACKEND_URL/api/links")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Mock authentication working (DEBUG mode enabled)${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${YELLOW}⚠️  Mock auth not working - DEBUG might be disabled${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY"
fi
echo ""

# Test 4: User stats endpoint
echo "4. Testing user stats endpoint WITH mock token..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer mock-token-for-development" \
    "$BACKEND_URL/api/user/stats")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ User stats endpoint working${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ User stats endpoint failed${NC}"
    echo "HTTP Status: $HTTP_CODE"
    echo "$BODY"
fi
echo ""

echo "======================================"
echo "  Test Complete"
echo "======================================"
echo ""
echo "Next step: Get a real Auth0 token and test with that!"
echo "Visit: https://smartrack-back.onrender.com/docs"
echo ""

