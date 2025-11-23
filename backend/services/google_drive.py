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
                body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                .link-item { margin-bottom: 40px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background-color: #fff; }
                .link-title { font-size: 20px; font-weight: bold; color: #1a73e8; text-decoration: none; display: block; margin-bottom: 5px; }
                .link-url { color: #006621; font-size: 14px; margin-bottom: 15px; word-break: break-all; }
                
                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
                .meta-table td { padding: 4px 8px; border: 1px solid #eee; }
                .meta-label { font-weight: bold; background-color: #f8f9fa; width: 100px; color: #555; }
                .meta-value { color: #333; }
                
                .link-summary-container { background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #1a73e8; }
                .summary-label { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #777; margin-bottom: 5px; }
                
                .tags { margin-top: 15px; }
                .tag { background: #e8f0fe; color: #1a73e8; padding: 3px 10px; border-radius: 15px; font-size: 12px; margin-right: 5px; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>SmarTrack Research Export</h1>
            <p style="color: #666; font-size: 14px;">Generated on """ + datetime.now().strftime("%B %d, %Y at %I:%M %p") + """</p>
            <br>
        """

        for link in links:
            title = link.get('title', 'Untitled')
            url = link.get('url', '#')
            summary = link.get('summary', 'No summary available.')
            tags = link.get('tags', [])
            category = link.get('category', 'Uncategorized')
            project = link.get('project', 'Unassigned')
            created_at = link.get('created_at', '')
            
            # Format tags
            tags_html = ""
            if tags:
                tags_html = '<div class="tags">' + "".join([f'<span class="tag">{tag}</span>' for tag in tags]) + '</div>'

            html += f"""
            <div class="link-item">
                <a href="{url}" class="link-title" target="_blank">{title}</a>
                <div class="link-url">{url}</div>
                
                <table class="meta-table">
                    <tr>
                        <td class="meta-label">Category</td>
                        <td class="meta-value">{category}</td>
                        <td class="meta-label">Project</td>
                        <td class="meta-value">{project}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Saved On</td>
                        <td class="meta-value">{created_at}</td>
                        <td class="meta-label">Tags</td>
                        <td class="meta-value">{", ".join(tags) if tags else "-"}</td>
                    </tr>
                </table>

                <div class="link-summary-container">
                    <div class="summary-label">Description / Summary</div>
                    {summary}
                </div>
            </div>
            """

        html += """
        </body>
        </html>
        """
        return html
