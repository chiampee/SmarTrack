"""
Content extraction service for URLs
"""

import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse, urljoin

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
            
            # Extract favicon before removing link elements
            favicon_url = None
            # Try to find favicon in various ways
            favicon_link = soup.find('link', rel=lambda x: x and ('icon' in x.lower() or 'shortcut' in x.lower()))
            if favicon_link and favicon_link.get('href'):
                favicon_href = favicon_link.get('href')
                # Convert relative URLs to absolute
                if favicon_href.startswith('//'):
                    parsed_url = urlparse(url)
                    favicon_url = f"{parsed_url.scheme}:{favicon_href}"
                elif favicon_href.startswith('/'):
                    parsed_url = urlparse(url)
                    favicon_url = f"{parsed_url.scheme}://{parsed_url.netloc}{favicon_href}"
                elif not favicon_href.startswith('http'):
                    favicon_url = urljoin(url, favicon_href)
                else:
                    favicon_url = favicon_href
            
            # If no favicon found in HTML, try common favicon locations
            if not favicon_url:
                parsed_url = urlparse(url)
                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                # Try common favicon paths
                common_favicon_paths = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png']
                for path in common_favicon_paths:
                    try:
                        test_url = base_url + path
                        test_response = requests.head(test_url, headers=headers, timeout=3, allow_redirects=True)
                        if test_response.status_code == 200:
                            favicon_url = test_url
                            break
                    except:
                        continue
            
            # Fallback to Google's favicon service if still no favicon
            if not favicon_url:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc
                # Use Google's favicon service as fallback
                favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
            
            # Remove script and style elements (but keep link for now if needed)
            for script in soup(["script", "style"]):
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
                'favicon': favicon_url,
                'success': True,
                'error': None
            }
            
        except requests.RequestException as e:
            # Even if fetch fails, try to generate favicon from domain
            favicon_url = None
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc
                favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
            except:
                pass
            return {
                'title': None,
                'content': None,
                'description': None,
                'favicon': favicon_url,
                'success': False,
                'error': f"Failed to fetch URL: {str(e)}"
            }
        except Exception as e:
            # Even if extraction fails, try to generate favicon from domain
            favicon_url = None
            try:
                parsed_url = urlparse(url)
                domain = parsed_url.netloc
                favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"
            except:
                pass
            return {
                'title': None,
                'content': None,
                'description': None,
                'favicon': favicon_url,
                'success': False,
                'error': f"Failed to extract content: {str(e)}"
            }
    
    # Run blocking operation in thread pool
    return await loop.run_in_executor(executor, extract_sync)












