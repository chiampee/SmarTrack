from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
from datetime import datetime

class GoogleDriveService:
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/drive.file']

    def create_export_doc(self, access_token: str, links: list) -> dict:
        """
        Creates a Google Doc in the user's Drive containing the exported links.
        Returns the file ID and web link.
        """
        try:
            # Create credentials object from the access token
            creds = Credentials(token=access_token, scopes=self.scopes)
            service = build('drive', 'v3', credentials=creds)

            # Generate HTML content
            html_content = self._generate_html_content(links)
            
            # Create file metadata
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            file_metadata = {
                'name': f'SmarTrack Export - {timestamp}',
                'mimeType': 'application/vnd.google-apps.document'
            }

            # Prepare the upload
            # We upload text/html and ask Drive to convert it to a Google Doc
            media = MediaIoBaseUpload(
                io.BytesIO(html_content.encode('utf-8')),
                mimetype='text/html',
                resumable=True
            )

            # Execute the upload
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()

            return {
                "file_id": file.get('id'),
                "web_view_link": file.get('webViewLink')
            }

        except Exception as e:
            print(f"Error uploading to Drive: {e}")
            raise e

    def _generate_html_content(self, links: list) -> str:
        """
        Generates a simple HTML string from the list of links.
        """
        html = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { color: #2c3e50; }
                .link-item { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                .link-title { font-size: 18px; font-weight: bold; color: #1a73e8; text-decoration: none; }
                .link-meta { color: #666; font-size: 12px; margin-top: 5px; }
                .link-summary { margin-top: 10px; line-height: 1.5; }
                .tags { margin-top: 10px; }
                .tag { background: #f1f3f4; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>SmarTrack Export</h1>
            <p>Exported on: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
            <hr>
        """

        for link in links:
            title = link.get('title', 'Untitled')
            url = link.get('url', '#')
            summary = link.get('summary', 'No summary available.')
            tags = link.get('tags', [])
            
            # Format tags
            tags_html = ""
            if tags:
                tags_html = '<div class="tags">' + "".join([f'<span class="tag">{tag}</span>' for tag in tags]) + '</div>'

            html += f"""
            <div class="link-item">
                <a href="{url}" class="link-title" target="_blank">{title}</a>
                <div class="link-meta">{url}</div>
                <div class="link-summary">{summary}</div>
                {tags_html}
            </div>
            """

        html += """
        </body>
        </html>
        """
        return html

