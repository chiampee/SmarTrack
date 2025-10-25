"""
Web content extraction using readability
"""
import requests
from readability import Document
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
            
            # Extract content
            doc = Document(response.text)
            
            # Get clean HTML
            content = doc.summary()
            
            # Parse with BeautifulSoup for text extraction
            soup = BeautifulSoup(content, 'lxml')
            text_content = soup.get_text(separator=' ', strip=True)
            
            # Calculate size
            content_size = len(content.encode('utf-8'))
            
            # Check size limit
            if content_size > settings.MAX_PAGE_SIZE_BYTES:
                raise ValueError(
                    f"Content size ({content_size} bytes) exceeds limit "
                    f"({settings.MAX_PAGE_SIZE_BYTES} bytes)"
                )
            
            return {
                "title": doc.title() or "Untitled",
                "content": content,
                "textContent": text_content[:500],  # First 500 chars for excerpt
                "excerpt": text_content[:200],
                "contentSize": content_size,
                "metadata": {
                    "author": None,  # Can be extracted with metadata parsers
                    "siteName": None,
                    "publishedDate": None
                }
            }
            
        except requests.RequestException as e:
            raise ValueError(f"Failed to fetch URL: {str(e)}")
        except Exception as e:
            raise ValueError(f"Failed to extract content: {str(e)}")
