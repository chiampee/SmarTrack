# Security Features

## Overview
This document describes the security features implemented in the SmarTrack API backend.

## 1. Rate Limiting ✅

### Limits Configured:
- **Per Minute**: 60 requests
- **Per Hour**: 1,000 requests
- **Per Day**: 5,000 requests

### Implementation:
- Rate limiting is applied to all API endpoints except `/api/health`
- Uses in-memory storage (consider Redis for production)
- Based on client IP address
- Returns HTTP 429 (Too Many Requests) when limits are exceeded
- Includes `Retry-After` header in rate limit responses

### Code Location:
- `backend/middleware/rate_limiter.py` - Rate limiting logic
- `backend/main.py` - Middleware registration

### Testing:
```bash
# Make more than 60 requests to trigger rate limit
for i in {1..70}; do curl -s http://localhost:8000/api/links; done
```

## 2. Security Headers ✅

### Headers Implemented:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` - Forces HTTPS
- `Content-Security-Policy: default-src 'self'` - Restricts resource loading
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - Disables browser features

### Implementation:
- Applied to all API responses
- Configured in `backend/middleware/security_headers.py`

### Testing:
```bash
# Check headers on any endpoint
curl -I http://localhost:8000/api/health
```

## 3. Input Validation ✅

### Validation Rules:
- **URLs**: Max 2048 chars, must be valid HTTP/HTTPS, no XSS patterns
- **Titles**: Max 500 chars, required, no XSS patterns
- **Descriptions**: Max 10,000 chars, optional, XSS filtered
- **Tags**: Max 100 per tag, 50 tags max, XSS filtered
- **Categories**: Max 100 chars, required

### XSS Prevention:
- Removes dangerous HTML tags (`<script>`, `javascript:`, etc.)
- Filters event handlers (`onclick`, `onload`, etc.)
- Blocks data URIs with HTML content

### Implementation:
- `backend/middleware/input_validation.py` - Validation utilities
- Applied during link creation and updates
- Already integrated in `backend/api/links.py`

### Example:
```python
from middleware.input_validation import InputValidator

# Validate URL
url = InputValidator.validate_url(user_input)

# Validate title
title = InputValidator.validate_title(user_input)

# Validate tags
tags = InputValidator.validate_tags(user_tags)
```

## 4. Request Size Limits ✅

### Limits:
- Maximum request body size: 10MB (FastAPI default)
- Maximum URL length: 2048 characters
- Maximum JSON payload: Controlled by request validation

### Implementation:
- Enforced by FastAPI automatically
- Custom limits in `backend/core/config.py`

## 5. CORS Configuration ✅

### Allowed Origins:
- `http://localhost:3001`
- `http://localhost:3000`
- `http://localhost:5554`
- `http://localhost:8000`
- `https://*.railway.app`
- `https://*.onrender.com`
- `https://*.vercel.app`

### Configuration:
- Credentials allowed
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Authorization, Content-Type

## 6. User Activity Tracking ✅

### Limits Per Hour:
- **Create Operations**: Max 50 links per hour
- **Delete Operations**: Max 30 deletes per hour
- **Update Operations**: Max 100 updates per hour

### Features:
- Automatic blocking of users exceeding limits
- Activity history tracking
- Reset after time windows

### Implementation:
- `backend/services/user_activity.py` - Activity tracker
- Can be integrated into endpoint handlers

### Usage:
```python
from services.user_activity import activity_tracker

# Check if user can perform action
activity_tracker.check_user_limits(user_id)

# Record activity
activity_tracker.record_activity(user_id, "create_link")
```

## 7. Authentication ✅

### Current Implementation:
- Mock authentication for development (returns mock user)
- JWT validation code ready for production
- Auth0 integration prepared

### Production Setup:
1. Uncomment JWT validation code in `backend/services/auth.py`
2. Add `AUTH0_SECRET` to `.env` file
3. Update Auth0 configuration

## 8. Database Security ✅

### MongoDB Security:
- Connection uses TLS with certificate validation
- User isolation by `userId` field
- No raw queries (uses Motor ORM)
- Input sanitization before database operations

## Security Checklist

- [x] Rate limiting
- [x] Security headers
- [x] Input validation
- [x] XSS prevention
- [x] CORS configuration
- [x] Request size limits
- [x] User activity tracking
- [x] SQL injection prevention (N/A - using MongoDB)
- [x] HTTPS enforcement headers
- [x] Content type validation

## Recommendations for Production

1. **Use Redis** for rate limiting (instead of in-memory)
2. **Enable Auth0** authentication (currently mocked)
3. **Use environment variables** for sensitive config
4. **Add request logging** for security auditing
5. **Implement CSRF tokens** for state-changing operations
6. **Add IP whitelisting/blacklisting**
7. **Use database connection pooling** with limits
8. **Add health check** for monitoring
9. **Implement request ID** for tracing
10. **Add API key management** for external clients

## Testing Security Features

```bash
# Test rate limiting
cd backend
python3 test_security.py

# Or manually test:
curl -I http://localhost:8000/api/health  # Check headers
curl http://localhost:8000/api/links      # Check authentication
```

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly. Do not open public issues for security vulnerabilities.

