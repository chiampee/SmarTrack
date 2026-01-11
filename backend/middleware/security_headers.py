"""
Security headers middleware
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    Relaxes CSP for API documentation endpoints (/docs, /redoc)
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers (common for all responses)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # ✅ FIX: Relax CSP for API documentation (Swagger UI needs inline scripts and external CDN)
        if request.url.path.startswith(("/docs", "/redoc", "/openapi.json")):
            # Swagger UI requires 'unsafe-inline' for styles and scripts from CDN
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://cdn.jsdelivr.net; "
                "font-src 'self' data: https://cdn.jsdelivr.net"
            )
        else:
            # Strict CSP for all other endpoints
            response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response

