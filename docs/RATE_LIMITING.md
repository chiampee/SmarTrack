# Rate Limiting Documentation

## Overview

Smart Research Tracker implements client-side rate limiting with user-friendly feedback to prevent abuse and ensure fair usage. Rate limits are **ONLY enforced on Vercel (production)** and bypass local development for convenience.

---

## ✅ Implemented Features

### 1. **Production-Only Enforcement**
- Rate limits are **ONLY active on Vercel** (production environment)
- Local development (`localhost`) bypasses all rate limits
- Consistent with Auth0 approach (production-only)

### 2. **Per-User Rate Limits**
Rate limits are tracked individually per authenticated user (Auth0 `userId`):

| Operation | Limit | Window | Description |
|-----------|-------|--------|-------------|
| `link:create` | 10 requests | 1 minute | Creating new links |
| `link:update` | 30 requests | 1 minute | Updating existing links |
| `link:delete` | 20 requests | 1 minute | Deleting links |
| `ai:chat` | 20 messages | 1 minute | AI chat messages |
| `ai:summary` | 10 requests | 1 minute | AI summaries |
| `bulk:operation` | 5 requests | 1 minute | Bulk operations |
| `api:request` | 100 requests | 1 minute | General API calls |

### 3. **User-Facing Feedback**

#### Visual Banners
- **Warning Banner** (Yellow): Shows when remaining requests < 3
  - Displays: "You have X requests remaining. Limit resets in Xm Ys."
  - Appears automatically before hitting limit
  
- **Rate Limit Exceeded Banner** (Red): Shows when limit reached
  - Displays: "Rate Limit Reached. Please wait Xm Ys before trying again."
  - Prevents frustration with clear countdown

#### Error Messages
- Friendly error messages when limit exceeded
- Specific to each operation type
- Includes retry time information

### 4. **Developer Experience**

**Local Development:**
```bash
pnpm dev
# Console: 🔓 [Rate Limit] Disabled for development environment
```

**Production (Vercel):**
```bash
# Console: 🔒 [Rate Limit] Enabled for production environment
```

---

## Implementation Details

### Core Service

**File:** `src/services/rateLimitService.ts`

```typescript
// Check if we're in production (Vercel)
const isProduction = import.meta.env.PROD && 
  (typeof window !== 'undefined' && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('smartracker.vercel.app') ||
    !window.location.hostname.includes('localhost')
  ));

// Enable rate limiting only in production
export const RATE_LIMIT_ENABLED = isProduction;
```

### React Hook

**File:** `src/hooks/useRateLimit.ts`

```typescript
const { checkLimit, isAllowed, getStatus } = useRateLimit();

// Check and enforce limit (throws RateLimitError if exceeded)
try {
  checkLimit('link:create');
  // Proceed with operation
} catch (error) {
  if (error instanceof RateLimitError) {
    setError(error.message);
  }
}
```

### Visual Component

**File:** `src/components/RateLimitBanner.tsx`

```tsx
// Shows banner when approaching or exceeding limits
<RateLimitBanner operation="link:create" warningThreshold={3} />
```

---

## Usage Examples

### 1. **Link Creation with Rate Limiting**

```tsx
// src/components/links/LinkForm.tsx
import { useRateLimit } from '../../hooks/useRateLimit';
import { RateLimitBanner } from '../RateLimitBanner';

export const LinkForm = () => {
  const { checkLimit } = useRateLimit();

  const handleSubmit = async () => {
    try {
      // Check rate limit first
      checkLimit('link:create');
      
      // Proceed with creation
      await createLink(data);
    } catch (error) {
      if (error instanceof RateLimitError) {
        setFormError(error.message);
        return;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Shows warning/error banner only on Vercel */}
      <RateLimitBanner operation="link:create" />
      
      {/* Rest of form */}
    </form>
  );
};
```

### 2. **AI Chat with Rate Limiting**

```tsx
// src/components/ai/ChatModal.tsx
const send = async (message: string) => {
  try {
    // Check rate limit before sending
    checkLimit('ai:chat');
    
    // Send message
    await chatService.sendMessage(conversation, message);
  } catch (error) {
    if (error instanceof RateLimitError) {
      setRateLimitError(error.message);
      return;
    }
  }
};

return (
  <Modal>
    {/* Shows warning/error banner */}
    <RateLimitBanner operation="ai:chat" />
    
    {/* Rate limit error message */}
    {rateLimitError && <ErrorMessage>{rateLimitError}</ErrorMessage>}
    
    {/* Chat UI */}
  </Modal>
);
```

---

## Customizing Rate Limits

To modify rate limits, edit the configuration in `src/services/rateLimitService.ts`:

