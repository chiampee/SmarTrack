# SWR Implementation Security Audit
**Date:** 2025-01-27  
**Component:** SWR Cache Invalidation for Stats  
**Severity Levels:** CRITICAL, HIGH, MEDIUM, LOW, INFO

## Executive Summary

This audit examines the security posture of the SWR (stale-while-revalidate) implementation for real-time stats synchronization. The implementation introduces several security concerns that require immediate attention.

---

## 🔴 CRITICAL ISSUES

### 1. URL Injection / SSRF Vulnerability
**Severity:** CRITICAL  
**Location:** `src/utils/swrFetcher.ts:14-15`

**Issue:**
```typescript
const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`
```

**Vulnerability:**
- If `url` parameter starts with `http`, it bypasses the base URL check
- An attacker could potentially pass malicious URLs like `http://evil.com/api/users/stats`
- This could lead to Server-Side Request Forgery (SSRF) if the backend processes the URL
- Client-side, this could leak tokens to external domains

**Impact:**
- Token exfiltration to attacker-controlled servers
- SSRF attacks if backend processes URLs
- Data leakage

**Recommendation:**
```typescript
export const swrFetcher = async <T = any>(url: string): Promise<T> => {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }

  // SECURITY: Always use base URL, never allow external URLs
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  
  // SECURITY: Validate URL is relative path only
  if (url.startsWith('http://') || url.startsWith('https://')) {
    throw new Error('External URLs not allowed')
  }
  
  // SECURITY: Prevent path traversal
  if (url.includes('..') || url.includes('//')) {
    throw new Error('Invalid URL path')
  }
  
  // SECURITY: Ensure URL starts with / to prevent protocol-relative URLs
  const safeUrl = url.startsWith('/') ? url : `/${url}`
  const fullUrl = `${apiBaseUrl}${safeUrl}`

  // ... rest of implementation
}
```

---

### 2. Token Expiration Not Validated
**Severity:** CRITICAL  
**Location:** `src/utils/swrFetcher.ts:8`

**Issue:**
- SWR fetcher reads token from localStorage without checking expiration
- SWR will continue using expired tokens until they're explicitly invalidated
- This could lead to:
  - Unauthorized access attempts with expired tokens
  - Poor user experience (silent failures)
  - Security logs filled with 401 errors

**Impact:**
- Expired tokens used in requests
- Unnecessary API calls with invalid credentials
- Potential for token replay if expiration check is bypassed

**Recommendation:**
```typescript
import { isTokenExpired } from '../hooks/useBackendApi' // Assuming this exists

export const swrFetcher = async <T = any>(url: string): Promise<T> => {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    throw new Error('Not authenticated')
  }
  
  // SECURITY: Validate token expiration before use
  if (isTokenExpired(token)) {
    localStorage.removeItem('authToken')
    throw new Error('Token expired')
  }

  // ... rest of implementation
}
```

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Error Message Information Disclosure
**Severity:** HIGH  
**Location:** `src/utils/swrFetcher.ts:25-27`

**Issue:**
```typescript
if (!response.ok) {
  const error = await response.json().catch(() => ({ message: 'Request failed' }))
  throw new Error(error.message || `HTTP error! status: ${response.status}`)
}
```

**Vulnerability:**
- Error messages from backend may contain sensitive information
- Stack traces or internal details could be exposed
- HTTP status codes reveal system architecture

**Impact:**
- Information leakage about backend structure
- Potential for enumeration attacks
- Debug information exposure in production

**Recommendation:**
```typescript
if (!response.ok) {
  // SECURITY: Sanitize error messages
  let errorMessage = 'Request failed'
  
  if (response.status === 401) {
    errorMessage = 'Authentication required'
    localStorage.removeItem('authToken') // Clear invalid token
  } else if (response.status === 403) {
    errorMessage = 'Access denied'
  } else if (response.status >= 500) {
    errorMessage = 'Server error' // Don't expose internal errors
  } else {
    // Only show generic client errors
    try {
      const error = await response.json()
      // SECURITY: Sanitize - only show safe, user-facing messages
      if (error.message && typeof error.message === 'string') {
        // Whitelist safe error messages or sanitize
        errorMessage = error.message
      }
    } catch {
      errorMessage = `Request failed (${response.status})`
    }
  }
  
  throw new Error(errorMessage)
}
```

---

### 4. localStorage XSS Vulnerability (Existing)
**Severity:** HIGH  
**Location:** `src/utils/swrFetcher.ts:8`

**Issue:**
- Token stored in localStorage is accessible to any JavaScript running on the page
- XSS attacks can steal tokens directly from localStorage
- This is a pre-existing issue but SWR increases exposure surface

**Impact:**
- Token theft via XSS
- Session hijacking
- Unauthorized access

**Recommendation:**
- Implement Content Security Policy (CSP) headers
- Sanitize all user inputs
- Use httpOnly cookies for token storage (requires backend changes)
- Consider using sessionStorage instead of localStorage (shorter exposure window)
- Implement token refresh mechanism with shorter-lived tokens

**Mitigation (Immediate):**
```typescript
// Add token validation before use
const token = localStorage.getItem('authToken')

// SECURITY: Validate token format (basic check)
if (token && !/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/.test(token)) {
  console.error('[SECURITY] Invalid token format detected')
  localStorage.removeItem('authToken')
  throw new Error('Invalid authentication token')
}
```

---

### 5. Missing Request Timeout
**Severity:** HIGH  
**Location:** `src/utils/swrFetcher.ts:17-23`

**Issue:**
- No timeout configured for fetch requests
- SWR retry mechanism could lead to long-running requests
- Resource exhaustion potential

