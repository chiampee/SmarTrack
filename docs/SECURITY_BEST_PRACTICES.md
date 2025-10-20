# Security Best Practices

## User Data Isolation

### ✅ Implemented Features

#### 1. **Multi-User Support via Auth0**
- Every user has a unique `userId` (from Auth0 `sub` field)
- All database records include a `userId` field
- Database schema (v10) includes `userId` indexes for performance

#### 2. **Database-Level Isolation**
- **ALL** database queries filter by `userId`
- `useUserId()` hook provides secure access to authenticated user ID
- `userDataService` enforces userId validation before any operation
- Data can NEVER leak between users

#### 3. **Authentication Flow**
- Auth0 handles all authentication
- Production-only: Auth bypassed in development with mock user
- `AuthProvider` wraps the entire app
- `ProtectedRoute` components guard sensitive pages

### Security Rules

1. **NEVER trust client input for userId** - Always get from authenticated session
2. **ALWAYS filter queries by userId** - Use `userDataService` or `useUserData()` context
3. **NEVER bypass authentication** - Use `useAuth()` to check `isAuthenticated`
4. **ALWAYS validate userId exists** - Check for null before database operations

---

## Rate Limiting

### Recommended Implementation

Rate limiting should be implemented at multiple levels:

#### 1. **Auth0 Rate Limits** (Built-in)
Auth0 provides automatic rate limiting:
- Login attempts: 10 attempts per IP per hour
- API calls: Varies by plan
- Configure in Auth0 Dashboard → Attack Protection → Brute Force Protection

#### 2. **API Endpoint Rate Limits** (Vercel)
For API routes (`/api/*`), implement rate limiting using:

```typescript
// api/middleware/rateLimit.ts
import { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(req: NextRequest, maxRequests = 100, windowMs = 60000) {
  const identifier = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const userLimit = rateLimit.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (userLimit.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) };
  }
  
  userLimit.count++;
  return { allowed: true };
}
```

#### 3. **AI Service Rate Limits**
For OpenAI/AI services:

```typescript
// src/services/aiService.ts
const AI_RATE_LIMITS = {
  requestsPerMinute: 20,
  requestsPerHour: 500,
  tokensPerDay: 100000
};

// Track usage per user
const userUsage = new Map<string, {
  minute: { count: number; reset: number };
  hour: { count: number; reset: number };
  day: { tokens: number; reset: number };
}>();

export async function checkAIRateLimit(userId: string) {
  // Implementation
}
```

#### 4. **Database Operation Limits**
Prevent abuse of database operations:

```typescript
// src/services/userDataService.ts
const DB_RATE_LIMITS = {
  linksPerDay: 1000,
  chatMessagesPerHour: 100,
  bulkOperationsPerHour: 10
};
```

### Rate Limit Response Headers

Always include rate limit headers in API responses:

```typescript
return Response.json(data, {
  headers: {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '87',
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': retryAfter.toString()
  }
});
```

### Monitoring & Alerts

1. **Log rate limit violations**
   - Track which users/IPs hit limits
   - Alert on unusual patterns

2. **Implement exponential backoff**
   - Increase penalties for repeated violations
   - Temporary blocks for severe abuse

3. **User-facing feedback**
   - Show friendly error messages
   - Display time until reset
   - Suggest reducing frequency

---

## Additional Security Measures

### 1. **Input Validation**
- Validate ALL user inputs
- Sanitize URLs before saving
- Escape content before rendering

### 2. **CORS Configuration**
```typescript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://smartracker.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

### 3. **Content Security Policy**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 4. **Secrets Management**
- NEVER commit secrets to git
- Use environment variables
- Rotate API keys regularly
- Use different keys for dev/prod

### 5. **Dependency Security**
```bash
# Regular security audits
pnpm audit
pnpm audit --fix

# Keep dependencies updated
pnpm update --latest
```

---

## Security Checklist

- [x] Auth0 authentication implemented
- [x] User data isolated by userId
- [x] All queries filter by userId
- [x] Protected routes implemented
- [x] Environment variables secured
- [x] HTTPS enforced (Vercel default)
- [x] **Client-side rate limiting implemented (production-only)**
- [x] **User-facing rate limit feedback with visual banners**
- [x] **Rate limiting on link operations (create/update/delete)**
- [x] **Rate limiting on AI services (chat/summaries)**
- [ ] Server-side rate limiting on API endpoints (recommended)
- [ ] Rate limiting monitoring/alerts dashboard
- [ ] Input validation on all forms
- [ ] CSP headers configured
- [ ] Regular security audits scheduled

**Note:** See [RATE_LIMITING.md](./RATE_LIMITING.md) for detailed rate limiting documentation.

---

## Incident Response

If a security issue is discovered:

1. **Assess the impact** - How many users affected?
2. **Contain the breach** - Disable affected endpoints
3. **Notify users** - If data was exposed
4. **Fix the vulnerability** - Deploy patch immediately
5. **Post-mortem** - Document what happened and how to prevent it

---

## Contact

For security concerns, contact: [Your Security Email]

Last Updated: October 19, 2025

