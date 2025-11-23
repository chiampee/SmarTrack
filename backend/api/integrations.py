from fastapi import APIRouter, HTTPException, Depends, Body, Request
from typing import List, Optional
from pydantic import BaseModel
from services.google_drive import GoogleDriveService
from services.auth0_management import Auth0ManagementService
from services.mongodb import get_database
from bson import ObjectId

router = APIRouter()

class ExportRequest(BaseModel):
    link_ids: List[str]
    google_access_token: Optional[str] = None

@router.post("/notebooklm/export")
async def export_to_notebooklm(request: ExportRequest, req: Request):
    """
    Export selected links to a Google Doc in the user's Drive.
    Uses either the provided google_access_token OR fetches one from Auth0 profile if available.
    """
    try:
        # Extract user ID from the request (set by auth middleware usually)
        auth_header = req.headers.get("Authorization")
        user_id = None
        if auth_header and auth_header.startswith("Bearer "):
            try:
                # Quick decode without verify (verification happened in middleware)
                import jwt
                token = auth_header.split(" ")[1]
                decoded = jwt.decode(token, options={"verify_signature": False})
                user_id = decoded.get("sub")
            except Exception:
                pass

        # Determine which token to use
        access_token = request.google_access_token
        
        if access_token:
            print(f"Received explicit Google Access Token from frontend (starts with {access_token[:5]}...)")
        
        # If no token provided, try to fetch from Auth0
        if not access_token and user_id:
            print(f"Attempting to fetch Google Token for user {user_id} from Auth0...")
            access_token = Auth0ManagementService.get_google_access_token(user_id)
            
        if not access_token:
            raise HTTPException(status_code=401, detail="Google Access Token is missing and could not be retrieved.")

        db = await get_database()
        
        # Convert string IDs to ObjectIds
        try:
            object_ids = [ObjectId(id) for id in request.link_ids]
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid link ID format")

        # Fetch links from database
        links_cursor = db.links.find({"_id": {"$in": object_ids}})
        links = await links_cursor.to_list(length=len(object_ids))

        if not links:
            raise HTTPException(status_code=404, detail="No links found for the provided IDs")

        # Fetch collections referenced by links to get Project Names
        collection_ids = {link.get("collectionId") for link in links if link.get("collectionId")}
        collections_map = {}
        if collection_ids:
            try:
                obj_ids = [ObjectId(cid) for cid in collection_ids]
                cols_cursor = db.collections.find({"_id": {"$in": obj_ids}})
                cols = await cols_cursor.to_list(length=len(collection_ids))
                for col in cols:
                    collections_map[str(col["_id"])] = col.get("name", "Unknown Project")
            except Exception as e:
                print(f"Error fetching collections: {e}")

        # Normalize link data for the service
        normalized_links = []
        for link in links:
            # Resolve Project Name
            col_id = link.get("collectionId")
            project_name = collections_map.get(col_id, "Unassigned") if col_id else "Unassigned"
            
            # Format Date
            created_at = link.get("createdAt")
            created_at_str = ""
            if created_at:
                if hasattr(created_at, 'strftime'):
                    created_at_str = created_at.strftime("%Y-%m-%d %H:%M")
                else:
                    # Handle string ISO dates if stored as string
                    try:
                        from datetime import datetime
                        if isinstance(created_at, str):
                            # basic iso parsing
                            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                            created_at_str = dt.strftime("%Y-%m-%d %H:%M")
                        else:
                            created_at_str = str(created_at)
                    except:
                        created_at_str = str(created_at)

            normalized_links.append({
                "title": link.get("title", "Untitled"),
                "url": link.get("url", ""),
                "summary": link.get("summary") or link.get("description", "No description available."),
                "tags": link.get("tags", []),
                "category": link.get("category", "Uncategorized"),
                "project": project_name,
                "created_at": created_at_str
            })

        # Initialize service and export
        drive_service = GoogleDriveService()
        result = drive_service.create_export_doc(access_token, normalized_links)

        return {
            "status": "success",
            "fileId": result["file_id"],
            "webViewLink": result["web_view_link"],
            "message": "Export successful. You can now import this document into NotebookLM."
        }

    except Exception as e:
        print(f"Export failed: {str(e)}")
        # If it's a 401 from Google, we should let the frontend know to ask for permission
        if "401" in str(e) or "invalid_grant" in str(e):
             raise HTTPException(status_code=401, detail="Google Access Token expired or invalid.")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