```typescript
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'link:create': {
    maxRequests: 10,        // Change this
    windowMs: 60 * 1000,    // Change this (in milliseconds)
    message: 'Custom error message here',
  },
  // Add new operations
  'custom:operation': {
    maxRequests: 50,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: 'You can perform up to 50 operations every 5 minutes.',
  },
};
```

---

## Testing

### Local Development (No Limits)
```bash
pnpm dev
# Visit http://localhost:5174
# Create 100+ links rapidly - no rate limiting
```

### Production Testing (Vercel)
1. Visit https://smartracker.vercel.app
2. Log in with Auth0
3. Try creating 11 links rapidly
4. Should see:
   - Warning banner after 8 links (3 remaining)
   - Error banner on 11th attempt
   - Countdown timer showing reset time

---

## Monitoring

### Client-Side Logs

**Production:**
```javascript
console.log('🔒 [Rate Limit] Enabled for production environment');
```

**Development:**
```javascript
console.log('🔓 [Rate Limit] Disabled for development environment');
```

### Usage Tracking

Rate limits are tracked per user in memory:
```typescript
// Get current status
const status = getStatus('link:create');
console.log(`Remaining: ${status.remaining}`);
console.log(`Resets at: ${new Date(status.resetTime)}`);
```

---

## Architecture

### Flow Diagram

```
User Action (e.g., Create Link)
       ↓
Check Rate Limit (useRateLimit hook)
       ↓
    Production? ──NO──→ Allow (bypass)
       ↓ YES
Check User's Request Count
       ↓
  Within Limit? ──NO──→ Show Error Banner + Block Action
       ↓ YES
Increment Counter → Allow Action
       ↓
Show Warning Banner (if remaining < 3)
```

### Data Structure

```typescript
// Per-user rate limit storage
Map<userId, Map<operation, {
  count: number,
  resetTime: number
}>>

// Example:
{
  "auth0|12345": {
    "link:create": { count: 8, resetTime: 1697864400000 },
    "ai:chat": { count: 15, resetTime: 1697864460000 }
  }
}
```

---

## Security Considerations

### Client-Side vs Server-Side

⚠️ **IMPORTANT:** This is a **client-side** rate limit for UX purposes.

**What it does:**
- ✅ Prevents accidental abuse
- ✅ Provides friendly user feedback
- ✅ Reduces unnecessary server load

**What it doesn't do:**
- ❌ Cannot prevent malicious users who bypass client code
- ❌ Not a replacement for server-side rate limiting

### Recommendations

For production security, implement **server-side rate limiting** on your API endpoints:

1. **Vercel Edge Functions** with rate limiting
2. **API Gateway** rate limiting (e.g., Cloudflare, AWS API Gateway)
3. **Database-level** rate limiting for sensitive operations

Example server-side rate limit (not implemented yet):
```typescript
// api/middleware/rateLimit.ts
export async function checkServerRateLimit(userId: string, operation: string) {
  // Check against Redis/database
  // Return 429 Too Many Requests if exceeded
}
```

---

## Future Enhancements

### Planned Features
- [ ] Server-side rate limiting on API routes
- [ ] Rate limit analytics dashboard
- [ ] Adjustable limits based on user tier (free vs premium)
- [ ] Email notifications for repeated violations
- [ ] IP-based rate limiting for unauthenticated users
- [ ] Redis integration for distributed rate limiting

### Advanced Configuration
- [ ] Dynamic rate limits based on time of day
- [ ] Gradual rate limit increase for trusted users
- [ ] Rate limit exemptions for admins
- [ ] Burst allowance (allow brief spikes)

---

## Troubleshooting

### Issue: Rate limit banner not showing

**Cause:** Running on localhost (development mode)

**Solution:** Deploy to Vercel to test rate limiting

---

### Issue: Rate limits too restrictive

**Cause:** Default limits may be too low for your use case

**Solution:** Edit `RATE_LIMITS` in `src/services/rateLimitService.ts`

---

### Issue: Rate limit not resetting

**Cause:** Cleanup interval not running

**Solution:** Check browser console for cleanup logs. Rate limits auto-expire after window period.

---

## FAQ

**Q: Why are rate limits disabled locally?**  
A: To improve developer experience. No one wants to wait 60 seconds between test runs!

**Q: Can users bypass client-side rate limits?**  
A: Yes, technically. That's why server-side rate limiting is recommended for security.

**Q: How are rate limits stored?**  
A: In memory (JavaScript Map). Resets when page refreshes.

**Q: Can I disable rate limiting on Vercel?**  
A: Not recommended, but you can set `RATE_LIMIT_ENABLED = false` in `rateLimitService.ts`.

**Q: What happens after the rate limit window expires?**  
A: Counter resets automatically. User can make requests again.

---

## Contact

For rate limiting questions or issues:
- Open an issue on GitHub
- Check console logs for rate limit status
- Review security documentation

Last Updated: October 19, 2025

