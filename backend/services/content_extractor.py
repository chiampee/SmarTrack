"""
Content extraction service for URLs
"""

import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Use thread pool for blocking I/O operations
executor = ThreadPoolExecutor(max_workers=5)

async def fetch_and_extract_content(url: str) -> Dict[str, Optional[str]]:
    """
    Fetch URL content and extract text-only content
    
    Returns:
        Dictionary with extracted content fields
    """
    loop = asyncio.get_event_loop()
    
    def extract_sync():
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            # Fetch the URL with timeout
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "meta", "link"]):
                script.decompose()
            
            # Extract title
            title_tag = soup.find('title')
            title = title_tag.get_text().strip() if title_tag else ""
            
            # Extract main content text
            # Try to find main content areas first
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            
            if main_content:
                # Get text content
                text_content = main_content.get_text(separator=' ', strip=True)
            else:
                text_content = soup.get_text(separator=' ', strip=True)
            
            # Limit content length to prevent huge storage
            MAX_CONTENT_LENGTH = 50000  # ~50KB of text
            if len(text_content) > MAX_CONTENT_LENGTH:
                text_content = text_content[:MAX_CONTENT_LENGTH] + "... [truncated]"
            
            # Extract meta description as fallback
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else text_content[:200]
            
            return {
                'title': title,
                'content': text_content,
                'description': description[:500] if description else None,
                'success': True,
                'error': None
            }
            
        except requests.RequestException as e:
            return {
                'title': None,
                'content': None,
                'description': None,
                'success': False,
                'error': f"Failed to fetch URL: {str(e)}"
            }
        except Exception as e:
            return {
                'title': None,
                'content': None,
                'description': None,
                'success': False,
                'error': f"Failed to extract content: {str(e)}"
            }
    
    # Run blocking operation in thread pool
    return await loop.run_in_executor(executor, extract_sync)












