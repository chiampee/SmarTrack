"""
Input validation and sanitization utilities
"""
import re
from typing import Optional
from fastapi import HTTPException

class InputValidator:
    """Validate and sanitize user inputs"""
    
    MAX_URL_LENGTH = 2048
    MAX_TITLE_LENGTH = 500
    MAX_DESCRIPTION_LENGTH = 10000
    MAX_TAG_LENGTH = 100
    MAX_TAGS_COUNT = 50
    MAX_CATEGORY_LENGTH = 100
    
    # XSS prevention patterns
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'data:text/html',
    ]
    
    @staticmethod
    def validate_url(url: str) -> str:
        """Validate and sanitize URL"""
        if not url or not url.strip():
            raise HTTPException(status_code=400, detail="URL is required")
        
        url = url.strip()
        
        # Length check
        if len(url) > InputValidator.MAX_URL_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"URL is too long (max {InputValidator.MAX_URL_LENGTH} characters)"
            )
        
        # Check for dangerous patterns
        url_lower = url.lower()
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, url_lower, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid URL: potentially dangerous content detected"
                )
        
        # Validate URL format
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        if not parsed.scheme:
            # Try adding https://
            url = f"https://{url}"
            parsed = urlparse(url)
        
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(
                status_code=400,
                detail="Invalid URL format"
            )
        
        # Only allow http and https schemes
        if parsed.scheme not in ['http', 'https']:
            raise HTTPException(
                status_code=400,
                detail="Only http and https URLs are allowed"
            )
        
        return url
    
    @staticmethod
    def validate_title(title: str) -> str:
        """Validate and sanitize title"""
        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="Title is required")
        
        title = title.strip()
        
        if len(title) > InputValidator.MAX_TITLE_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Title is too long (max {InputValidator.MAX_TITLE_LENGTH} characters)"
            )
        
        # Check for XSS patterns
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, title, re.IGNORECASE):
                raise HTTPException(
                    status_code=400,
                    detail="Title contains invalid characters"
                )
        
        return title
    
    @staticmethod
    def validate_description(description: Optional[str]) -> Optional[str]:
        """Validate and sanitize description"""
        if not description:
            return None
        
        description = description.strip()
        
        if len(description) > InputValidator.MAX_DESCRIPTION_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Description is too long (max {InputValidator.MAX_DESCRIPTION_LENGTH} characters)"
            )
        
        # Remove potential XSS
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, description, re.IGNORECASE):
                # Remove dangerous content instead of rejecting
                description = re.sub(pattern, '', description, flags=re.IGNORECASE)
        
        return description
    
    @staticmethod
    def validate_tags(tags: list) -> list:
        """Validate and sanitize tags"""
        if not tags:
            return []
        
        if len(tags) > InputValidator.MAX_TAGS_COUNT:
            raise HTTPException(
                status_code=400,
                detail=f"Too many tags (max {InputValidator.MAX_TAGS_COUNT})"
            )
        
        validated_tags = []
        for tag in tags:
            tag = str(tag).strip()
            
            if len(tag) > InputValidator.MAX_TAG_LENGTH:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tag is too long (max {InputValidator.MAX_TAG_LENGTH} characters)"
                )
            
            if not tag:
                continue
            
            # Remove XSS patterns
            for pattern in InputValidator.DANGEROUS_PATTERNS:
                tag = re.sub(pattern, '', tag, flags=re.IGNORECASE)
            
            if tag:  # Only add non-empty tags
                validated_tags.append(tag)
        
        # Remove duplicates
        return list(set(validated_tags))
    
    @staticmethod
    def validate_category(category: str) -> str:
        """Validate and sanitize category"""
        if not category or not category.strip():
            raise HTTPException(status_code=400, detail="Category is required")
        
        category = category.strip()
        
        if len(category) > InputValidator.MAX_CATEGORY_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Category name is too long (max {InputValidator.MAX_CATEGORY_LENGTH} characters)"
            )
        
        # Check for XSS patterns
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, category, re.IGNORECASE):
                category = re.sub(pattern, '', category, flags=re.IGNORECASE)
        
        return category

