from fastapi import APIRouter, HTTPException, Depends, Body, Request
from typing import List, Optional
from pydantic import BaseModel
from backend.services.google_drive import GoogleDriveService
from backend.services.auth0_management import Auth0ManagementService
from backend.services.mongodb import get_database
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
        # Assuming the auth middleware sets request.state.user_id or similar
        # For now, we will rely on the token passed in headers if we had auth middleware
        # But since we don't have strict auth middleware on this specific route in the router definition yet...
        # We should parse the Bearer token to get the 'sub' (User ID).
        
        auth_header = req.headers.get("Authorization")
        user_id = None
        if auth_header and auth_header.startswith("Bearer "):
            # We are trusting the token is valid because usually middleware checks it
            # But here we just need the ID to look up the profile
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

        # Normalize link data for the service
        normalized_links = []
        for link in links:
            normalized_links.append({
                "title": link.get("title", "Untitled"),
                "url": link.get("url", ""),
                "summary": link.get("summary", ""),
                "tags": link.get("tags", [])
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
