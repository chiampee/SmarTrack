"""
In-memory storage for development
"""

from typing import Dict, List, Any
from datetime import datetime

# In-memory storage
links_storage: Dict[str, Dict] = {}
collections_storage: Dict[str, Dict] = {}

class InMemoryStorage:
    """Simple in-memory storage for development"""
    
    def __init__(self):
        self.links = {}
        self.collections = {}
    
    # Links operations
    def get_links(self, user_id: str, filters: Dict = None) -> List[Dict]:
        """Get all links for a user"""
        user_links = [link for link in self.links.values() if link.get('userId') == user_id]
        
        if filters:
            if filters.get('isFavorite'):
                user_links = [link for link in user_links if link.get('isFavorite')]
            if filters.get('isArchived'):
                user_links = [link for link in user_links if link.get('isArchived')]
            if filters.get('category'):
                user_links = [link for link in user_links if link.get('category') == filters['category']]
        
        return user_links
    
    def create_link(self, link_data: Dict) -> Dict:
        """Create a new link"""
        link_id = str(len(self.links) + 1)
        link_data['id'] = link_id
        link_data['createdAt'] = datetime.utcnow()
        link_data['updatedAt'] = datetime.utcnow()
        link_data['clickCount'] = 0
        
        self.links[link_id] = link_data
        return link_data
    
    def update_link(self, link_id: str, updates: Dict) -> Dict:
        """Update a link"""
        if link_id not in self.links:
            raise ValueError(f"Link {link_id} not found")
        
        updates['updatedAt'] = datetime.utcnow()
        self.links[link_id].update(updates)
        return self.links[link_id]
    
    def delete_link(self, link_id: str):
        """Delete a link"""
        if link_id in self.links:
            del self.links[link_id]
    
    def count_links(self, user_id: str, filters: Dict = None) -> int:
        """Count links for a user"""
        return len(self.get_links(user_id, filters))

# Global storage instance
storage = InMemoryStorage()












