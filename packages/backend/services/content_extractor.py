"""
Web content extraction using BeautifulSoup
"""
import requests
from bs4 import BeautifulSoup
from typing import Dict
from core.config import settings

class ContentExtractor:
    """Extract readable content from URLs"""
    
    @staticmethod
    def fetch_and_extract(url: str) -> Dict[str, any]:
        """Fetch URL and extract content"""
        try:
            # Fetch URL
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; SmarTrack/1.0)'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.text, 'html5lib')
            
            # Extract title
            title_tag = soup.find('title')
            title = title_tag.get_text() if title_tag else "Untitled"
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            text_content = soup.get_text(separator=' ', strip=True)
            
            # Get main content (simplified extraction)
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            if main_content:
                content_html = str(main_content)
            else:
                content_html = response.text
            
            # Calculate size
            content_size = len(content_html.encode('utf-8'))
            
            # Check size limit
            if content_size > settings.MAX_PAGE_SIZE_BYTES:
                raise ValueError(
                    f"Content size ({content_size} bytes) exceeds limit "
                    f"({settings.MAX_PAGE_SIZE_BYTES} bytes)"
                )
            
            return {
                "title": title.strip(),
                "content": content_html,
                "textContent": text_content[:500],  # First 500 chars for excerpt
                "excerpt": text_content[:200],
                "contentSize": content_size,
                "metadata": {
                    "author": None,
                    "siteName": None,
                    "publishedDate": None
                }
            }
            
        except requests.RequestException as e:
            raise ValueError(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to extract content: {str(e)}")