**Impact:**
- Denial of Service (DoS) if backend is slow
- Browser resource exhaustion
- Poor user experience

**Recommendation:**
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

try {
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    signal: controller.signal,
  })
  clearTimeout(timeoutId)
  // ... rest of code
} catch (error) {
  clearTimeout(timeoutId)
  if (error.name === 'AbortError') {
    throw new Error('Request timeout')
  }
  throw error
}
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Cache Key Manipulation Risk
**Severity:** MEDIUM  
**Location:** `src/hooks/useUserStats.ts:5`, `src/pages/Dashboard.tsx:28`

**Issue:**
- Cache key is a simple string constant
- If cache key could be manipulated, it could lead to cache poisoning
- Currently safe as it's a constant, but pattern could be risky if extended

**Impact:**
- Cache poisoning if keys become dynamic
- Data leakage between users if keys aren't user-specific

**Recommendation:**
- Keep cache keys as constants (current implementation is correct)
- If making keys dynamic in future, ensure user isolation:
```typescript
// If needed in future:
const STATS_KEY = `/api/users/stats?userId=${userId}` // User-specific
```

---

### 7. Missing CSRF Protection
**Severity:** MEDIUM  
**Location:** `src/utils/swrFetcher.ts:17-23`

**Issue:**
- No CSRF token in requests
- Relies solely on Bearer token authentication
- If backend doesn't validate Origin/Referer, vulnerable to CSRF

**Impact:**
- Cross-Site Request Forgery attacks
- Unauthorized actions on behalf of user

**Recommendation:**
- Backend should validate `Origin` or `Referer` headers
- Consider adding CSRF tokens for state-changing operations
- Ensure SameSite cookie attributes if using cookies

**Note:** This is primarily a backend concern, but frontend should be aware.

---

### 8. Excessive Revalidation
**Severity:** MEDIUM  
**Location:** `src/main.tsx:33-34`, `src/hooks/useUserStats.ts:16-17`

**Issue:**
```typescript
revalidateOnFocus: true,
revalidateOnReconnect: true,
```

**Vulnerability:**
- Stats revalidate every time user switches tabs
- Could lead to excessive API calls
- Potential for rate limiting or DoS

**Impact:**
- Unnecessary API load
- Rate limiting issues
- Poor performance

**Recommendation:**
```typescript
revalidateOnFocus: true, // Keep but add debouncing
revalidateOnReconnect: true, // Keep
revalidateIfStale: false, // Don't revalidate if data is fresh
dedupingInterval: 2000, // Dedupe requests within 2 seconds
```

---

### 9. No Request Deduplication
**Severity:** MEDIUM  
**Location:** `src/utils/swrFetcher.ts`

**Issue:**
- Multiple components could trigger simultaneous requests
- SWR handles this, but explicit deduplication interval not set

**Impact:**
- Redundant API calls
- Increased server load

**Recommendation:**
Already handled by SWR, but ensure dedupingInterval is set in SWRConfig.

---

## 🟢 LOW PRIORITY / INFO

### 10. Missing Input Validation in statsFetcher
**Severity:** LOW  
**Location:** `src/utils/swrFetcher.ts:37-60`

**Issue:**
- Response data is not validated before transformation
- Type assertions without runtime validation

**Impact:**
- Potential runtime errors
- Type safety issues

**Recommendation:**
```typescript
// Add runtime validation
if (typeof data.totalLinks !== 'number' || data.totalLinks < 0) {
  throw new Error('Invalid stats data: totalLinks')
}
// ... validate other fields
```

---

### 11. Error Retry Configuration
**Severity:** INFO  
**Location:** `src/main.tsx:36-37`

**Issue:**
- Retry count of 3 with 5s interval could be excessive for auth errors
- Should not retry on 401/403 errors

**Recommendation:**
```typescript
shouldRetryOnError: (error) => {
  // Don't retry on auth errors
  if (error.message?.includes('401') || error.message?.includes('403')) {
    return false
  }
  return true
},
```

---

## Security Best Practices Checklist

### ✅ Implemented
- [x] Token-based authentication
- [x] Error handling structure
- [x] SWR cache invalidation pattern
- [x] Centralized fetcher function

### ❌ Missing
- [ ] URL validation and sanitization
- [ ] Token expiration checking
- [ ] Request timeouts
- [ ] Error message sanitization
- [ ] CSRF protection (backend concern)
- [ ] Input validation for API responses
- [ ] Rate limiting considerations
- [ ] Security headers validation

---

## Recommended Immediate Actions

1. **CRITICAL:** Fix URL validation in `swrFetcher.ts` (Issue #1)
2. **CRITICAL:** Add token expiration validation (Issue #2)
3. **HIGH:** Sanitize error messages (Issue #3)
4. **HIGH:** Add request timeouts (Issue #5)
5. **MEDIUM:** Review revalidation settings (Issue #8)

---

## Testing Recommendations

1. **Penetration Testing:**
   - Test URL injection attempts
   - Test with expired tokens
   - Test XSS scenarios
   - Test CSRF scenarios

2. **Security Scanning:**
   - Run SAST tools on the codebase
   - Use dependency scanning for SWR package
   - Review SWR version for known vulnerabilities

3. **Monitoring:**
   - Log all authentication failures
   - Monitor for unusual request patterns
   - Alert on repeated 401/403 errors

---

## Conclusion

The SWR implementation introduces several security concerns that should be addressed before production deployment. The most critical issues are URL validation and token expiration handling. While the overall architecture is sound, these security gaps could lead to token theft, SSRF attacks, or unauthorized access.

**Overall Security Rating:** 🟡 **MEDIUM RISK** (with critical issues requiring immediate attention)

**Recommendation:** Address CRITICAL and HIGH priority issues before deploying to production.
